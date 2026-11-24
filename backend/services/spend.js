// backend/services/spend.js
// ============================================================================
// Application-wide AI spend ceiling (a safety net on top of per-user quotas).
//
//   withinCeiling()  checked BEFORE an AI call; returns { allowed } (fail-open:
//                    a metering hiccup never blocks real generation).
//   record(kind)     called AFTER a successful real AI call; adds the estimated
//                    cost to the day + month meters atomically.
//
// Per-generation cost is a configurable estimate (exact token accounting isn't
// exposed by the fallback chain); it is intentionally conservative.
// ============================================================================
const AppUsage = require('../models/AppUsage');
const beta = require('../config/beta');

const num = (v, def) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : def;
};

const costOf = (kind) =>
  kind === 'analysis'
    ? num(process.env.AI_COST_PER_ANALYSIS_USD, 0.001)
    : num(process.env.AI_COST_PER_PROPOSAL_USD, 0.004);

const dayKey = (d = new Date()) => `spend:${d.toISOString().slice(0, 10)}`;
const monthKey = (d = new Date()) => `spend:${d.toISOString().slice(0, 7)}`;

async function withinCeiling() {
  const daily = beta.AI_DAILY_SPEND_CEILING_USD;
  const monthly = beta.AI_MONTHLY_SPEND_CEILING_USD;
  if (!(daily > 0) && !(monthly > 0)) return { allowed: true };
  try {
    const [d, m] = await Promise.all([
      AppUsage.findById(dayKey()).lean(),
      AppUsage.findById(monthKey()).lean(),
    ]);
    if (daily > 0 && (d?.spendUsd || 0) >= daily) return { allowed: false, scope: 'daily' };
    if (monthly > 0 && (m?.spendUsd || 0) >= monthly) return { allowed: false, scope: 'monthly' };
    return { allowed: true };
  } catch {
    return { allowed: true }; // fail-open: per-user quotas + kill switch are the hard controls
  }
}

async function record(kind) {
  const cost = costOf(kind);
  const now = new Date();
  try {
    await Promise.all([
      AppUsage.updateOne({ _id: dayKey(now) }, { $inc: { spendUsd: cost, count: 1 }, $set: { updatedAt: now } }, { upsert: true }),
      AppUsage.updateOne({ _id: monthKey(now) }, { $inc: { spendUsd: cost, count: 1 }, $set: { updatedAt: now } }, { upsert: true }),
    ]);
  } catch {
    /* metering is best-effort */
  }
}

module.exports = { withinCeiling, record };
