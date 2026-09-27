// Rate calculator: a transparent formula. Every adjustment is shown in the breakdown and
// the platform fee is entered by the user (fees differ by platform and change over time).
import React, { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { useToast } from '../UI/Toast';
import { Button, Card, CardHeader, Field, Input, PageHeader, Segmented } from '../ui';

const COMPLEXITY = { low: 0, medium: 0.15, high: 0.35 };
const RUSH = 0.25;
const PER_REVISION = 0.05;

export default function PricingCalculator() {
  const { t, currentLanguage } = useLanguage();
  const toast = useToast();
  const [form, setForm] = useState({ hours: '', rate: '', complexity: 'medium', rush: 'no', revisions: '2', fee: '10' });
  const [copied, setCopied] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  const calc = useMemo(() => {
    const hours = parseFloat(form.hours);
    const rate = parseFloat(form.rate);
    if (!(hours > 0) || !(rate > 0)) return null;
    const fee = Math.min(Math.max(parseFloat(form.fee) || 0, 0), 50) / 100;
    const revisions = Math.min(Math.max(parseInt(form.revisions, 10) || 0, 0), 10);
    const base = hours * rate;
    const complexity = base * COMPLEXITY[form.complexity];
    const revisionBuffer = (base + complexity) * revisions * PER_REVISION;
    const rush = form.rush === 'yes' ? (base + complexity + revisionBuffer) * RUSH : 0;
    const beforeFee = base + complexity + revisionBuffer + rush;
    // Quote so that what you receive after the platform's fee equals beforeFee.
    const quote = fee < 1 ? beforeFee / (1 - fee) : beforeFee;
    return { base, complexity, revisionBuffer, rush, feeAmount: quote - beforeFee, quote, youReceive: beforeFee, fee, revisions };
  }, [form]);

  const money = (n) => new Intl.NumberFormat(currentLanguage === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(Math.round(calc.quote)));
      setCopied(true);
      toast.success(t('calc.copied'));
      setTimeout(() => setCopied(false), 1800);
    } catch { toast.error(t('doc.copyError')); }
  };

  const rows = calc ? [
    { label: t('calc.rows.base', { hours: form.hours, rate: money(parseFloat(form.rate)) }), value: calc.base },
    { label: t('calc.rows.complexity', { pct: COMPLEXITY[form.complexity] * 100 }), value: calc.complexity },
    { label: t('calc.rows.revisions', { n: calc.revisions, pct: PER_REVISION * 100 }), value: calc.revisionBuffer },
    { label: t('calc.rows.rush', { pct: RUSH * 100 }), value: calc.rush },
    { label: t('calc.rows.fee', { pct: Math.round(calc.fee * 100) }), value: calc.feeAmount },
  ].filter((r) => r.value > 0.5) : [];

  return (
    <div>
      <PageHeader title={t('calc.title')} description={t('calc.subtitle')} />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={t('calc.inputs')} />
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('calc.hours')} required hint={t('calc.hoursHint')}>
                <Input type="number" inputMode="decimal" min="0" step="0.5" value={form.hours} onChange={set('hours')} placeholder="20" />
              </Field>
              <Field label={t('calc.rate')} required hint={t('calc.rateHint')}>
                <Input type="number" inputMode="decimal" min="0" value={form.rate} onChange={set('rate')} placeholder="60" />
              </Field>
            </div>
            <div>
              <p className="mb-1.5 text-small font-medium text-fg">{t('calc.complexity')}</p>
              <Segmented label={t('calc.complexity')} value={form.complexity} onChange={set('complexity')}
                options={['low', 'medium', 'high'].map((v) => ({ value: v, label: t(`analysis.levels.${v}`) }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('calc.revisions')} hint={t('calc.revisionsHint')}>
                <Input type="number" min="0" max="10" value={form.revisions} onChange={set('revisions')} />
              </Field>
              <Field label={t('calc.fee')} hint={t('calc.feeHint')}>
                <Input type="number" min="0" max="50" step="0.5" value={form.fee} onChange={set('fee')} />
              </Field>
            </div>
            <div>
              <p className="mb-1.5 text-small font-medium text-fg">{t('calc.rush')}</p>
              <Segmented label={t('calc.rush')} value={form.rush} onChange={set('rush')}
                options={[{ value: 'no', label: t('calc.rushNo') }, { value: 'yes', label: t('calc.rushYes') }]} className="max-w-xs" />
            </div>
          </div>
        </Card>

        <Card aria-live="polite" className="lg:sticky lg:top-6">
          <CardHeader title={t('calc.result')} />
          {!calc ? (
            <p className="py-10 text-center text-body text-muted">{t('calc.empty')}</p>
          ) : (
            <>
              <p className="text-small text-muted">{t('calc.quote')}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <p className="text-display font-semibold tabular-nums tracking-tight text-fg">{money(calc.quote)}</p>
                <Button variant="secondary" size="sm" leftIcon={copied ? Check : Copy} onClick={copy}>{t('calc.copy')}</Button>
              </div>
              <p className="mt-1 text-small text-fg-2">{t('calc.receive', { amount: money(calc.youReceive) })}</p>
              <dl className="mt-6 divide-y divide-line border-t border-line">
                {rows.map((r) => (
                  <div key={r.label} className="flex justify-between gap-4 py-2.5 text-small">
                    <dt className="text-fg-2">{r.label}</dt>
                    <dd className="tabular-nums font-medium text-fg">{money(r.value)}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-caption text-muted">{t('calc.disclaimer')}</p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
