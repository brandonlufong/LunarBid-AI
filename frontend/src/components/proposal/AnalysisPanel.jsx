// Results of the AI job-post analysis. Estimates are labelled as estimates; the match score
// only appears when the user has a profile to compare against.
import React from 'react';
import { AlertTriangle, Lightbulb, ListChecks, Target, X } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { Badge, Button, Card, IconButton, Skeleton } from '../ui';

function Section({ icon: Icon, title, items, tone }) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className="mb-2 flex items-center gap-1.5 text-small font-semibold text-fg">
        <Icon className={tone === 'warning' ? 'h-4 w-4 text-warning' : 'h-4 w-4 text-muted'} aria-hidden="true" />{title}
      </h4>
      <ul className="space-y-1.5">
        {items.map((it, i) => <li key={i} className="flex gap-2 text-small text-fg-2"><span className="text-muted" aria-hidden="true">–</span><span>{it}</span></li>)}
      </ul>
    </div>
  );
}

export default function AnalysisPanel({ analysis, loading, onApply, onClose, applied }) {
  const { t } = useLanguage();
  return (
    <Card aria-labelledby="analysis-title" aria-busy={loading}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 id="analysis-title" className="text-h2 font-semibold text-fg">{t('analysis.title')}</h3>
          <p className="text-small text-muted">{t('analysis.subtitle')}</p>
        </div>
        <IconButton icon={X} label={t('analysis.close')} size="sm" onClick={onClose} />
      </div>

      {loading || !analysis ? (
        <div className="space-y-3" role="status" aria-label={t('analysis.loading')}>
          <Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" />
          <div className="grid gap-3 pt-2 sm:grid-cols-2"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
          <p className="pt-1 text-small text-muted">{t('analysis.loading')}</p>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-body text-fg">{analysis.summary}</p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-line bg-subtle p-3">
              <p className="text-caption text-muted">{t('analysis.match')}</p>
              {analysis.matchScore == null ? (
                <p className="mt-1 text-small text-fg-2">{t('analysis.noProfile')}</p>
              ) : (
                <>
                  <p className="mt-0.5 text-h1 font-semibold tabular-nums text-fg">{analysis.matchScore}<span className="text-body text-muted">/100</span></p>
                  {analysis.matchReason && <p className="text-caption text-muted">{analysis.matchReason}</p>}
                </>
              )}
            </div>
            <div className="rounded-md border border-line bg-subtle p-3">
              <p className="text-caption text-muted">{t('analysis.budget')}</p>
              <p className="mt-1 text-body font-medium text-fg">{analysis.estimatedBudgetRange}</p>
              <p className="text-caption text-muted">{t('analysis.estimate')}</p>
            </div>
            <div className="rounded-md border border-line bg-subtle p-3">
              <p className="text-caption text-muted">{t('analysis.complexity')}</p>
              <p className="mt-1 text-body font-medium text-fg">{t(`analysis.levels.${analysis.complexity}`)}</p>
              <p className="text-caption text-muted">{t('analysis.estimate')}</p>
            </div>
          </div>

          {analysis.suggestedSkills?.length > 0 && (
            <div>
              <h4 className="mb-2 text-small font-semibold text-fg">{t('analysis.skills')}</h4>
              <div className="flex flex-wrap gap-1.5">{analysis.suggestedSkills.map((s) => <Badge key={s}>{s}</Badge>)}</div>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <Section icon={ListChecks} title={t('analysis.requirements')} items={analysis.keyRequirements} />
            <Section icon={Target} title={t('analysis.needs')} items={analysis.clientPainPoints} />
            <Section icon={Lightbulb} title={t('analysis.angles')} items={analysis.winningAngles} />
            <Section icon={AlertTriangle} title={t('analysis.redFlags')} items={analysis.redFlags} tone="warning" />
          </div>

          <div className="flex flex-col gap-3 rounded-md border border-line p-3 sm:flex-row sm:items-center">
            <p className="flex-1 text-small text-fg-2">
              {t('analysis.suggestion', { tone: t(`composer.tones.${analysis.suggestedTone}`), length: t(`composer.lengths.${analysis.suggestedLength}`) })}
            </p>
            <Button variant="secondary" size="sm" onClick={onApply} disabled={applied}>{applied ? t('analysis.applied') : t('analysis.apply')}</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
