// Branding (Pro): how your shared proposals look to clients. The live preview mirrors the
// header of the public share page, which is the only place branding appears.
import React, { useEffect, useRef, useState } from 'react';
import { ImageUp, Lock, RotateCcw, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { useToast } from '../UI/Toast';
import { Alert, Avatar, Button, Card, CardHeader, EmptyState, Field, Input, Modal, PageHeader, Skeleton } from '../ui';

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export default function Branding({ onNavigate }) {
  const { t } = useLanguage();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [locked, setLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    api.get('/branding')
      .then((r) => setForm({ companyName: '', tagline: '', website: '', primaryColor: '#4f46e5', logoUrl: '', ...r.data.branding }))
      .catch((err) => { if (err.response?.status === 403) setLocked(true); else setError(t('branding.loadError')); setForm({}); });
  }, [t]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setError('');
    if (form.primaryColor && !HEX.test(form.primaryColor)) { setError(t('branding.colorError')); return; }
    setSaving(true);
    try {
      const { companyName, tagline, website, primaryColor } = form;
      await api.put('/branding', { companyName, tagline, website, primaryColor });
      toast.success(t('branding.saved'));
    } catch (err) {
      setError(err.response?.data?.message || t('branding.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const upload = async (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error(t('branding.tooLarge')); return; }
    setUploading(true);
    try {
      const body = new FormData();
      body.append('logo', file);
      const r = await api.post('/branding/logo', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((f) => ({ ...f, logoUrl: r.data.logoUrl }));
      toast.success(t('branding.logoUploaded'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('branding.uploadError'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeLogo = async () => {
    try { await api.delete('/branding/logo'); setForm((f) => ({ ...f, logoUrl: '' })); toast.success(t('branding.logoRemoved')); }
    catch { toast.error(t('branding.saveError')); }
  };

  const reset = async () => {
    try {
      await api.post('/branding/reset');
      setForm({ companyName: '', tagline: '', website: '', primaryColor: '#4f46e5', logoUrl: '' });
      toast.success(t('branding.resetDone'));
    } catch { toast.error(t('branding.saveError')); }
    setConfirmReset(false);
  };

  if (locked) {
    return (
      <div>
        <PageHeader title={t('branding.title')} description={t('branding.subtitle')} />
        <Card><EmptyState icon={Lock} title={t('branding.lockedTitle')} description={t('branding.lockedBody')}
          actions={<Button onClick={() => onNavigate?.('subscription')}>{t('home.plan.upgrade')}</Button>} /></Card>
      </div>
    );
  }

  const accent = HEX.test(form?.primaryColor || '') ? form.primaryColor : '#4f46e5';

  return (
    <div>
      <PageHeader title={t('branding.title')} description={t('branding.subtitle')}
        actions={form?.companyName !== undefined ? <Button variant="ghost" leftIcon={RotateCcw} onClick={() => setConfirmReset(true)}>{t('branding.reset')}</Button> : null} />
      {!form ? <Skeleton className="h-96" /> : (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title={t('branding.details')} />
            <form onSubmit={save} className="space-y-4">
              {error && <Alert tone="danger">{error}</Alert>}
              <div>
                <p className="mb-1.5 text-small font-medium text-fg">{t('branding.logo')}</p>
                <div className="flex items-center gap-3">
                  {form.logoUrl ? <img src={form.logoUrl} alt="" className="h-14 w-14 rounded-md border border-line object-contain" />
                    : <span className="flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-line-strong text-muted"><ImageUp className="h-5 w-5" aria-hidden="true" /></span>}
                  <div className="flex flex-wrap gap-2">
                    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" id="logo-input" tabIndex={-1} aria-hidden="true" onChange={(e) => upload(e.target.files?.[0])} />
                    <Button variant="secondary" size="sm" loading={uploading} onClick={() => fileRef.current?.click()}>{form.logoUrl ? t('branding.replaceLogo') : t('branding.uploadLogo')}</Button>
                    {form.logoUrl && <Button variant="danger-ghost" size="sm" leftIcon={Trash2} onClick={removeLogo}>{t('branding.removeLogo')}</Button>}
                  </div>
                </div>
                <p className="mt-1.5 text-caption text-muted">{t('branding.logoHint')}</p>
              </div>
              <Field label={t('branding.company')} hint={t('branding.companyHint')}><Input maxLength={100} value={form.companyName} onChange={set('companyName')} /></Field>
              <Field label={t('branding.tagline')} optional={t('common.optional')}><Input maxLength={150} value={form.tagline} onChange={set('tagline')} /></Field>
              <Field label={t('branding.website')} optional={t('common.optional')} hint={t('branding.websiteHint')}><Input type="url" maxLength={200} value={form.website} onChange={set('website')} placeholder="https://" /></Field>
              <Field label={t('branding.color')} hint={t('branding.colorHint')}>
                <div className="flex gap-2">
                  <input type="color" value={accent} onChange={set('primaryColor')} aria-label={t('branding.color')} className="h-10 w-12 cursor-pointer rounded-md border border-line-strong bg-surface p-1" />
                  <Input value={form.primaryColor} onChange={set('primaryColor')} maxLength={7} className="max-w-32 font-mono" aria-label={t('branding.colorHex')} />
                </div>
              </Field>
              <Button type="submit" loading={saving}>{t('branding.save')}</Button>
            </form>
          </Card>

          <div className="lg:sticky lg:top-6">
            <p className="mb-2 text-small font-medium text-muted">{t('branding.preview')}</p>
            <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-card" style={{ borderTop: `3px solid ${accent}` }} aria-label={t('branding.preview')}>
              <div className="p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  {form.logoUrl ? <img src={form.logoUrl} alt="" className="h-11 w-11 rounded-md object-contain" /> : <Avatar name={form.companyName || '?'} size={40} />}
                  <div className="min-w-0">
                    <p className="truncate text-body font-semibold text-fg">{form.companyName || t('branding.yourName')}</p>
                    {form.tagline && <p className="truncate text-small text-muted">{form.tagline}</p>}
                    {form.website && <p className="truncate text-caption text-muted">{form.website}</p>}
                  </div>
                </div>
                <p className="font-document text-[1.5rem] font-medium leading-tight text-fg">{t('auth.panel.exampleTitle')}</p>
                <p className="mt-1 text-small text-muted">{t('public.preparedFor', { name: 'Sarah Chen' })}</p>
                <div className="mt-5 space-y-2 border-t border-line pt-5" aria-hidden="true">
                  {[100, 94, 97, 70].map((w, i) => <div key={i} className="h-2.5 rounded bg-subtle" style={{ width: `${w}%` }} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} size="sm" title={t('branding.resetTitle')} description={t('branding.resetBody')}
        footer={<><Button variant="secondary" onClick={() => setConfirmReset(false)}>{t('common.cancel')}</Button><Button variant="danger" onClick={reset}>{t('branding.reset')}</Button></>}>
        <span className="sr-only">{t('branding.resetBody')}</span>
      </Modal>
    </div>
  );
}
