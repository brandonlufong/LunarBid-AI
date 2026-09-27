// Plan & billing. Plan cards are built from the backend plan configuration, so the page
// only lists limits and features the product actually enforces. Payments happen in the
// payment provider's hosted checkout; access changes only after the provider confirms.
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, CreditCard, Loader2, Minus } from 'lucide-react';
import { createCheckout, getPlans, getSubscription, openBillingPortal } from '../../services/api';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { useToast } from '../UI/Toast';
import { Alert, Badge, Button, Card, PageHeader, Skeleton, UsageMeter, cn } from '../ui';
import { formatDate } from './proposalMeta.jsx';
import { planLines, PLAN_ORDER as ORDER } from '../billing/planLines';


export default function Subscription({ onSubscriptionChange }) {
  const { t, currentLanguage } = useLanguage();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [plans, setPlans] = useState(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState('');
  const [activating, setActivating] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = async () => {
    try {
      const res = await getSubscription();
      setData(res.data);
      setFailed(false);
      return res.data;
    } catch {
      setFailed(true);
      return null;
    }
  };

  useEffect(() => {
    getPlans().then((r) => setPlans(r.data.plans || [])).catch(() => setPlans([]));
    const checkout = new URLSearchParams(location.search).get('checkout');
    load().then(async (d) => {
      if (checkout === 'success') {
        // The provider confirms payment through the webhook, usually within seconds.
        setNotice({ tone: 'success', text: t('billing.checkoutSuccess') });
        if (d?.subscription?.plan === 'free') {
          setActivating(true);
          for (let i = 0; i < 10; i += 1) {
            await new Promise((r) => setTimeout(r, 2000));
            const next = await load();
            if (next?.subscription?.plan !== 'free') { onSubscriptionChange?.(); break; }
          }
          setActivating(false);
        }
      } else if (checkout === 'cancelled') {
        setNotice({ tone: 'info', text: t('billing.checkoutCancelled') });
      }
      if (checkout) navigate('/dashboard?tab=subscription', { replace: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCheckout = async (planId) => {
    setBusy(planId);
    try {
      const res = await createCheckout(planId);
      window.location.assign(res.data.url);
    } catch (err) {
      const d = err.response?.data || {};
      toast.error(d.comingSoon || err.response?.status >= 500 ? t('billing.unavailable') : d.message || t('billing.checkoutError'));
      setBusy('');
    }
  };

  const openPortal = async () => {
    setBusy('portal');
    try {
      const res = await openBillingPortal();
      window.location.assign(res.data.url);
    } catch {
      toast.error(t('billing.portalError'));
      setBusy('');
    }
  };

  if (failed && !data) {
    return (
      <div>
        <PageHeader title={t('billing.title')} />
        <Alert tone="danger" title={t('billing.loadErrorTitle')} action={<Button size="sm" variant="secondary" onClick={load}>{t('common.retry')}</Button>}>
          {t('billing.loadErrorBody')}
        </Alert>
      </div>
    );
  }

  const sub = data?.subscription;
  const current = sub?.plan;
  const usage = data?.usage || {};
  const limits = data?.limits || {};
  const sorted = (plans || []).slice().sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
  const currentPrice = sorted.find((p) => p.id === current)?.price;

  return (
    <div>
      <PageHeader title={t('billing.title')} description={t('billing.subtitle')} />

      <div className="space-y-4">
        {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
        {activating && (
          <Alert tone="info"><span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{t('billing.activating')}</span></Alert>
        )}
        {sub?.paymentIssue && (
          <Alert tone="warning" title={t('billing.paymentIssueTitle')}
            action={sub.hasBillingAccount ? <Button size="sm" onClick={openPortal} loading={busy === 'portal'}>{t('billing.updatePayment')}</Button> : null}>
            {t('billing.paymentIssueBody', { plan: t(`shell.plans.${sub.subscribedPlan}`) })}
          </Alert>
        )}
      </div>

      {/* Current plan */}
      <Card className="mt-4" aria-labelledby="current-plan">
        {!data ? (
          <div className="grid gap-6 sm:grid-cols-3"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <p id="current-plan" className="text-small text-muted">{t('billing.currentPlan')}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-h1 font-semibold text-fg">{t(`shell.plans.${current}`)}</p>
                {currentPrice > 0 && <p className="text-body text-muted">{t('billing.perMonth', { price: currentPrice })}</p>}
                {sub.cancelAtPeriodEnd && <Badge tone="warning">{t('billing.ending')}</Badge>}
              </div>
              {sub.cancelAtPeriodEnd && sub.endDate && (
                <p className="mt-2 text-small text-fg-2">{t('billing.endsOn', { date: formatDate(sub.endDate, currentLanguage) })}</p>
              )}
              {!sub.cancelAtPeriodEnd && current !== 'free' && sub.endDate && (
                <p className="mt-2 text-small text-fg-2">{t('billing.renewsOn', { date: formatDate(sub.endDate, currentLanguage) })}</p>
              )}
              {sub.hasBillingAccount && (
                <Button variant="secondary" className="mt-4" leftIcon={CreditCard} onClick={openPortal} loading={busy === 'portal'}>{t('billing.manage')}</Button>
              )}
            </div>
            <div className="space-y-4">
              {limits.dailyProposals != null || limits.fairUse ? <UsageMeter label={t('shell.proposalsToday')} used={usage.proposalsToday || 0} limit={limits.fairUse ? null : limits.dailyProposals} unlimitedLabel={limits.fairUse ? t('home.plan.unlimitedFair') : t('home.plan.noDailyLimit')} /> : null}
              {limits.monthlyProposals != null && <UsageMeter label={t('shell.proposalsThisMonth')} used={usage.proposalsThisMonth || 0} limit={limits.monthlyProposals} />}
              <UsageMeter label={t('home.plan.analysesToday')} used={usage.analysesToday || 0} limit={limits.dailyAnalyses} unlimitedLabel={t('home.plan.noDailyLimit')} />
              <p className="text-caption text-muted">{t('billing.resetNote')}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Plans */}
      <h2 className="mb-4 mt-10 text-h2 font-semibold text-fg">{t('billing.plansTitle')}</h2>
      {plans === null ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{ORDER.map((p) => <Skeleton key={p} className="h-80" />)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sorted.map((plan) => {
            const isCurrent = plan.id === current;
            const higher = ORDER.indexOf(plan.id) > ORDER.indexOf(current);
            return (
              <Card key={plan.id} padded={false} aria-labelledby={`plan-${plan.id}`}
                className={cn('flex flex-col p-5', isCurrent && 'ring-2 ring-accent')}>
                <div className="flex items-center justify-between gap-2">
                  <h3 id={`plan-${plan.id}`} className="text-h3 font-semibold text-fg">{t(`shell.plans.${plan.id}`)}</h3>
                  {isCurrent ? <Badge tone="accent">{t('billing.current')}</Badge> : plan.comingSoon ? <Badge>{t('billing.comingSoon')}</Badge> : null}
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
                        {line.ok
                          ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                          : <Minus className="mt-0.5 h-4 w-4 shrink-0 text-line-strong" aria-hidden="true" />}
                        <span>{line.ok ? line.text : <><span className="sr-only">{t('billing.notIncluded')} </span>{line.text}</>}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-6">
                  {isCurrent ? (
                    <Button variant="secondary" className="w-full" disabled>{t('billing.current')}</Button>
                  ) : plan.comingSoon || !plan.purchasable ? (
                    <Button variant="secondary" className="w-full" disabled>{plan.id === 'free' ? t('billing.freeIncluded') : t('billing.comingSoon')}</Button>
                  ) : higher && current === 'free' ? (
                    <Button className="w-full" onClick={() => startCheckout(plan.id)} loading={busy === plan.id}>{t('billing.choose', { plan: t(`shell.plans.${plan.id}`) })}</Button>
                  ) : (
                    <Button variant="secondary" className="w-full" onClick={openPortal} loading={busy === 'portal'} disabled={!sub?.hasBillingAccount}>
                      {higher ? t('billing.switchUp') : t('billing.switchDown')}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Billing questions */}
      <section className="mt-10 grid gap-6 border-t border-line pt-8 md:grid-cols-2 xl:grid-cols-4" aria-label={t('billing.faqLabel')}>
        {['limit', 'cancel', 'change', 'refund'].map((q) => (
          <div key={q}>
            <h3 className="text-small font-semibold text-fg">{t(`billing.faq.${q}.q`)}</h3>
            <p className="mt-1 text-small text-muted">{t(`billing.faq.${q}.a`)}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
