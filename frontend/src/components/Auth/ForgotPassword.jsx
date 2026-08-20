import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { forgotPassword } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import AuthShell from './AuthShell';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setSent(true);
      if (res.data?.devResetLink) setDevLink(res.data.devResetLink);
    } catch {
      setSent(true); // generic — never reveal existence
    } finally {
      setLoading(false);
    }
  };

  const input = `w-full px-4 py-3.5 rounded-xl border-2 font-medium transition-all ${
    darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
  } focus:border-brand-500`;

  return (
    <AuthShell>
      <h1 className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t('auth.forgot.title')}</h1>
      <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('auth.forgot.subtitle')}</p>

      {sent ? (
        <div className="space-y-4">
          <div className={`flex items-start gap-3 p-4 rounded-xl border-2 ${darkMode ? 'bg-green-900/20 border-green-800 text-green-300' : 'bg-green-50 border-green-200 text-green-800'}`}>
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{t('auth.forgot.sent')}</p>
          </div>
          {devLink && (
            <div className={`p-3 rounded-xl text-xs break-all ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
              <p className="font-semibold mb-1">{t('auth.forgot.devLink')}</p>
              <a href={devLink} className="text-brand-500 underline">{devLink}</a>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              <Mail className="w-4 h-4 text-brand-500" /> {t('auth.forgot.email')}
            </label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.forgot.emailPlaceholder')} className={input} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-brand-600/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> {t('auth.forgot.sending')}</> : t('auth.forgot.submit')}
          </button>
        </form>
      )}

      <button onClick={() => navigate('/login')} className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold ${darkMode ? 'text-brand-300 hover:text-brand-200' : 'text-brand-600 hover:text-brand-700'}`}>
        <ArrowLeft className="w-4 h-4" /> {t('auth.forgot.backToLogin')}
      </button>
    </AuthShell>
  );
};

export default ForgotPassword;
