// Terms of Service, Privacy Policy and Refund Policy, in the visitor's language.
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { LEGAL, LEGAL_UPDATED, SUPPORT_EMAIL } from '../../content/legal';
import DarkModeToggle from '../DarkModeToggle';
import LanguageSelector from '../UI/LanguageSelector';

const fill = (text) => text.replace(/\{email\}/g, SUPPORT_EMAIL);

const OTHER_DOCS = { terms: ['privacy', 'refunds'], privacy: ['terms', 'refunds'], refunds: ['terms', 'privacy'] };
const PATHS = { terms: '/terms', privacy: '/privacy', refunds: '/refunds' };

export default function LegalPage({ doc }) {
  const { darkMode } = useTheme();
  const { currentLanguage } = useLanguage();
  const lang = currentLanguage === 'fr' ? 'fr' : 'en';
  const page = LEGAL[lang][doc];

  useEffect(() => {
    document.title = `${page.title} — LunarBid`;
    window.scrollTo(0, 0);
  }, [page.title]);

  const updated = new Date(`${LEGAL_UPDATED}T00:00:00Z`).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
  const muted = darkMode ? 'text-slate-300' : 'text-slate-600';

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0b1020] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`border-b ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-violet-600">
              <Moon className="h-4 w-4 text-white" aria-hidden="true" />
            </span>
            LunarBid
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <DarkModeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <Link to="/" className={`mb-8 inline-flex items-center gap-2 text-sm ${muted} hover:underline`}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {lang === 'fr' ? 'Retour à l’accueil' : 'Back to home'}
        </Link>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{page.title}</h1>
        <p className={`mt-3 text-sm ${muted}`}>
          {lang === 'fr' ? 'Dernière mise à jour :' : 'Last updated'} <time dateTime={LEGAL_UPDATED}>{updated}</time>
        </p>
        <p className={`mt-8 text-lg leading-relaxed ${muted}`}>{fill(page.intro)}</p>

        {page.sections.map(([heading, paragraphs]) => (
          <section key={heading} className={`mt-10 border-t pt-8 ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
            <h2 className="font-display text-xl font-semibold">{heading}</h2>
            {paragraphs.map((p, i) => (
              <p key={i} className={`mt-3 leading-relaxed ${muted}`}>{fill(p)}</p>
            ))}
          </section>
        ))}

        <nav aria-label={lang === 'fr' ? 'Autres documents' : 'Other documents'} className={`mt-14 flex flex-wrap gap-6 border-t pt-8 text-sm ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
          {OTHER_DOCS[doc].map((d) => (
            <Link key={d} to={PATHS[d]} className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
              {LEGAL[lang][d].title}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
