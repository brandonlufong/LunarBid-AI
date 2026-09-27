import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { forgotPassword } from '../../services/api';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { Button, Field, Input } from '../ui';
import AuthShell from './AuthShell';

export default function ForgotPassword() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await forgotPassword(email); } catch { /* same message either way: never reveal whether an account exists */ }
    setSent(true);
    setLoading(false);
  };

  const back = <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-accent-text hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />{t('auth.forgot.back')}</Link>;

  if (sent) {
    return (
      <AuthShell title={t('auth.forgot.sentTitle')} footer={back}>
        <div className="flex gap-3 rounded-md border border-line bg-subtle p-4" role="status">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent-text" aria-hidden="true" />
          <p className="text-body text-fg-2">{t('auth.forgot.sentBody', { email })}</p>
        </div>
      </AuthShell>
    );
  }
  return (
    <AuthShell title={t('auth.forgot.heading')} subtitle={t('auth.forgot.sub')} footer={back}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={t('auth.email')} required>
          <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={loading}>{t('auth.forgot.submit')}</Button>
      </form>
    </AuthShell>
  );
}
