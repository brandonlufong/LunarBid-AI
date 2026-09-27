// Shared layout for sign-in, sign-up and password pages: the form on the left, and on
// large screens a quiet panel showing what LunarBid produces (an example, labelled as such).
import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { Logo } from '../app/Logo';
import { IconButton } from '../ui';

function LanguageToggle() {
  const { currentLanguage, changeLanguage } = useLanguage();
  return (
    <div className="flex rounded-md border border-line p-0.5 text-caption font-medium" role="group" aria-label="Language">
      {['en', 'fr'].map((l) => (
        <button key={l} type="button" onClick={() => changeLanguage(l)} aria-pressed={currentLanguage === l}
          className={currentLanguage === l ? 'rounded-[5px] bg-subtle px-2 py-1 text-fg' : 'px-2 py-1 text-muted hover:text-fg'}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function AuthControls() {
  const { darkMode, toggleTheme } = useTheme();
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-2">
      <LanguageToggle />
      <IconButton icon={darkMode ? Sun : Moon} label={darkMode ? t('shell.lightMode') : t('shell.darkMode')} size="sm" onClick={toggleTheme} />
    </div>
  );
}

function ExamplePanel() {
  const { t } = useLanguage();
  return (
    <div className="relative hidden flex-col justify-center overflow-hidden border-l border-line bg-subtle px-12 py-16 lg:flex">
      <div className="mx-auto w-full max-w-md">
        <h2 className="font-document text-[2rem] font-medium leading-tight text-fg">{t('auth.panel.title')}</h2>
        <ul className="mt-6 space-y-3">
          {['one', 'two', 'three'].map((k) => (
            <li key={k} className="flex gap-2.5 text-body text-fg-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" aria-hidden="true" />{t(`auth.panel.points.${k}`)}
            </li>
          ))}
        </ul>
        <figure className="mt-10 rounded-lg border border-line bg-surface p-6 shadow-pop" aria-label={t('auth.panel.exampleLabel')}>
          <figcaption className="mb-4 flex items-center justify-between text-caption text-muted">
            <span className="font-medium uppercase tracking-wider">{t('auth.panel.exampleLabel')}</span>
            <span>{t('auth.panel.exampleMeta')}</span>
          </figcaption>
          <p className="font-document text-[1.1875rem] font-medium text-fg">{t('auth.panel.exampleTitle')}</p>
          <p className="prose-document mt-3 !text-[0.9375rem] text-fg-2">{t('auth.panel.exampleBody')}</p>
        </figure>
      </div>
    </div>
  );
}

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen bg-surface lg:grid-cols-2">
      <div className="flex flex-col px-5 py-5 sm:px-10">
        <header className="flex items-center justify-between">
          <Link to="/" aria-label="LunarBid"><Logo /></Link>
          <AuthControls />
        </header>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[380px]">
            {title && <h1 className="text-h1 font-semibold text-fg">{title}</h1>}
            {subtitle && <p className="mt-1.5 text-body text-muted">{subtitle}</p>}
            <div className="mt-7">{children}</div>
            {footer && <div className="mt-8 text-center text-small text-muted">{footer}</div>}
          </div>
        </main>
        <footer className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-caption text-muted">
          <Link to="/terms" className="hover:text-fg">Terms</Link>
          <Link to="/privacy" className="hover:text-fg">Privacy</Link>
          <span>© {new Date().getFullYear()} LunarBid · NWEE</span>
        </footer>
      </div>
      <ExamplePanel />
    </div>
  );
}
