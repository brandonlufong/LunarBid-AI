// Email a proposal to a client. Replies go to the freelancer (Reply-To is set by the API).
import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { sendProposal } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { useToast } from '../UI/Toast';
import { Alert, Button, Field, Input, Modal, Textarea } from '../ui';

export default function SendDialog({ open, onClose, proposalId, title, getText, onSent }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const [form, setForm] = useState({ recipientEmail: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const subject = form.subject || t('send.defaultSubject', { title: title || '' });
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await sendProposal(proposalId, { recipientEmail: form.recipientEmail, subject, message: form.message, content: getText() });
      toast.success(t('send.sent', { email: form.recipientEmail }));
      setForm({ recipientEmail: '', subject: '', message: '' });
      onSent?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || t('send.error'));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('send.title')} description={t('send.description')}
      footer={<>
        <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" form="send-form" leftIcon={Send} loading={sending}>{t('send.submit')}</Button>
      </>}>
      <form id="send-form" onSubmit={submit} className="space-y-4" noValidate={false}>
        {error && <Alert tone="danger">{error}</Alert>}
        <Field label={t('send.to')} required>
          <Input type="email" autoComplete="email" required value={form.recipientEmail} placeholder="client@example.com"
            onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })} />
        </Field>
        <Field label={t('send.subject')} required>
          <Input required maxLength={150} value={subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        </Field>
        <Field label={t('send.message')} optional={t('common.optional')} hint={t('send.messageHint')}>
          <Textarea rows={3} maxLength={2000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </Field>
        <p className="text-small text-muted">{t('send.replyNote', { email: user?.email || '' })}</p>
      </form>
    </Modal>
  );
}
