// "Your data" section: export everything, or delete the account (with confirmation).
import React, { useState } from 'react';
import { Download, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { exportAccountData, deleteAccount } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { useToast } from '../UI/Toast';

export default function AccountData() {
  const { user, logoutUser } = useAuth();
  const { darkMode } = useTheme();
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmValue, setConfirmValue] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const usesPassword = user?.hasPassword !== false;

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportAccountData();
      const url = URL.createObjectURL(new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `lunarbid-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('dashboard.account.exportError'));
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setDeleting(true);
    setError('');
    try {
      await deleteAccount(usesPassword ? { password: confirmValue } : { confirmEmail: confirmValue });
      logoutUser();
      navigate('/', { replace: true, state: { accountDeleted: true } });
    } catch (err) {
      setError(err.response?.data?.message || t('dashboard.account.deleteError'));
      setDeleting(false);
    }
  };

  const card = `mt-8 rounded-2xl border-2 p-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`;
  const muted = darkMode ? 'text-slate-300' : 'text-slate-600';

  return (
    <section className={card} aria-labelledby="account-data-title">
      <h2 id="account-data-title" className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t('dashboard.account.title')}</h2>
      <p className={`mt-1 text-sm ${muted}`}>{t('dashboard.account.subtitle')}</p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={handleExport} disabled={exporting}
          className={`inline-flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-semibold disabled:opacity-60 ${darkMode ? 'border-slate-600 text-slate-100 hover:bg-slate-700' : 'border-slate-300 text-slate-800 hover:bg-slate-50'}`}>
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
          {t('dashboard.account.export')}
        </button>
        <button type="button" onClick={() => { setOpen(true); setConfirmValue(''); setError(''); }}
          className={`inline-flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-semibold ${darkMode ? 'border-red-500/60 text-red-300 hover:bg-red-900/20' : 'border-red-300 text-red-700 hover:bg-red-50'}`}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {t('dashboard.account.delete')}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <form onSubmit={handleDelete} className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-7 w-7 text-red-600" aria-hidden="true" />
              <h3 id="delete-title" className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t('dashboard.account.confirmTitle')}</h3>
            </div>
            <p className={`mt-3 text-sm ${muted}`}>{t('dashboard.account.confirmBody')}</p>
            <label htmlFor="delete-confirm" className={`mt-4 block text-sm font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              {usesPassword ? t('dashboard.account.passwordLabel') : t('dashboard.account.emailLabel', { email: user?.email })}
            </label>
            <input id="delete-confirm" type={usesPassword ? 'password' : 'email'} autoComplete={usesPassword ? 'current-password' : 'off'}
              value={confirmValue} onChange={(e) => setConfirmValue(e.target.value)} required autoFocus
              aria-invalid={!!error} aria-describedby={error ? 'delete-error' : undefined}
              className={`mt-2 w-full rounded-lg border-2 px-3 py-2 ${darkMode ? 'border-slate-600 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-900'}`} />
            {error && <p id="delete-error" role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-6 flex gap-3">
              <button type="submit" disabled={deleting || !confirmValue}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {deleting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {t('dashboard.account.confirmDelete')}
              </button>
              <button type="button" onClick={() => setOpen(false)}
                className={`flex-1 rounded-lg border-2 px-4 py-2 font-semibold ${darkMode ? 'border-slate-600 text-slate-100 hover:bg-slate-700' : 'border-slate-300 hover:bg-slate-100'}`}>
                {t('dashboard.account.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
