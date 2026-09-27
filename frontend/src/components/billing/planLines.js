// Plan features as display lines, derived from the backend plan configuration
// (GET /subscription/plans). Shared by Plan & billing and the public pricing section,
// so both always show exactly what the product enforces.
export const PLAN_ORDER = ['free', 'starter', 'pro', 'agency'];

export function planLines(plan, t) {
  const l = plan.limits || {};
  const f = plan.features || {};
  const lines = [];
  if (l.fairUse) lines.push({ ok: true, text: t('billing.lines.fairUse', { n: l.dailyProposals }) });
  else if (l.dailyProposals != null) lines.push({ ok: true, text: t('billing.lines.dailyProposals', { n: l.dailyProposals }) });
  else if (l.monthlyProposals != null) lines.push({ ok: true, text: t('billing.lines.monthlyProposals', { n: l.monthlyProposals }) });
  else lines.push({ ok: true, text: t('billing.lines.unlimitedProposals') });
  if (l.dailyAnalyses != null) lines.push({ ok: true, text: t('billing.lines.analyses', { n: l.dailyAnalyses }) });
  lines.push({ ok: true, text: t('billing.lines.export') });
  lines.push(f.clientProfiles
    ? { ok: true, text: l.clientProfiles == null ? t('billing.lines.clientsUnlimited') : t('billing.lines.clients', { n: l.clientProfiles }) }
    : { ok: false, text: t('billing.lines.clientsNone') });
  lines.push({ ok: !!f.analytics, text: t('billing.lines.analytics') });
  lines.push({ ok: !!f.customBranding, text: t('billing.lines.branding') });
  lines.push({ ok: !!f.prioritySupport, text: t('billing.lines.support') });
  return lines;
}
