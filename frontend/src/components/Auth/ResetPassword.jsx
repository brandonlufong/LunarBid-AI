import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { resetPassword } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import AuthShell from './AuthShell';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const { darkMode } = useTheme();
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError(t('auth.reset.mismatch')); return; }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.reset.mismatch'));
    } finally {
      setLoading(false);
    }
  };

  const input = `w-full px-4 py-3.5 rounded-xl border-2 font-medium transition-all ${
    darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
  } focus:border-brand-500`;
  const label = `block text-sm font-bold mb-2 flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`;

  return (
    <AuthShell>
      <h1 className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t('auth.reset.title')}</h1>
      <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('auth.reset.subtitle')}</p>

      {done ? (
        <div className={`flex items-start gap-3 p-4 rounded-xl border-2 ${darkMode ? 'bg-green-900/20 border-green-800 text-green-300' : 'bg-green-50 border-green-200 text-green-800'}`}>
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{t('auth.reset.success')}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className={`p-3 rounded-xl text-sm font-medium ${darkMode ? 'bg-red-900/20 text-red-300 border border-red-800' : 'bg-red-50 text-red-700 border border-red-200'}`}>{error}</div>
          )}
          <div>
            <label className={label}><Lock className="w-4 h-4 text-brand-500" /> {t('auth.reset.password')}</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.reset.placeholder')} className={input} />
          </div>
          <div>
            <label className={label}><Lock className="w-4 h-4 text-violet-500" /> {t('auth.reset.confirm')}</label>
            <input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={t('auth.reset.placeholder')} className={input} />
          </div>
          <button type="submit" disabled={loading || !token} className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-brand-600/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> {t('auth.reset.resetting')}</> : t('auth.reset.submit')}
          </button>
        </form>
      )}

      <button onClick={() => navigate('/login')} className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold ${darkMode ? 'text-brand-300 hover:text-brand-200' : 'text-brand-600 hover:text-brand-700'}`}>
        <ArrowLeft className="w-4 h-4" /> {t('auth.reset.backToLogin')}
      </button>
    </AuthShell>
  );
};

export default ResetPassword;
