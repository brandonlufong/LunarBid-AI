import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext.jsx';

// Handles the /oauth?token=... redirect from the backend OAuth callback.
// Stores the JWT and hard-reloads into the dashboard so AuthProvider fetches the user.
const OAuthCallback = () => {
  const [params] = useSearchParams();
  const { t } = useLanguage();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      window.location.replace('/dashboard');
    } else {
      window.location.replace('/login?error=oauth_failed');
    }
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1020]">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-brand-400 animate-spin mx-auto mb-4" />
        <p className="text-slate-300 font-medium">{t('auth.oauth.signingIn')}</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
