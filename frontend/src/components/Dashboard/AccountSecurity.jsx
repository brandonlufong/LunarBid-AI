// Security: change password and sign out of other devices. Both return a fresh session
// for this device; every other device must sign in again.
import React, { useState } from 'react';
import { KeyRound, LogOut } from 'lucide-react';
import { changePassword, logoutAllDevices } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { useToast } from '../UI/Toast';
import { Alert, Button, Card, CardHeader, Field } from '../ui';
import PasswordInput from '../Auth/PasswordInput';

export default function AccountSecurity() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const submitPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (next.length < 8) return setError(t('auth.register.passwordTooShort'));
    setBusy('password');
    try {
      const res = await changePassword(current, next);
      localStorage.setItem('token', res.data.token);
      setCurrent('');
      setNext('');
      toast.success(t('dashboard.security.passwordChanged'));
    } catch (err) {
      setError(err.response?.data?.message || t('dashboard.security.error'));
    } finally {
      setBusy('');
    }
  };

  const signOutOthers = async () => {
    setBusy('logout');
    try {
      const res = await logoutAllDevices();
      localStorage.setItem('token', res.data.token);
      toast.success(t('dashboard.security.signedOutOthers'));
    } catch {
      toast.error(t('dashboard.security.error'));
    } finally {
      setBusy('');
    }
  };


  return (
    <Card id="security" aria-labelledby="security-title" className="scroll-mt-20">
      <CardHeader titleId="security-title" title={t('dashboard.security.title')} description={t('settings.securitySubtitle')} />
      {user?.hasPassword !== false && (
        <form onSubmit={submitPassword} className="grid gap-4 sm:grid-cols-2">
          <Field label={t('dashboard.security.current')} required>
            <PasswordInput autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
          </Field>
          <Field label={t('dashboard.security.new')} required hint={t('auth.register.passwordHint')}>
            <PasswordInput autoComplete="new-password" required minLength={8} value={next} onChange={(e) => setNext(e.target.value)} />
          </Field>
          {error && <div className="sm:col-span-2"><Alert tone="danger">{error}</Alert></div>}
          <div className="sm:col-span-2">
            <Button type="submit" variant="secondary" leftIcon={KeyRound} loading={busy === 'password'}>{t('dashboard.security.change')}</Button>
          </div>
        </form>
      )}
      <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-body font-medium text-fg">{t('dashboard.security.signOutOthers')}</p>
          <p className="text-small text-muted">{t('dashboard.security.othersHint')}</p>
        </div>
        <Button variant="secondary" leftIcon={LogOut} onClick={signOutOthers} loading={busy === 'logout'}>{t('settings.signOutOthersShort')}</Button>
      </div>
    </Card>
  );
}
