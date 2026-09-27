// Analytics (Pro): win rate and response time from the statuses you set in Proposals.
// Revenue isn't shown because LunarBid doesn't record deal values.
import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3, Download, Lock } from 'lucide-react';
import api from '../../services/api';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { useToast } from '../UI/Toast';
import { Alert, Button, Card, CardHeader, EmptyState, PageHeader, Select, Skeleton } from '../ui';

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function Stat({ label, value, hint }) {
  return (
    <Card>
      <p className="text-small text-muted">{label}</p>
      <p className="mt-1 text-display font-semibold tabular-nums tracking-tight text-fg">{value}</p>
      {hint && <p className="mt-1 text-caption text-muted">{hint}</p>}
    </Card>
  );
}

export default function Analytics({ onNavigate }) {
  const { t, currentLanguage } = useLanguage();
  const toast = useToast();
  const [period, setPeriod] = useState('30');
  const [data, setData] = useState(null);
  const [locked, setLocked] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    api.get('/analytics/dashboard', { params: { period } })
      .then((r) => { if (live) { setData(r.data); setFailed(false); } })
      .catch((err) => { if (!live) return; if (err.response?.status === 403) setLocked(true); else setFailed(true); });
    return () => { live = false; };
  }, [period]);

  const exportCsv = async () => {
    try {
      const r = await api.get('/analytics/export', { params: { format: 'csv' }, responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a');
      a.href = url; a.download = `lunarbid-analytics-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error(t('analytics.exportError')); }
  };

  if (locked) {
    return (
      <div>
        <PageHeader title={t('analytics.title')} description={t('analytics.subtitle')} />
        <Card><EmptyState icon={Lock} title={t('analytics.lockedTitle')} description={t('analytics.lockedBody')}
          actions={<Button onClick={() => onNavigate?.('subscription')}>{t('home.plan.upgrade')}</Button>} /></Card>
      </div>
    );
  }

  const o = data?.overview || {};
  const decided = Number(o.total || 0);
  const colors = { accent: css('--accent') || '#4f46e5', success: css('--success') || '#067647', grid: css('--border') || '#e4e7ec', muted: css('--muted') || '#667085' };
  const tones = (data?.performanceByTone || []).filter((r) => r.tone).map((r) => ({ ...r, label: t(`composer.tones.${r.tone}`) }));
  const months = (data?.monthlyTrends || []).slice().sort((a, b) => a.month.localeCompare(b.month)).map((m) => ({
    ...m, label: new Date(`${m.month}-01T00:00:00Z`).toLocaleDateString(currentLanguage === 'fr' ? 'fr-FR' : 'en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
    rate: Number(m.winRate),
  }));
  const tooltipStyle = { background: css('--surface'), border: `1px solid ${colors.grid}`, borderRadius: 8, fontSize: 13, color: css('--text') };

  return (
    <div>
      <PageHeader title={t('analytics.title')} description={t('analytics.subtitle')}
        actions={<>
          <div className="w-44">
            <Select aria-label={t('analytics.period')} value={period} onChange={(e) => { setData(null); setPeriod(e.target.value); }}>
              {['7', '30', '90', '365'].map((p) => <option key={p} value={p}>{t(`analytics.periods.${p}`)}</option>)}
            </Select>
          </div>
          <Button variant="secondary" leftIcon={Download} onClick={exportCsv} disabled={!decided}>{t('analytics.export')}</Button>
        </>} />

      {failed ? (
        <Alert tone="danger">{t('analytics.loadError')}</Alert>
      ) : !data ? (
        <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : decided === 0 ? (
        <Card><EmptyState icon={BarChart3} title={t('analytics.emptyTitle')} description={t('analytics.emptyBody')}
          actions={<Button variant="secondary" onClick={() => onNavigate?.('history')}>{t('analytics.goToProposals')}</Button>} /></Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label={t('analytics.winRate')} value={`${Math.round(Number(o.winRate || 0))}%`} hint={t('analytics.winRateHint', { won: o.won || 0, decided })} />
            <Stat label={t('analytics.decided')} value={decided} hint={t('analytics.decidedHint', { won: o.won || 0, lost: o.lost || 0 })} />
            <Stat label={t('analytics.responseTime')} value={o.avgResponseTime ? t('analytics.hours', { n: Math.round(o.avgResponseTime) }) : '—'} hint={t('analytics.responseTimeHint')} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title={t('analytics.byTone')} description={t('analytics.byToneHint')} />
              <div className="h-64" role="img" aria-label={t('analytics.byTone')}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tones} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                    <CartesianGrid stroke={colors.grid} vertical={false} />
                    <XAxis dataKey="label" stroke={colors.muted} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} stroke={colors.muted} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: colors.grid, opacity: 0.4 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="total" name={t('analytics.decided')} fill={colors.accent} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="won" name={t('proposal.status.accepted')} fill={colors.success} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card>
              <CardHeader title={t('analytics.trend')} description={t('analytics.trendHint')} />
              {months.length < 2 ? (
                <p className="flex h-64 items-center justify-center text-center text-small text-muted">{t('analytics.trendEmpty')}</p>
              ) : (
                <div className="h-64" role="img" aria-label={t('analytics.trend')}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={months} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                      <CartesianGrid stroke={colors.grid} vertical={false} />
                      <XAxis dataKey="label" stroke={colors.muted} fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis unit="%" domain={[0, 100]} stroke={colors.muted} fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, t('analytics.winRate')]} />
                      <Line type="monotone" dataKey="rate" stroke={colors.accent} strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
