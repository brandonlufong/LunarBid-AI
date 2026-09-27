// Clients (Starter and above): save who you bid for, their preferred style, and notes.
// "New proposal" starts the composer with the client's name, tone and length filled in.
import React, { useEffect, useState } from 'react';
import { FilePlus2, Lock, Pencil, Plus, Search, Star, Trash2, Users } from 'lucide-react';
import api from '../../services/api';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { useToast } from '../UI/Toast';
import { Alert, Badge, Button, Card, EmptyState, Field, IconButton, Input, Modal, PageHeader, Select, Skeleton, Textarea, cn } from '../ui';

const EMPTY = { profileName: '', companyName: '', industry: '', contactPerson: '', email: '', phone: '', preferredTone: 'friendly', preferredStyle: 'medium', notes: '', tags: [] };

export default function ClientProfiles({ onStartProposal, onNavigate }) {
  const { t } = useLanguage();
  const toast = useToast();
  const [profiles, setProfiles] = useState(null);
  const [locked, setLocked] = useState(false);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = new, profile = edit
  const [form, setForm] = useState(EMPTY);
  const [tagsText, setTagsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    api.get('/client-profiles')
      .then((r) => { setProfiles(Array.isArray(r.data) ? r.data : []); setFailed(false); })
      .catch((err) => { if (err.response?.status === 403) setLocked(true); else setFailed(true); setProfiles([]); });
  };
  useEffect(load, []);

  const open = (p) => {
    setEditing(p || {});
    setForm(p ? { ...EMPTY, ...p } : EMPTY);
    setTagsText((p?.tags || []).join(', '));
    setFormError('');
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    const payload = {
      profileName: form.profileName, companyName: form.companyName, industry: form.industry, contactPerson: form.contactPerson,
      email: form.email, phone: form.phone, preferredTone: form.preferredTone, preferredStyle: form.preferredStyle, notes: form.notes,
      tags: tagsText.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20),
    };
    try {
      if (editing?._id) await api.put(`/client-profiles/${editing._id}`, payload);
      else await api.post('/client-profiles', payload);
      toast.success(editing?._id ? t('clients.updated') : t('clients.created'));
      setEditing(null);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || t('clients.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const toggleFavorite = async (p) => {
    setProfiles((list) => list.map((x) => (x._id === p._id ? { ...x, isFavorite: !p.isFavorite } : x)));
    try { await api.put(`/client-profiles/${p._id}`, { isFavorite: !p.isFavorite }); }
    catch { load(); toast.error(t('clients.saveError')); }
  };

  const remove = async () => {
    try {
      await api.delete(`/client-profiles/${deleting._id}`);
      setProfiles((list) => list.filter((x) => x._id !== deleting._id));
      toast.success(t('clients.deleted'));
    } catch {
      toast.error(t('clients.deleteError'));
    } finally {
      setDeleting(null);
    }
  };

  if (locked) {
    return (
      <div>
        <PageHeader title={t('clients.title')} description={t('clients.subtitle')} />
        <Card>
          <EmptyState icon={Lock} title={t('clients.lockedTitle')} description={t('clients.lockedBody')}
            actions={<Button onClick={() => onNavigate?.('subscription')}>{t('home.plan.upgrade')}</Button>} />
        </Card>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const shown = (profiles || [])
    .filter((p) => !q || [p.profileName, p.companyName, p.industry, p.contactPerson, ...(p.tags || [])].some((v) => (v || '').toLowerCase().includes(q)))
    .sort((a, b) => Number(!!b.isFavorite) - Number(!!a.isFavorite));

  return (
    <div>
      <PageHeader title={t('clients.title')} description={t('clients.subtitle')}
        actions={<Button leftIcon={Plus} onClick={() => open(null)}>{t('clients.add')}</Button>} />

      {failed && <Alert tone="danger" className="mb-4" action={<Button size="sm" variant="secondary" onClick={load}>{t('common.retry')}</Button>}>{t('clients.loadError')}</Alert>}

      {profiles === null ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : profiles.length === 0 ? (
        <Card><EmptyState icon={Users} title={t('clients.emptyTitle')} description={t('clients.emptyBody')}
          actions={<Button leftIcon={Plus} onClick={() => open(null)}>{t('clients.add')}</Button>} /></Card>
      ) : (
        <>
          <div className="relative mb-4 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <Input type="search" aria-label={t('clients.search')} placeholder={t('clients.search')} value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
          {shown.length === 0 ? (
            <p className="py-8 text-center text-body text-muted">{t('clients.noMatch')}</p>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {shown.map((p) => (
                <li key={p._id}>
                  <Card padded={false} as="article" className="flex h-full flex-col p-5">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-h3 font-semibold text-fg">{p.profileName}</h2>
                        <p className="truncate text-small text-muted">{[p.companyName, p.industry].filter(Boolean).join(' · ') || '—'}</p>
                      </div>
                      <IconButton icon={Star} size="sm" label={p.isFavorite ? t('clients.unfavorite') : t('clients.favorite')} onClick={() => toggleFavorite(p)}
                        className={cn(p.isFavorite && '!text-warning [&_svg]:fill-current')} aria-pressed={!!p.isFavorite} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge>{t(`composer.tones.${p.preferredTone || 'friendly'}`)}</Badge>
                      <Badge>{t(`composer.lengths.${p.preferredStyle || 'medium'}`)}</Badge>
                      {(p.tags || []).slice(0, 3).map((tag) => <Badge key={tag} tone="accent">{tag}</Badge>)}
                    </div>
                    {p.notes && <p className="mt-3 line-clamp-2 text-small text-fg-2">{p.notes}</p>}
                    <div className="mt-auto flex items-center gap-1 pt-4">
                      <Button size="sm" variant="secondary" leftIcon={FilePlus2} className="mr-auto"
                        onClick={() => onStartProposal?.({ clientName: p.contactPerson || p.companyName || p.profileName, tone: p.preferredTone, length: p.preferredStyle })}>
                        {t('clients.newProposal')}
                      </Button>
                      <IconButton icon={Pencil} size="sm" label={t('clients.edit')} onClick={() => open(p)} />
                      <IconButton icon={Trash2} size="sm" variant="danger-ghost" label={t('clients.delete')} onClick={() => setDeleting(p)} />
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} size="lg"
        title={editing?._id ? t('clients.editTitle') : t('clients.addTitle')}
        footer={<>
          <Button variant="secondary" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
          <Button type="submit" form="client-form" loading={saving}>{t('clients.save')}</Button>
        </>}>
        <form id="client-form" onSubmit={save} className="space-y-4">
          {formError && <Alert tone="danger">{formError}</Alert>}
          <Field label={t('clients.name')} required hint={t('clients.nameHint')}>
            <Input required maxLength={100} value={form.profileName} onChange={set('profileName')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('clients.company')} optional={t('common.optional')}><Input maxLength={150} value={form.companyName} onChange={set('companyName')} /></Field>
            <Field label={t('clients.industry')} optional={t('common.optional')}><Input maxLength={100} value={form.industry} onChange={set('industry')} /></Field>
            <Field label={t('clients.contact')} optional={t('common.optional')} hint={t('clients.contactHint')}><Input maxLength={100} value={form.contactPerson} onChange={set('contactPerson')} /></Field>
            <Field label={t('auth.email')} optional={t('common.optional')}><Input type="email" maxLength={254} value={form.email} onChange={set('email')} /></Field>
            <Field label={t('composer.tone')}>
              <Select value={form.preferredTone} onChange={set('preferredTone')}>
                {['formal', 'friendly', 'persuasive'].map((v) => <option key={v} value={v}>{t(`composer.tones.${v}`)}</option>)}
              </Select>
            </Field>
            <Field label={t('composer.length')}>
              <Select value={form.preferredStyle} onChange={set('preferredStyle')}>
                {['short', 'medium', 'detailed'].map((v) => <option key={v} value={v}>{t(`composer.lengths.${v}`)}</option>)}
              </Select>
            </Field>
          </div>
          <Field label={t('clients.tags')} optional={t('common.optional')} hint={t('clients.tagsHint')}><Input value={tagsText} onChange={(e) => setTagsText(e.target.value)} /></Field>
          <Field label={t('clients.notes')} optional={t('common.optional')}><Textarea rows={3} maxLength={5000} value={form.notes} onChange={set('notes')} /></Field>
        </form>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} size="sm" title={t('clients.confirmTitle')}
        description={t('clients.confirmBody', { name: deleting?.profileName || '' })}
        footer={<>
          <Button variant="secondary" onClick={() => setDeleting(null)}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={remove}>{t('clients.delete')}</Button>
        </>}>
        <p className="text-small text-muted">{t('clients.confirmNote')}</p>
      </Modal>
    </div>
  );
}
