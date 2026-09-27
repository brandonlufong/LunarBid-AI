// Shown until the user confirms their email; AI features need a confirmed address.
import React, { useState } from 'react';
import { Alert, Button } from '../ui';
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
    <Alert tone="warning" className="mb-6" title={t('auth.verify.bannerTitle')}
      action={<Button size="sm" variant="secondary" loading={sending} onClick={resend}>{t('auth.verify.resend')}</Button>}>
      {t('auth.verify.banner', { email: user.email })}
    </Alert>
  );
}
