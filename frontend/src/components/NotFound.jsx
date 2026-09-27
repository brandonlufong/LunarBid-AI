// 404: unknown addresses get a clear page instead of a silent redirect.
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../locales/LanguageContext.jsx';
import { Logo } from './app/Logo';
import { Button } from './ui';

export default function NotFound() {
  const { user } = useAuth();
  const { t } = useLanguage();
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots'; meta.content = 'noindex';
    document.head.appendChild(meta);
    document.title = `${t('notFound.title')} — LunarBid`;
    return () => meta.remove();
  }, [t]);
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <header className="px-5 py-5 sm:px-8"><Link to="/" aria-label="LunarBid"><Logo /></Link></header>
      <main className="flex flex-1 items-center justify-center px-5 pb-24">
        <div className="max-w-md text-center">
          <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-surface text-fg-2"><Compass className="h-5 w-5" aria-hidden="true" /></span>
          <p className="text-small font-medium text-accent-text">404</p>
          <h1 className="mt-1 text-h1 font-semibold text-fg">{t('notFound.title')}</h1>
          <p className="mt-2 text-body text-muted">{t('notFound.body')}</p>
          <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
            <Button as={Link} to={user ? '/dashboard' : '/'}>{user ? t('notFound.dashboard') : t('notFound.home')}</Button>
            <Button as="a" href="mailto:support@lunarbid.ai" variant="secondary">{t('landing.footer.contact')}</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
