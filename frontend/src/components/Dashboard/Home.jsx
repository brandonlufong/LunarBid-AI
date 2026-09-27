// Home: what LunarBid does, what to do next, plan usage and recent proposals.
// Everything shown comes from the API; nothing is invented.
import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Circle, ClipboardPaste, FilePlus2, Files, PenLine, Sparkles } from 'lucide-react';
import { getProfile, getProposalHistory } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { Badge, Button, Card, CardHeader, EmptyState, PageHeader, Skeleton, UsageMeter } from '../ui';
import { StatusBadge, formatDate } from './proposalMeta.jsx';

function HowItWorks() {
  const { t } = useLanguage();
  const steps = [
    { icon: ClipboardPaste, key: 'paste' },
    { icon: Sparkles, key: 'draft' },
    { icon: PenLine, key: 'refine' },
  ];
  return (
    <ol className="grid gap-4 sm:grid-cols-3">
      {steps.map(({ icon: Icon, key }, i) => (
        <li key={key} className="flex gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-fg-2">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-small font-medium text-fg">{i + 1}. {t(`home.steps.${key}.title`)}</p>
            <p className="mt-0.5 text-small text-muted">{t(`home.steps.${key}.body`)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function Home({ subscription, onNavigate, onOpenProposal }) {
  const { user } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const [recent, setRecent] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getProposalHistory().then((r) => setRecent((r.data.items || []).slice(0, 5))).catch(() => setRecent([]));
    getProfile().then((r) => setProfile(r.data || {})).catch(() => setProfile({}));
  }, []);

  const firstName = (user?.name || '').split(' ')[0];
  const profileDone = !!(profile && (profile.role || '').trim() && (profile.skills || '').trim());
  const checklist = [
    { key: 'verify', done: user?.emailVerified !== false, hidden: user?.emailVerified !== false },
    { key: 'profile', done: profileDone, action: () => onNavigate('profile') },
    { key: 'first', done: (recent || []).length > 0, action: () => onNavigate('generate') },
  ].filter((c) => !c.hidden);
  const showChecklist = recent !== null && profile !== null && checklist.some((c) => !c.done);

  const usage = subscription?.usage || {};
  const limits = subscription?.limits || {};
  const plan = subscription?.subscription?.plan;

  return (
    <div>
      <PageHeader
        title={firstName ? t('home.greeting', { name: firstName }) : t('home.greetingNoName')}
        description={t('home.subtitle')}
        actions={<Button size="lg" leftIcon={FilePlus2} onClick={() => onNavigate('generate')}>{t('shell.newProposal')}</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {showChecklist && (
            <Card aria-labelledby="checklist-title">
              <CardHeader titleId="checklist-title" title={t('home.checklist.title')} description={t('home.checklist.subtitle')} />
              <ul className="divide-y divide-line">
                {checklist.map((c) => (
                  <li key={c.key} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    {c.done
                      ? <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                      : <Circle className="h-5 w-5 shrink-0 text-line-strong" aria-hidden="true" />}
                    <div className="min-w-0 flex-1">
                      <p className={c.done ? 'text-body text-muted line-through' : 'text-body font-medium text-fg'}>{t(`home.checklist.${c.key}.title`)}</p>
                      {!c.done && <p className="text-small text-muted">{t(`home.checklist.${c.key}.body`)}</p>}
                    </div>
                    <span className="sr-only">{c.done ? t('home.checklist.done') : t('home.checklist.todo')}</span>
                    {!c.done && c.action && (
                      <Button variant="secondary" size="sm" onClick={c.action}>{t(`home.checklist.${c.key}.cta`)}</Button>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card aria-labelledby="recent-title">
            <CardHeader titleId="recent-title" icon={Files} title={t('home.recent.title')}
              actions={recent?.length ? <Button variant="ghost" size="sm" rightIcon={ArrowRight} onClick={() => onNavigate('history')}>{t('home.recent.viewAll')}</Button> : null} />
            {recent === null ? (
              <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : recent.length === 0 ? (
              <EmptyState icon={FilePlus2} title={t('home.empty.title')} description={t('home.empty.body')}
                actions={<Button leftIcon={FilePlus2} onClick={() => onNavigate('generate')}>{t('home.empty.cta')}</Button>}>
                <div className="mt-6 w-full rounded-lg border border-line bg-subtle p-4 text-left">
                  <p className="mb-3 text-small font-medium text-fg">{t('home.empty.youNeed')}</p>
                  <ul className="space-y-1.5 text-small text-fg-2">
                    <li>• {t('home.empty.need1')}</li>
                    <li>• {t('home.empty.need2')}</li>
                    <li>• {t('home.empty.need3')}</li>
                  </ul>
                </div>
              </EmptyState>
            ) : (
              <ul className="-mx-2 divide-y divide-line">
                {recent.map((p) => (
                  <li key={p._id}>
                    <button type="button" onClick={() => onOpenProposal(p._id)}
                      className="flex w-full items-center gap-3 rounded-md px-2 py-3 text-left hover:bg-subtle">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-body font-medium text-fg">{p.jobTitle}</p>
                        <p className="truncate text-small text-muted">
                          {[p.clientName, formatDate(p.createdAt, currentLanguage)].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <StatusBadge status={p.status} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card aria-labelledby="how-title">
            <CardHeader titleId="how-title" title={t('home.how.title')} description={t('home.how.subtitle')} />
            <HowItWorks />
          </Card>
        </div>

        <aside className="space-y-6">
          <Card aria-labelledby="plan-title">
            <CardHeader titleId="plan-title" title={t('home.plan.title')}
              actions={plan ? <Badge tone={plan === 'free' ? 'neutral' : 'accent'}>{t(`shell.plans.${plan}`)}</Badge> : null} />
            {!subscription ? (
              <div className="space-y-4"><Skeleton className="h-8" /><Skeleton className="h-8" /></div>
            ) : (
              <div className="space-y-4">
                <UsageMeter label={limits.monthlyProposals != null && limits.dailyProposals == null ? t('shell.proposalsThisMonth') : t('shell.proposalsToday')} used={limits.monthlyProposals != null && limits.dailyProposals == null ? usage.proposalsThisMonth || 0 : usage.proposalsToday || 0} limit={limits.fairUse ? null : limits.dailyProposals ?? limits.monthlyProposals} unlimitedLabel={limits.fairUse ? t('home.plan.unlimitedFair') : t('home.plan.noDailyLimit')} />
                {limits.monthlyProposals != null && limits.dailyProposals != null && (
                  <UsageMeter label={t('shell.proposalsThisMonth')} used={usage.proposalsThisMonth || 0} limit={limits.monthlyProposals} />
                )}
                <UsageMeter label={t('home.plan.analysesToday')} used={usage.analysesToday || 0} limit={limits.dailyAnalyses} unlimitedLabel={t('home.plan.noDailyLimit')} />
                <Button variant={plan === 'free' ? 'primary' : 'secondary'} className="w-full" onClick={() => onNavigate('subscription')}>
                  {plan === 'free' ? t('home.plan.upgrade') : t('home.plan.manage')}
                </Button>
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
