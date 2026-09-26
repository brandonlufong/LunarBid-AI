// backend/services/usage.js
// ============================================================================
// Plan quotas, enforced atomically.
//
// reserve() first rolls daily/monthly counters over when a new period starts, then
// increments the counter in ONE database operation that only succeeds while the
// user is under the limit. Simultaneous requests can therefore never exceed the
// limit, and counts are never lost to overlapping saves. If the AI call fails (or
// falls back to a template), release() gives the reservation back.
// ============================================================================
const User = require('../models/User');

const COUNTERS = {
  proposal: ['usage.proposalsToday', 'usage.proposalsThisMonth', 'usage.totalProposals'],
  analysis: ['usage.analysesToday'],
};

/** Persist counter roll-overs (new day or month) computed by the model's check methods. */
async function persistRollover(user, kind) {
  const set = {};
  if (kind === 'proposal') {
    set['usage.proposalsToday'] = user.usage.proposalsToday;
    set['usage.lastResetDate'] = user.usage.lastResetDate;
    set['usage.proposalsThisMonth'] = user.usage.proposalsThisMonth;
    set['usage.monthlyResetDate'] = user.usage.monthlyResetDate;
  } else {
    set['usage.analysesToday'] = user.usage.analysesToday || 0;
    set['usage.analysisResetDate'] = user.usage.analysisResetDate;
  }
  await User.updateOne({ _id: user._id }, { $set: set });
}

/**
 * Reserve one unit of quota. Returns { allowed: true, release } or
 * { allowed: false, reason, limit } when the plan limit is reached.
 */
async function reserve(user, kind) {
  const check = kind === 'proposal' ? user.canGenerateProposal() : user.canAnalyze();
  if (user.isModified('usage')) await persistRollover(user, kind);
  if (!check.allowed) return check;

  const limits = user.getPlanLimits();
  const conditions = { _id: user._id };
  if (kind === 'proposal') {
    if (limits.dailyProposals != null) conditions['usage.proposalsToday'] = { $lt: limits.dailyProposals };
    if (limits.monthlyProposals != null) conditions['usage.proposalsThisMonth'] = { $lt: limits.monthlyProposals };
  } else if (limits.dailyAnalyses != null) {
    conditions['usage.analysesToday'] = { $lt: limits.dailyAnalyses };
  }

  const inc = Object.fromEntries(COUNTERS[kind].map((f) => [f, 1]));
  const updated = await User.findOneAndUpdate(conditions, { $inc: inc }, { new: true });
  if (!updated) {
    const limit = kind === 'proposal' ? limits.dailyProposals ?? limits.monthlyProposals : limits.dailyAnalyses;
    const reason = kind === 'analysis' ? 'daily_analysis_limit' : limits.dailyProposals != null ? 'daily_limit' : 'monthly_limit';
    return { allowed: false, reason, limit };
  }
  user.usage = updated.usage; // keep the in-memory copy current for the response

  let released = false;
  return {
    allowed: true,
    release: async () => {
      if (released) return;
      released = true;
      const dec = Object.fromEntries(COUNTERS[kind].map((f) => [f, -1]));
      await User.updateOne({ _id: user._id }, { $inc: dec });
      COUNTERS[kind].forEach((f) => {
        const key = f.split('.')[1];
        user.usage[key] = Math.max(0, (user.usage[key] || 0) - 1);
      });
    },
  };
}

module.exports = { reserve };
