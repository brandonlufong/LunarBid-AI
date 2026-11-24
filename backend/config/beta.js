// backend/config/beta.js
// ============================================================================
// Free-beta controls. All enforced SERVER-SIDE (never trust the client).
//
//   BETA_MODE=true            free beta: no payment, beta usage caps apply.
//   BILLING_ENABLED=false     payment collection is off (checkout refuses).
//   AI_GENERATION_ENABLED     emergency kill switch for AI generation.
//   REGISTRATION_ENABLED      lets us close sign-ups without a redeploy.
//   BETA_DAILY_PROPOSALS / BETA_MONTHLY_PROPOSALS   per-user caps in beta.
//   AI_DAILY_SPEND_CEILING_USD / AI_MONTHLY_SPEND_CEILING_USD  global ceilings.
//
// Beta caps only ever TIGHTEN a plan's limits (min), never raise them.
// ============================================================================
const bool = (v, def) => (v === undefined || v === '' ? def : /^(1|true|yes|on)$/i.test(String(v)));
const num = (v, def) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : def;
};

const beta = {
  // Defaults are normal production behaviour so tests/CI stay green.
  // The beta deployment opts in via .env: BETA_MODE=true and BILLING_ENABLED=false.
  BETA_MODE: bool(process.env.BETA_MODE, false),
  BILLING_ENABLED: bool(process.env.BILLING_ENABLED, true),
  AI_GENERATION_ENABLED: bool(process.env.AI_GENERATION_ENABLED, true),
  REGISTRATION_ENABLED: bool(process.env.REGISTRATION_ENABLED, true),

  BETA_DAILY_PROPOSALS: num(process.env.BETA_DAILY_PROPOSALS, 3),
  BETA_MONTHLY_PROPOSALS: num(process.env.BETA_MONTHLY_PROPOSALS, 15),

  AI_DAILY_SPEND_CEILING_USD: num(process.env.AI_DAILY_SPEND_CEILING_USD, 5),
  AI_MONTHLY_SPEND_CEILING_USD: num(process.env.AI_MONTHLY_SPEND_CEILING_USD, 50),
};

// Tighten-only: null (plan "unlimited") becomes the beta cap; otherwise the smaller wins.
const cap = (planVal, betaVal) => (planVal == null ? betaVal : Math.min(planVal, betaVal));

/** Apply beta caps to a plan-limits object (proposals only). Returns a new object. */
beta.applyBetaLimits = (limits) => {
  if (!beta.BETA_MODE) return limits;
  return {
    ...limits,
    dailyProposals: cap(limits.dailyProposals, beta.BETA_DAILY_PROPOSALS),
    monthlyProposals: cap(limits.monthlyProposals, beta.BETA_MONTHLY_PROPOSALS),
  };
};

/** Public, client-safe snapshot (for the beta banner / UI). No secrets. */
beta.publicFlags = () => ({
  betaMode: beta.BETA_MODE,
  billingEnabled: beta.BILLING_ENABLED,
  aiEnabled: beta.AI_GENERATION_ENABLED,
  registrationEnabled: beta.REGISTRATION_ENABLED,
});

module.exports = beta;
