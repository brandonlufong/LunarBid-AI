// Shown until the user confirms their email; AI features need a confirmed address.
import React, { useState } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { resendVerification } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { useToast } from '../UI/Toast';

export default function VerifyEmailBanner() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const [sending, setSending] = useState(false);
  if (!user || user.emailVerified !== false) return null;

  const resend = async () => {
    setSending(true);
    try {
      await resendVerification();
      toast.success(t('auth.verify.resent', { email: user.email }));
    } catch (err) {
      toast.error(err.response?.data?.message || t('auth.verify.resendError'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div role="alert" className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 sm:flex-row sm:items-center dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-100">
      <Mail className="h-5 w-5 shrink-0" aria-hidden="true" />
      <p className="flex-1 text-sm">{t('auth.verify.banner', { email: user.email })}</p>
      <button type="button" onClick={resend} disabled={sending}
        className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-amber-500 px-3 py-1.5 text-sm font-semibold hover:bg-amber-100 disabled:opacity-60 dark:hover:bg-amber-900/40">
        {sending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {t('auth.verify.resend')}
      </button>
    </div>
  );
}
