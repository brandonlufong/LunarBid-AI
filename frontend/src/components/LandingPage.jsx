// Public landing page. Everything described here exists in the product today; pricing comes
// from the same plan configuration the app enforces.
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, Check, ClipboardPaste, FileDown, Files, Languages, Minus, PenLine, ScanSearch, Send, ShieldCheck,
  SlidersHorizontal, Sparkles, UserRoundCheck, Users,
} from 'lucide-react';
import { getPlans } from '../services/api';
import { useLanguage } from '../locales/LanguageContext.jsx';
import { Logo } from './app/Logo';
import { AuthControls } from './Auth/AuthShell';
import { Badge, Button, cn } from './ui';
import ProductPreview from './site/ProductPreview';
import { useParallax, useReveal, useScrolled } from './site/useLandingMotion';
import { PLAN_ORDER, planLines } from './billing/planLines';
import { PUBLIC_PLANS } from '../config/publicPlans';

const FEATURES = [
  { key: 'analyze', icon: ScanSearch },
  { key: 'tailored', icon: UserRoundCheck },
  { key: 'style', icon: SlidersHorizontal },
  { key: 'edit', icon: FileDown },
  { key: 'send', icon: Send },
  { key: 'track', icon: Files },
  { key: 'clients', icon: Users },
  { key: 'languages', icon: Languages },
];

function Section({ id, eyebrow, title, subtitle, children, className }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn('scroll-mt-20 px-5 py-20 sm:px-8 sm:py-24', className)}>
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-2xl text-center" data-reveal>
          {eyebrow && <p className="mb-2 text-small font-medium text-accent-text">{eyebrow}</p>}
          <h2 id={`${id}-title`} className="text-[1.875rem] font-semibold leading-tight tracking-tight text-fg sm:text-[2.25rem]">{title}</h2>
          {subtitle && <p className="mt-3 text-body-lg text-muted">{subtitle}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

export default function LandingPage() {
  const { t } = useLanguage();
  const [plans, setPlans] = useState(PUBLIC_PLANS);
  const pageRef = useRef(null);
  const visualRef = useRef(null);
  const scrolled = useScrolled();
  useReveal(pageRef);
  useParallax(visualRef);
  // Live plans from the API, falling back to the bundled copy so pricing always shows.
  useEffect(() => {
    getPlans()
      .then((r) => setPlans(r.data.plans?.length ? r.data.plans : PUBLIC_PLANS))
      .catch(() => setPlans(PUBLIC_PLANS));
  }, []);

  const nav = [['how', t('site.nav.how')], ['features', t('site.nav.features')], ['pricing', t('site.nav.pricing')], ['faq', t('site.nav.faq')]];

  return (
    <div ref={pageRef} className="min-h-screen bg-surface">
      <a href="#top" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:shadow-pop">{t('shell.skipToContent')}</a>
      <header className={cn('sticky top-0 z-40 border-b bg-surface/90 backdrop-blur transition-[box-shadow,border-color] duration-300',
        scrolled ? 'border-line shadow-card' : 'border-transparent')}>
        <div className={cn('mx-auto flex max-w-6xl items-center gap-6 px-5 transition-[height] duration-300 sm:px-8', scrolled ? 'h-14' : 'h-16')}>
          <Link to="/" aria-label="LunarBid"><Logo /></Link>
          <nav aria-label={t('site.nav.label')} className="hidden items-center gap-6 lg:flex">
            {nav.map(([id, label]) => <a key={id} href={`#${id}`} className="text-body text-fg-2 hover:text-fg">{label}</a>)}
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block"><AuthControls /></div>
            <Link to="/login" className="px-2 text-body font-medium text-fg-2 hover:text-fg">{t('site.signIn')}</Link>
            <Button as={Link} to="/register" size="sm">{t('site.start')}</Button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-line bg-page px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.15fr]">
            <div>
              <div className="hero-in" style={{ '--i': 0 }}><Badge tone="accent">{t('site.hero.eyebrow')}</Badge></div>
              <h1 style={{ '--i': 1 }} className="hero-in mt-5 font-document text-[2.625rem] font-medium leading-[1.08] tracking-tight text-fg sm:text-[3.5rem]">{t('site.hero.title')}</h1>
              <p style={{ '--i': 2 }} className="hero-in mt-5 max-w-xl text-body-lg text-fg-2">{t('site.hero.body')}</p>
              <div style={{ '--i': 3 }} className="hero-in mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button as={Link} to="/register" size="lg" rightIcon={ArrowRight}>{t('site.hero.cta')}</Button>
                <Button as="a" href="#how" size="lg" variant="secondary">{t('site.hero.secondary')}</Button>
              </div>
              <p style={{ '--i': 4 }} className="hero-in mt-4 text-small text-muted">{t('site.hero.note')}</p>
            </div>
            <div className="hero-visual-in relative">
              <div className="ambient-glow pointer-events-none absolute -inset-10 -z-0 rounded-full opacity-70 blur-2xl" aria-hidden="true" />
              <div ref={visualRef} className="relative will-change-transform"><ProductPreview /></div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <Section id="how" eyebrow={t('site.how.eyebrow')} title={t('site.how.title')} subtitle={t('site.how.subtitle')}>
          <div className="relative" data-reveal>
            <div className="flow-line absolute left-[12.5%] right-[12.5%] top-11 hidden h-px bg-gradient-to-r from-accent/10 via-accent/60 to-accent/10 lg:block" aria-hidden="true" />
          <ol className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[['paste', ClipboardPaste], ['draft', Sparkles], ['refine', PenLine], ['track', BarChart3]].map(([key, Icon], i) => (
              <li key={key} data-reveal style={{ '--i': i }} className="lift rounded-lg border border-line bg-surface p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-soft text-accent-text"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <p className="mt-4 text-caption font-medium uppercase tracking-wider text-muted">{t('site.how.step', { n: i + 1 })}</p>
                <h3 className="mt-1 text-h2 font-semibold text-fg">{t(`site.how.titles.${key}`)}</h3>
                <p className="mt-2 text-body text-muted">{t(`site.how.${key}`)}</p>
              </li>
            ))}
          </ol>
          </div>
        </Section>

        {/* Features */}
        <Section id="features" className="border-y border-line bg-page" eyebrow={t('site.features.eyebrow')} title={t('site.features.title')} subtitle={t('site.features.subtitle')}>
          <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ key, icon: Icon }, i) => (
              <li key={key} data-reveal style={{ '--i': i % 4 }}>
                <Icon className="h-5 w-5 text-accent-text" aria-hidden="true" />
                <h3 className="mt-3 text-h3 font-semibold text-fg">{t(`site.features.items.${key}.title`)}</h3>
                <p className="mt-1.5 text-body text-muted">{t(`site.features.items.${key}.body`)}</p>
              </li>
            ))}
          </ul>
        </Section>

        {/* Trust */}
        <Section id="trust" eyebrow={t('site.trust.eyebrow')} title={t('site.trust.title')}>
          <ul className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {['honest', 'private', 'reliable'].map((k, i) => (
              <li key={k} data-reveal style={{ '--i': i }} className="lift rounded-lg border border-line p-6">
                <ShieldCheck className="h-5 w-5 text-success" aria-hidden="true" />
                <h3 className="mt-3 text-h3 font-semibold text-fg">{t(`site.trust.${k}.title`)}</h3>
                <p className="mt-1.5 text-body text-muted">{t(`site.trust.${k}.body`)}</p>
              </li>
            ))}
          </ul>
        </Section>

        {/* Pricing */}
        <Section id="pricing" className="border-y border-line bg-page" eyebrow={t('site.pricing.eyebrow')} title={t('site.pricing.title')} subtitle={t('site.pricing.subtitle')}>
          {plans === null ? null : plans.length === 0 ? (
            <p className="text-center text-body text-muted">{t('site.pricing.unavailable')}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {plans.slice().sort((a, b) => PLAN_ORDER.indexOf(a.id) - PLAN_ORDER.indexOf(b.id)).map((plan) => (
                <div key={plan.id} data-reveal style={{ '--i': PLAN_ORDER.indexOf(plan.id) }} className={cn('lift flex flex-col rounded-lg border bg-surface p-6', plan.id === 'pro' ? 'border-accent ring-1 ring-accent' : 'border-line')}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-h2 font-semibold text-fg">{t(`shell.plans.${plan.id}`)}</h3>
                    {plan.comingSoon && <Badge>{t('billing.comingSoon')}</Badge>}
                  </div>
                  <p className="mt-1 min-h-10 text-small text-muted">{t(`billing.taglines.${plan.id}`)}</p>
                  <p className="mt-4 flex items-baseline gap-1">
                    <span className="text-display font-semibold tracking-tight text-fg">${plan.price}</span>
                    <span className="text-small text-muted">{plan.price ? t('billing.month') : t('billing.forever')}</span>
                  </p>
                  {plan.comingSoon ? (
                    <p className="mt-5 flex-1 text-small text-fg-2">{t('billing.agencyNote')}</p>
                  ) : (
                    <ul className="mt-5 flex-1 space-y-2">
                      {planLines(plan, t).map((line) => (
                        <li key={line.text} className={cn('flex gap-2 text-small', line.ok ? 'text-fg-2' : 'text-muted')}>
                          {line.ok ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" /> : <Minus className="mt-0.5 h-4 w-4 shrink-0 text-line-strong" aria-hidden="true" />}
                          <span>{!line.ok && <span className="sr-only">{t('billing.notIncluded')} </span>}{line.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-6">
                    {plan.comingSoon
                      ? <Button variant="secondary" className="w-full" disabled>{t('billing.comingSoon')}</Button>
                      : <Button as={Link} to="/register" variant={plan.id === 'pro' ? 'primary' : 'secondary'} className="w-full">{plan.price ? t('site.pricing.choose', { plan: t(`shell.plans.${plan.id}`) }) : t('site.hero.cta')}</Button>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-6 text-center text-small text-muted">{t('site.pricing.note')} <Link to="/refunds" className="font-medium text-fg-2 underline underline-offset-2">{t('landing.footer.refunds')}</Link></p>
        </Section>

        {/* FAQ */}
        <Section id="faq" eyebrow={t('site.faq.eyebrow')} title={t('site.faq.title')}>
          <div data-reveal className="mx-auto max-w-3xl divide-y divide-line border-y border-line">
            {['platforms', 'invent', 'data', 'language', 'cancel'].map((k) => (
              <details key={k} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-h3 font-medium text-fg [&::-webkit-details-marker]:hidden">
                  {t(`site.faq.${k}.q`)}
                  <span className="text-muted transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 text-body text-muted">{t(`site.faq.${k}.a`)}</p>
              </details>
            ))}
          </div>
        </Section>

        {/* Final CTA */}
        <section className="px-5 pb-24 sm:px-8">
          <div data-reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-xl bg-[#11131a] px-6 py-14 text-center sm:px-12">
            <div className="ambient-glow pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-60 blur-2xl" aria-hidden="true" />
            <h2 className="font-document text-[2rem] font-medium leading-tight text-white sm:text-[2.5rem]">{t('site.final.title')}</h2>
            <p className="mx-auto mt-3 max-w-xl text-body-lg text-slate-300">{t('site.final.body')}</p>
            <Button as={Link} to="/register" size="lg" className="mt-8" rightIcon={ArrowRight}>{t('site.hero.cta')}</Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-line px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Logo />
            <p className="mt-2 text-small text-muted">{t('site.footer.byNwee')}</p>
          </div>
          <nav aria-label={t('site.footer.label')} className="flex flex-wrap gap-x-5 gap-y-2 text-small text-fg-2">
            <Link to="/terms" className="hover:text-fg">{t('landing.footer.terms')}</Link>
            <Link to="/privacy" className="hover:text-fg">{t('landing.footer.privacy')}</Link>
            <Link to="/refunds" className="hover:text-fg">{t('landing.footer.refunds')}</Link>
            <a href="mailto:support@lunarbid.ai" className="hover:text-fg">{t('landing.footer.contact')}</a>
          </nav>
        </div>
        <p className="mx-auto mt-8 max-w-6xl text-caption text-muted">© {new Date().getFullYear()} LunarBid. {t('site.footer.rights')}</p>
      </footer>
    </div>
  );
}
