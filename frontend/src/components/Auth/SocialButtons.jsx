// Google / GitHub sign-in, shown only for providers that are configured on the server.
import React, { useEffect, useState } from 'react';
import { getAuthProviders, OAUTH_URL } from '../../services/api';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { Button } from '../ui';

const GoogleIcon = (props) => (
  <svg viewBox="0 0 24 24" {...props}><path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.7-2.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>
);
const GithubIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5z"/></svg>
);

export default function SocialButtons() {
  const { t } = useLanguage();
  const [providers, setProviders] = useState(null);
  useEffect(() => { getAuthProviders().then((r) => setProviders(r.data)).catch(() => setProviders({})); }, []);
  if (!providers || (!providers.google && !providers.github)) return null;
  return (
    <>
      <div className="my-6 flex items-center gap-3 text-caption text-muted">
        <span className="h-px flex-1 bg-line" />{t('auth.or')}<span className="h-px flex-1 bg-line" />
      </div>
      <div className="grid gap-2">
        {providers.google && (
          <Button variant="secondary" onClick={() => { window.location.href = OAUTH_URL('google'); }}>
            <GoogleIcon className="h-4 w-4" aria-hidden="true" />{t('auth.withGoogle')}
          </Button>
        )}
        {providers.github && (
          <Button variant="secondary" onClick={() => { window.location.href = OAUTH_URL('github'); }}>
            <GithubIcon className="h-4 w-4" aria-hidden="true" />{t('auth.withGithub')}
          </Button>
        )}
      </div>
    </>
  );
}
