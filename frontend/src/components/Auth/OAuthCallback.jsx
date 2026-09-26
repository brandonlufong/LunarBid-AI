import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { exchangeOAuthCode } from '../../services/api';

// Handles the /oauth?code=... redirect from the backend OAuth callback: exchanges the
// single-use code for a session token, then reloads into the dashboard.
const OAuthCallback = () => {
  const [params] = useSearchParams();
  const { t } = useLanguage();

  useEffect(() => {
    // The backend sends a single-use code (never the session token itself in the URL).
    const code = params.get('code');
    if (!code) {
      window.location.replace('/login?error=oauth_failed');
      return;
    }
    exchangeOAuthCode(code)
      .then((res) => {
        localStorage.setItem('token', res.data.token);
        window.location.replace('/dashboard');
      })
      .catch(() => window.location.replace('/login?error=oauth_failed'));
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
