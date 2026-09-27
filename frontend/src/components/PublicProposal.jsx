// Public view of a shared proposal (/p/:token). Read by the freelancer's client, so it
// looks like a document from the freelancer; LunarBid stays in the background.
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Copy, FileWarning, Printer } from 'lucide-react';
import { getPublicProposal } from '../services/api';
import { useLanguage } from '../locales/LanguageContext.jsx';
import { useToast } from './UI/Toast';
import { Alert, Avatar, Button, EmptyState, Skeleton } from './ui';
import { LogoMark } from './app/Logo';
import { formatDate } from './Dashboard/proposalMeta.jsx';

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export default function PublicProposal() {
  const { token } = useParams();
  const { t, currentLanguage } = useLanguage();
  const toast = useToast();
  const [state, setState] = useState({ status: 'loading' });
  const [copied, setCopied] = useState(false);

  // Shared proposals are private documents: keep them out of search engines.
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const load = useCallback(() => {
    getPublicProposal(token)
      .then((res) => {
        setState({ status: 'ready', data: res.data });
        document.title = `${res.data.jobTitle} — ${res.data.author?.branding?.companyName || res.data.author?.name || 'LunarBid'}`;
      })
      .catch((err) => setState({ status: err.response?.status === 404 ? 'missing' : 'error' }));
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(state.data.content || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(t('doc.copyError'));
    }
  };

  const shell = (children) => (
    <div className="min-h-screen bg-page print:bg-white">
      <main className="mx-auto w-full max-w-[820px] px-4 py-8 sm:px-6 sm:py-12 print:p-0">{children}</main>
      <footer className="pb-10 text-center print:pb-0">
        <Link to="/" className="inline-flex items-center gap-2 text-caption text-muted hover:text-fg">
          <LogoMark size={16} />{t('public.madeWith')}
        </Link>
      </footer>
    </div>
  );

  if (state.status === 'loading') {
    return shell(
      <div className="rounded-lg border border-line bg-surface p-8 shadow-card sm:p-12" role="status" aria-label={t('common.loading')}>
        <Skeleton className="mb-8 h-10 w-48" /><Skeleton className="mb-3 h-8 w-2/3" /><Skeleton className="mb-10 h-4 w-40" />
        <div className="space-y-3">{[100, 95, 98, 80, 96, 60].map((w, i) => <Skeleton key={i} style={{ width: `${w}%` }} />)}</div>
      </div>
    );
  }
  if (state.status === 'missing') {
    return shell(
      <div className="rounded-lg border border-line bg-surface shadow-card">
        <EmptyState icon={FileWarning} title={t('public.missingTitle')} description={t('public.missingBody')} />
      </div>
    );
  }
  if (state.status === 'error') {
    return shell(<Alert tone="danger" title={t('public.errorTitle')} action={<Button size="sm" variant="secondary" onClick={() => { setState({ status: 'loading' }); load(); }}>{t('common.retry')}</Button>}>{t('public.errorBody')}</Alert>);
  }

  const { data } = state;
  const branding = data.author?.branding || {};
  const accent = HEX.test(branding.primaryColor || '') ? branding.primaryColor : null;
  const name = branding.companyName || data.author?.name || '';
  const meta = [data.clientName && t('public.preparedFor', { name: data.clientName }), formatDate(data.createdAt, currentLanguage)].filter(Boolean).join(' · ');

  return shell(
    <>
      <div className="mb-4 flex justify-end gap-2 print:hidden">
        <Button variant="secondary" size="sm" leftIcon={copied ? Check : Copy} onClick={copy}>{copied ? t('doc.copiedShort') : t('public.copy')}</Button>
        <Button variant="secondary" size="sm" leftIcon={Printer} onClick={() => window.print()}>{t('public.print')}</Button>
      </div>
      <article className="overflow-hidden rounded-lg border border-line bg-surface shadow-card print:border-0 print:shadow-none"
        style={accent ? { borderTop: `3px solid ${accent}` } : undefined} aria-labelledby="public-title">
        <div className="px-6 py-8 sm:px-14 sm:py-12 print:px-0">
          <header className="mb-10 flex items-center gap-3.5">
            {branding.logoUrl
              ? <img src={branding.logoUrl} alt="" className="h-12 w-12 rounded-md object-contain" />
              : <Avatar name={name} size={44} />}
            <div className="min-w-0">
              <p className="truncate text-body font-semibold text-fg">{name}</p>
              {branding.tagline && <p className="truncate text-small text-muted">{branding.tagline}</p>}
              {branding.website && <p className="truncate text-caption text-muted">{branding.website}</p>}
            </div>
          </header>
          <h1 id="public-title" className="font-document text-[1.875rem] font-medium leading-tight text-fg sm:text-[2.125rem]">{data.jobTitle}</h1>
          {meta && <p className="mt-2 text-small text-muted">{meta}</p>}
          <div className="mt-8 border-t border-line pt-8">
            <div className="prose-document max-w-[68ch]">{data.content}</div>
          </div>
        </div>
      </article>
    </>
  );
}
