// Help & support: open a request (ticket) and see previous ones. Response times come from
// the API for the user's plan and are presented as targets.
import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock, LifeBuoy, Mail } from 'lucide-react';
import api from '../../services/api';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { useToast } from '../UI/Toast';
import { Alert, Badge, Button, Card, CardHeader, EmptyState, Field, Input, PageHeader, Select, Skeleton, Textarea } from '../ui';
import { formatDate } from './proposalMeta.jsx';

const CATEGORIES = ['general', 'technical', 'bug_report', 'billing', 'feature_request'];
const STATUS_TONE = { open: 'accent', in_progress: 'accent', waiting_reply: 'warning', resolved: 'success', closed: 'neutral' };

export default function Support() {
  const { t, currentLanguage } = useLanguage();
  const toast = useToast();
  const [form, setForm] = useState({ category: 'general', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [info, setInfo] = useState(null);
  const [tickets, setTickets] = useState(null);

  const loadTickets = useCallback(() => {
    api.get('/support/tickets').then((r) => setTickets(Array.isArray(r.data) ? r.data : r.data.tickets || [])).catch(() => setTickets([]));
  }, []);
  useEffect(() => {
    api.get('/support/info').then((r) => setInfo(r.data)).catch(() => setInfo({}));
    loadTickets();
  }, [loadTickets]);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/support/tickets', form);
      setSent(true);
      setForm({ category: 'general', subject: '', message: '' });
      loadTickets();
    } catch (err) {
      toast.error(err.response?.data?.message || t('support.error'));
    } finally {
      setSending(false);
    }
  };

  const hours = parseInt(info?.responseTime, 10);

  return (
    <div>
      <PageHeader title={t('support.title')} description={t('support.subtitle')} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card aria-labelledby="new-request">
          <CardHeader titleId="new-request" icon={LifeBuoy} title={t('support.newTitle')} description={t('support.newSubtitle')} />
          {sent ? (
            <div className="space-y-4">
              <Alert tone="success" title={t('support.sentTitle')}>{t('support.sentBody')}</Alert>
              <Button variant="secondary" onClick={() => setSent(false)}>{t('support.another')}</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <Field label={t('support.category')} required>
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{t(`support.categories.${c}`)}</option>)}
                </Select>
              </Field>
              <Field label={t('support.subject')} required>
                <Input required maxLength={150} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </Field>
              <Field label={t('support.message')} required hint={t('support.messageHint')} counter={`${form.message.length} / 5,000`}>
                <Textarea required rows={6} maxLength={5000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </Field>
              <Button type="submit" loading={sending}>{t('support.submit')}</Button>
            </form>
          )}
        </Card>

        <div className="space-y-6">
          <Card aria-labelledby="support-contact">
            <CardHeader titleId="support-contact" title={t('support.contactTitle')} />
            <ul className="space-y-3 text-small">
              <li className="flex gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                <span className="text-fg-2">
                  {info === null ? <Skeleton className="h-4 w-40" /> : Number.isFinite(hours)
                    ? t('support.responseTarget', { hours, plan: t(`shell.plans.${info.plan}`) })
                    : t('support.responseGeneric')}
                </span>
              </li>
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                <span className="text-fg-2">{t('support.emailUs')} <a className="font-medium text-accent-text hover:underline" href="mailto:support@lunarbid.ai">support@lunarbid.ai</a></span>
              </li>
            </ul>
          </Card>

          <Card aria-labelledby="your-requests">
            <CardHeader titleId="your-requests" title={t('support.yourRequests')} />
            {tickets === null ? (
              <div className="space-y-3"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
            ) : tickets.length === 0 ? (
              <EmptyState icon={CheckCircle2} className="!py-6" title={t('support.noRequests')} />
            ) : (
              <ul className="divide-y divide-line">
                {tickets.slice(0, 8).map((tk) => (
                  <li key={tk._id} className="flex items-start gap-3 py-3 first:pt-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body font-medium text-fg">{tk.subject}</p>
                      <p className="text-caption text-muted">{t(`support.categories.${tk.category}`)} · {formatDate(tk.createdAt, currentLanguage)}</p>
                    </div>
                    <Badge tone={STATUS_TONE[tk.status] || 'neutral'}>{t(`support.status.${tk.status}`)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
