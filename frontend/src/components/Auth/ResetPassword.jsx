import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../../services/api';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { Alert, Button, Field } from '../ui';
import AuthShell from './AuthShell';
import PasswordInput from './PasswordInput';

export default function ResetPassword() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError(t('auth.register.passwordTooShort')); return; }
    if (password !== confirm) { setError(t('auth.reset.mismatch')); return; }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.reset.failed'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell title={t('auth.reset.heading')} footer={<Link to="/forgot-password" className="font-medium text-accent-text hover:underline">{t('auth.reset.requestNew')}</Link>}>
        <Alert tone="warning">{t('auth.reset.noToken')}</Alert>
      </AuthShell>
    );
  }
  return (
    <AuthShell title={t('auth.reset.heading')} subtitle={t('auth.reset.sub')}>
      {done ? (
        <Alert tone="success">{t('auth.reset.done')}</Alert>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <Field label={t('auth.newPassword')} required hint={t('auth.register.passwordHint')}>
            <PasswordInput autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Field label={t('auth.confirmPassword')} required>
            <PasswordInput autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={loading}>{t('auth.reset.submit')}</Button>
        </form>
      )}
    </AuthShell>
  );
}
