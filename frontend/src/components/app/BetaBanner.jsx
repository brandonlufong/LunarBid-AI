// Discreet "Free beta" notice shown in the signed-in app while BETA_MODE is on.
// Dismissible (per browser). Points to Support for feedback.
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { getMeta } from '../../services/api';
import { useLanguage } from '../../locales/LanguageContext.jsx';

const DISMISS_KEY = 'lunarbid-beta-dismissed';

export default function BetaBanner() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try { dismissed = localStorage.getItem(DISMISS_KEY) === '1'; } catch { /* ignore */ }
    if (dismissed) return;
    getMeta().then((res) => { if (res.data?.betaMode) setShow(true); }).catch(() => {});
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    setShow(false);
  };

  return (
    <div role="status" className="mb-5 flex items-start gap-3 rounded-lg border border-line bg-accent-soft px-4 py-3">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" aria-hidden="true" />
      <p className="flex-1 text-small text-fg-2">
        <span className="font-semibold text-fg">{t('beta.title')}</span>{' — '}
        {t('beta.body')}{' '}
        <Link to="/dashboard?tab=support" className="font-medium text-accent-text hover:underline">{t('beta.feedback')}</Link>
      </p>
      <button type="button" onClick={dismiss} aria-label={t('beta.dismiss')} className="shrink-0 rounded text-muted hover:text-fg">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
