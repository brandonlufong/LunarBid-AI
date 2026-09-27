// Terms of Service, Privacy Policy and Refund Policy, in the visitor's language.
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { LEGAL, LEGAL_UPDATED, SUPPORT_EMAIL } from '../../content/legal';
import { Logo } from '../app/Logo';
import { AuthControls } from '../Auth/AuthShell';

const fill = (text) => text.replace(/\{email\}/g, SUPPORT_EMAIL);

const OTHER_DOCS = { terms: ['privacy', 'refunds'], privacy: ['terms', 'refunds'], refunds: ['terms', 'privacy'] };
const PATHS = { terms: '/terms', privacy: '/privacy', refunds: '/refunds' };

export default function LegalPage({ doc }) {
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

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <Link to="/" aria-label="LunarBid"><Logo /></Link>
          <AuthControls />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-small text-muted hover:text-fg">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {lang === 'fr' ? 'Retour à l’accueil' : 'Back to home'}
        </Link>
        <h1 className="font-document text-[2.25rem] font-medium leading-tight text-fg">{page.title}</h1>
        <p className="mt-3 text-small text-muted">
          {lang === 'fr' ? 'Dernière mise à jour :' : 'Last updated'} <time dateTime={LEGAL_UPDATED}>{updated}</time>
        </p>
        <p className="mt-8 text-body-lg leading-relaxed text-fg-2">{fill(page.intro)}</p>
        {page.sections.map(([heading, paragraphs]) => (
          <section key={heading} className="mt-10 border-t border-line pt-8">
            <h2 className="text-h2 font-semibold text-fg">{heading}</h2>
            {paragraphs.map((p, i) => <p key={i} className="mt-3 text-body-lg leading-relaxed text-fg-2">{fill(p)}</p>)}
          </section>
        ))}
        <nav aria-label={lang === 'fr' ? 'Autres documents' : 'Other documents'} className="mt-14 flex flex-wrap gap-6 border-t border-line pt-8 text-small">
          {OTHER_DOCS[doc].map((d) => <Link key={d} to={PATHS[d]} className="font-medium text-accent-text hover:underline">{LEGAL[lang][d].title}</Link>)}
        </nav>
      </main>
    </div>
  );
}
