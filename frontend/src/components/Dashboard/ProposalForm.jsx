// Proposal composer: the job (required), optional details, style — then generate.
// The result appears as an editable document (ProposalDocument).
import React, { useEffect, useRef, useState } from 'react';
import { FilePlus2, ScanSearch, Sparkles, Wand2 } from 'lucide-react';
import { analyzeJob, generateProposal, getProfile } from '../../services/api';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { useToast } from '../UI/Toast';
import { TEMPLATE_META } from '../../config/proposalTemplates';
import { Alert, Button, Card, Field, Input, Menu, PageHeader, Segmented, Skeleton, Textarea } from '../ui';
import ProposalDocument from '../proposal/ProposalDocument';
import AnalysisPanel from '../proposal/AnalysisPanel';

const MAX_DESCRIPTION = 8000;
const EMPTY = { jobTitle: '', jobDescription: '', clientName: '', budget: '', tone: 'friendly', length: 'medium' };

function usageNote(subscription, t) {
  const limits = subscription?.limits || {};
  const usage = subscription?.usage || {};
  if (limits.fairUse) return subscription ? { left: Infinity, text: t('composer.unlimitedFair', { n: limits.dailyProposals }) } : null;
  if (limits.dailyProposals != null) {
    const left = Math.max(0, limits.dailyProposals - (usage.proposalsToday || 0));
    return { left, text: t('composer.usesDaily', { left, limit: limits.dailyProposals }) };
  }
  if (limits.monthlyProposals != null) {
    const left = Math.max(0, limits.monthlyProposals - (usage.proposalsThisMonth || 0));
    return { left, text: t('composer.usesMonthly', { left, limit: limits.monthlyProposals }) };
  }
  return subscription ? { left: Infinity, text: t('composer.unlimited') } : null;
}

export default function ProposalForm({ editingProposal, subscription, onProposalGenerated, onNavigate }) {
  const { t } = useLanguage();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY); // untouched while it is still the EMPTY object
  const [errors, setErrors] = useState({});
  const [generating, setGenerating] = useState(false);
  const [slow, setSlow] = useState(false);
  const [problem, setProblem] = useState(null); // { tone, title, body, upgrade }
  const [result, setResult] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analyzedText, setAnalyzedText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [applied, setApplied] = useState(false);
  const resultRef = useRef(null);

  // Start from the tone chosen in Settings (unless we're reusing an earlier proposal).
  useEffect(() => {
    if (editingProposal) return;
    const map = { Professional: 'formal', Friendly: 'friendly', Persuasive: 'persuasive' };
    getProfile()
      .then((r) => { const tone = map[r.data?.preferredTone]; if (tone) setForm((f) => (f === EMPTY ? { ...f, tone } : f)); })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Use as a starting point" from history
  useEffect(() => {
    if (!editingProposal) return;
    setForm({ ...EMPTY, ...editingProposal }); // eslint-disable-line react-hooks/set-state-in-effect
    setResult(null);
  }, [editingProposal]);

  // Only honest progress: after 15s, explain that a backup provider may be in use.
  useEffect(() => {
    if (!generating) { setSlow(false); return undefined; } // eslint-disable-line react-hooks/set-state-in-effect
    const id = setTimeout(() => setSlow(true), 15000);
    return () => clearTimeout(id);
  }, [generating]);

  const set = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!form.jobTitle.trim()) er.jobTitle = t('composer.errors.title');
    if (form.jobDescription.trim().length < 20) er.jobDescription = t('composer.errors.description');
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const explain = (err) => {
    const data = err.response?.data || {};
    if (data.code === 'email_unverified') return { tone: 'warning', title: t('composer.problems.unverifiedTitle'), body: data.message };
    if (err.response?.status === 403 && data.reason) {
      return { tone: 'warning', title: t('composer.problems.limitTitle'), body: data.message, upgrade: data.canUpgrade !== false };
    }
    if (err.response?.status === 429) return { tone: 'warning', title: t('composer.problems.slowDownTitle'), body: data.message };
    return { tone: 'danger', title: t('composer.problems.errorTitle'), body: data.message || t('composer.problems.errorBody') };
  };

  const generate = async (e) => {
    e?.preventDefault();
    if (!validate()) return;
    setGenerating(true);
    setProblem(null);
    try {
      const res = await generateProposal(form);
      setResult({
        id: res.data.id, text: res.data.proposal, isTemplate: res.data.isTemplate,
        createdAt: res.data.createdAt || new Date().toISOString(), title: form.jobTitle, clientName: form.clientName,
      });
      onProposalGenerated?.();
      if (window.matchMedia('(max-width: 1023px)').matches) {
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      }
    } catch (err) {
      setProblem(explain(err));
    } finally {
      setGenerating(false);
    }
  };

  const analyze = async () => {
    if (form.jobDescription.trim().length < 20) {
      setErrors((er) => ({ ...er, jobDescription: t('composer.errors.description') }));
      return;
    }
    setShowAnalysis(true);
    if (analysis && analyzedText === form.jobDescription) return;
    setApplied(false);
    setAnalyzing(true);
    try {
      const res = await analyzeJob({ jobDescription: form.jobDescription, jobTitle: form.jobTitle });
      setAnalysis(res.data.analysis);
      setAnalyzedText(form.jobDescription);
      onProposalGenerated?.(); // refresh usage (analyses count too)
    } catch (err) {
      setShowAnalysis(false);
      setProblem(explain(err));
    } finally {
      setAnalyzing(false);
    }
  };

  const applyExample = (i) => {
    const item = t('dashboard.templates.items')[i];
    const meta = TEMPLATE_META[i] || {};
    setForm((f) => ({ ...f, jobTitle: item.jobTitle, jobDescription: item.jobDescription, tone: meta.tone || f.tone, length: meta.length || f.length }));
    setErrors({});
  };

  const note = usageNote(subscription, t);
  const outOfQuota = note && note.left === 0;
  const examples = (t('dashboard.templates.items') || []).map((item, i) => ({ label: item.label, onSelect: () => applyExample(i) }));
  const tones = ['formal', 'friendly', 'persuasive'].map((v) => ({ value: v, label: t(`composer.tones.${v}`) }));
  const lengths = ['short', 'medium', 'detailed'].map((v) => ({ value: v, label: t(`composer.lengths.${v}`) }));

  return (
    <div>
      <PageHeader title={t('composer.title')} description={t('composer.subtitle')} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Composer */}
        <form onSubmit={generate} noValidate className="space-y-6">
          <Card>
            <p className="mb-4 text-caption font-medium uppercase tracking-wider text-muted">{t('composer.step1')}</p>
            <div className="space-y-4">
              <Field label={t('composer.jobTitle')} required error={errors.jobTitle}>
                <Input value={form.jobTitle} onChange={set('jobTitle')} maxLength={200} placeholder={t('composer.jobTitlePlaceholder')} />
              </Field>
              <Field label={t('composer.jobPost')} required error={errors.jobDescription}
                hint={t('composer.jobPostHint')}
                counter={`${form.jobDescription.length.toLocaleString()} / ${MAX_DESCRIPTION.toLocaleString()}`}
                labelAction={examples.length ? (
                  <Menu items={examples} trigger={(p) => (
                    <button type="button" {...p} className="inline-flex items-center gap-1 text-small font-medium text-accent-text hover:underline">
                      <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />{t('composer.tryExample')}
                    </button>
                  )} />
                ) : null}>
                <Textarea value={form.jobDescription} onChange={set('jobDescription')} maxLength={MAX_DESCRIPTION} rows={9}
                  placeholder={t('composer.jobPostPlaceholder')} />
              </Field>
              <div className="flex flex-col gap-2 rounded-md border border-line bg-subtle p-3 sm:flex-row sm:items-center">
                <p className="flex-1 text-small text-fg-2">{t('composer.analyzeHint')}</p>
                <Button variant="secondary" size="sm" leftIcon={ScanSearch} onClick={analyze} loading={analyzing}>{t('composer.analyze')}</Button>
              </div>
            </div>
          </Card>

          <Card>
            <p className="mb-4 text-caption font-medium uppercase tracking-wider text-muted">{t('composer.step2')}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('composer.clientName')} optional={t('common.optional')} hint={t('composer.clientNameHint')}>
                <Input value={form.clientName} onChange={set('clientName')} maxLength={120} autoComplete="off" />
              </Field>
              <Field label={t('composer.budget')} optional={t('common.optional')} hint={t('composer.budgetHint')}>
                <Input value={form.budget} onChange={set('budget')} maxLength={60} placeholder={t('composer.budgetPlaceholder')} />
              </Field>
            </div>
          </Card>

          <Card>
            <p className="mb-4 text-caption font-medium uppercase tracking-wider text-muted">{t('composer.step3')}</p>
            <div className="space-y-4">
              <div>
                <p id="tone-label" className="mb-1.5 text-small font-medium text-fg">{t('composer.tone')}</p>
                <Segmented label={t('composer.tone')} value={form.tone} onChange={set('tone')} options={tones} describedBy="tone-help" />
                <p id="tone-help" className="mt-1.5 text-caption text-muted">{t(`composer.toneHelp.${form.tone}`)}</p>
              </div>
              <div>
                <p className="mb-1.5 text-small font-medium text-fg">{t('composer.length')}</p>
                <Segmented label={t('composer.length')} value={form.length} onChange={set('length')} options={lengths} describedBy="length-help" />
                <p id="length-help" className="mt-1.5 text-caption text-muted">{t(`composer.lengthHelp.${form.length}`)}</p>
              </div>
            </div>
          </Card>

          <div className="space-y-3 lg:sticky lg:bottom-4">
            {problem && (
              <Alert tone={problem.tone} title={problem.title}
                action={problem.upgrade ? <Button size="sm" onClick={() => onNavigate?.('subscription')}>{t('composer.seePlans')}</Button> : null}>
                {problem.body}
              </Alert>
            )}
            <div className="rounded-lg border border-line bg-surface p-3 shadow-pop">
              <Button type="submit" size="lg" className="w-full" leftIcon={Sparkles} loading={generating} disabled={outOfQuota} data-action="generate">
                {generating ? t('composer.generating') : result ? t('composer.generateAgain') : t('composer.generate')}
              </Button>
              {note && <p className="mt-2 text-center text-caption text-muted">{note.text}</p>}
            </div>
          </div>
        </form>

        {/* Result */}
        <div ref={resultRef} className="scroll-mt-20 space-y-6 lg:sticky lg:top-6">
          {showAnalysis && (
            <AnalysisPanel analysis={analysis} loading={analyzing} applied={applied} onClose={() => setShowAnalysis(false)}
              onApply={() => {
                setForm((f) => ({ ...f, tone: analysis.suggestedTone || f.tone, length: analysis.suggestedLength || f.length }));
                setApplied(true);
                toast.success(t('analysis.appliedToast'));
              }} />
          )}
          {generating ? (
            <Card aria-busy="true">
              <div role="status" aria-live="polite">
                <p className="flex items-center gap-2 text-body font-medium text-fg">
                  <Sparkles className="h-4 w-4 text-accent-text" aria-hidden="true" />{t('composer.writing')}
                </p>
                <p className="mt-1 text-small text-muted">{slow ? t('composer.slow') : t('composer.writingHint')}</p>
              </div>
              <div className="mt-6 space-y-3" aria-hidden="true">
                <Skeleton className="h-7 w-2/3" />
                <div className="space-y-2.5 pt-3">{[100, 96, 98, 90, 60].map((w, i) => <Skeleton key={i} className="h-4" style={{ width: `${w}%` }} />)}</div>
                <div className="space-y-2.5 pt-3">{[97, 93, 99, 70].map((w, i) => <Skeleton key={i} className="h-4" style={{ width: `${w}%` }} />)}</div>
              </div>
            </Card>
          ) : result ? (
            <ProposalDocument key={result.id} id={result.id} title={result.title} clientName={result.clientName}
              createdAt={result.createdAt} text={result.text} isTemplate={result.isTemplate}
              onRegenerate={() => generate()} regenerating={generating} onSent={onProposalGenerated} />
          ) : !showAnalysis ? (
            <Card className="hidden lg:block">
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-subtle text-fg-2">
                  <FilePlus2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="text-h2 font-semibold text-fg">{t('composer.placeholderTitle')}</h2>
                <p className="mt-2 max-w-sm text-body text-muted">{t('composer.placeholderBody')}</p>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
