// A static rendering of the real LunarBid interface (composer + generated document), used as
// the landing page visual. Decorative: hidden from assistive technology.
import React from 'react';
import { FilePlus2, Files, Home, Sparkles } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { LogoMark } from '../app/Logo';

export default function ProductPreview() {
  const { t } = useLanguage();
  return (
    <div aria-hidden="true" className="select-none overflow-hidden rounded-xl border border-line bg-page shadow-modal">
      <div className="flex items-center gap-1.5 border-b border-line bg-surface px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" /><span className="h-2.5 w-2.5 rounded-full bg-line-strong" /><span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="ml-3 truncate rounded bg-subtle px-2 py-0.5 text-[11px] text-muted">lunarbid.ai/dashboard</span>
      </div>
      <div className="flex">
        <div className="hidden w-40 shrink-0 border-r border-line bg-surface p-3 md:block">
          <div className="mb-4 flex items-center gap-2"><LogoMark size={20} /><span className="text-[13px] font-semibold text-fg">LunarBid</span></div>
          <div className="mb-3 flex h-7 items-center justify-center gap-1.5 rounded-md bg-accent text-[11px] font-medium text-accent-fg"><FilePlus2 className="h-3 w-3" />{t('shell.newProposal')}</div>
          {[[Home, t('shell.nav.home')], [FilePlus2, t('shell.nav.generate'), true], [Files, t('shell.nav.history')]].map(([Icon, label, on]) => (
            <div key={label} className={`mb-0.5 flex h-7 items-center gap-2 rounded-md px-2 text-[11px] ${on ? 'bg-accent-soft font-medium text-accent-text' : 'text-fg-2'}`}><Icon className="h-3 w-3" />{label}</div>
          ))}
        </div>
        <div className="grid min-w-0 flex-1 gap-3 p-3 sm:grid-cols-[0.9fr_1.1fr] sm:p-4">
          <div className="space-y-3">
            <div className="rounded-lg border border-line bg-surface p-3 shadow-xs">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted">{t('composer.step1')}</p>
              <p className="mt-2 text-[11px] font-medium text-fg">{t('composer.jobTitle')}</p>
              <div className="mt-1 rounded border border-line-strong px-2 py-1.5 text-[11px] text-fg">{t('site.preview.jobTitle')}</div>
              <p className="mt-2 text-[11px] font-medium text-fg">{t('composer.jobPost')}</p>
              <div className="mt-1 rounded border border-line-strong px-2 py-1.5 text-[11px] leading-relaxed text-fg-2">{t('site.preview.jobPost')}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-3 shadow-xs">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted">{t('composer.step3')}</p>
              <div className="mt-2 flex rounded border border-line bg-subtle p-0.5 text-[10px]">
                <span className="flex-1 py-1 text-center text-muted">{t('composer.tones.formal')}</span>
                <span className="flex-1 rounded-[3px] bg-surface py-1 text-center font-medium text-fg shadow-xs">{t('composer.tones.friendly')}</span>
                <span className="flex-1 py-1 text-center text-muted">{t('composer.tones.persuasive')}</span>
              </div>
              <div className="mt-3 flex h-7 items-center justify-center gap-1.5 rounded-md bg-accent text-[11px] font-medium text-accent-fg"><Sparkles className="h-3 w-3" />{t('composer.generate')}</div>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-4 shadow-xs">
            <p className="font-document text-[17px] font-medium leading-snug text-fg">{t('site.preview.jobTitle')}</p>
            <p className="mt-1 text-[10px] text-muted">{t('site.preview.meta')}</p>
            <div className="mt-3 border-t border-line pt-3 font-document text-[12.5px] leading-relaxed text-fg-2 whitespace-pre-line">{t('site.preview.body')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
