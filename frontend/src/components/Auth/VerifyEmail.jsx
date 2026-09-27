// Landing page for the email confirmation link: /verify-email?token=...
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { verifyEmail } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext.jsx';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [state, setState] = useState({ status: 'working', message: '' });

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setState({ status: 'error', message: t('auth.verify.invalid') });  
      return;
    }
    verifyEmail(token)
      .then(() => {
        setState({ status: 'done', message: t('auth.verify.done') });
        if (user) updateUser({ ...user, emailVerified: true });
      })
      .catch((err) => setState({ status: 'error', message: err.response?.data?.message || t('auth.verify.invalid') }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const Icon = state.status === 'done' ? CheckCircle : state.status === 'error' ? AlertTriangle : Loader2;
  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-6">
      <div className="max-w-md text-center" role="status" aria-live="polite">
        <Icon className={`mx-auto mb-4 h-12 w-12 ${state.status === 'done' ? 'text-success' : state.status === 'error' ? 'text-warning' : 'text-accent-text animate-spin'}`} aria-hidden="true" />
        <p className="text-h2 font-semibold text-fg">{state.status === 'working' ? t('auth.verify.working') : state.message}</p>
        {state.status !== 'working' && (
          <Link to={user ? '/dashboard' : '/login'} className="mt-6 inline-flex h-10 items-center rounded-md bg-accent px-4 font-medium text-accent-fg hover:bg-accent-hover">
            {user ? t('auth.verify.toDashboard') : t('auth.verify.toLogin')}
          </Link>
        )}
      </div>
    </div>
  );
}
