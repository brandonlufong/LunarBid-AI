// Security: change password and sign out of other devices. Both return a fresh session
// for this device; every other device must sign in again.
import React, { useState } from 'react';
import { KeyRound, LogOut, Loader2 } from 'lucide-react';
import { changePassword, logoutAllDevices } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { useToast } from '../UI/Toast';

export default function AccountSecurity() {
  const { user } = useAuth();
  const { darkMode } = useTheme();
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

  const card = `mt-8 rounded-2xl border-2 p-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`;
  const input = `mt-1 w-full rounded-lg border-2 px-3 py-2 ${darkMode ? 'border-slate-600 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-900'}`;
  const labelCls = `block text-sm font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`;
  const button = `inline-flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-semibold disabled:opacity-60 ${darkMode ? 'border-slate-600 text-slate-100 hover:bg-slate-700' : 'border-slate-300 text-slate-800 hover:bg-slate-50'}`;

  return (
    <section className={card} aria-labelledby="security-title">
      <h2 id="security-title" className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t('dashboard.security.title')}</h2>

      {user?.hasPassword !== false && (
        <form onSubmit={submitPassword} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="security-current" className={labelCls}>{t('dashboard.security.current')}</label>
            <input id="security-current" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} className={input} />
          </div>
          <div>
            <label htmlFor="security-new" className={labelCls}>{t('dashboard.security.new')}</label>
            <input id="security-new" type="password" autoComplete="new-password" required minLength={8} value={next} onChange={(e) => setNext(e.target.value)}
              aria-invalid={!!error} aria-describedby={error ? 'security-error' : undefined} className={input} />
          </div>
          {error && <p id="security-error" role="alert" className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <button type="submit" disabled={busy === 'password'} className={button}>
              {busy === 'password' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <KeyRound className="h-4 w-4" aria-hidden="true" />}
              {t('dashboard.security.change')}
            </button>
          </div>
        </form>
      )}

      <div className={`mt-6 flex flex-col gap-2 border-t pt-5 sm:flex-row sm:items-center sm:justify-between ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
        <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t('dashboard.security.othersHint')}</p>
        <button type="button" onClick={signOutOthers} disabled={busy === 'logout'} className={button}>
          {busy === 'logout' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LogOut className="h-4 w-4" aria-hidden="true" />}
          {t('dashboard.security.signOutOthers')}
        </button>
      </div>
    </section>
  );
}
