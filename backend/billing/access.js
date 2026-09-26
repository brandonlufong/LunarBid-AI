// backend/billing/access.js
// ============================================================================
// Entitlements: what a user can actually use right now.
//
// `subscription.plan` records what a user subscribed to; it is NOT proof of
// payment. Access to a paid plan requires a subscription status that Stripe has
// confirmed through the webhook. Everything that gates features or limits must
// go through effectivePlan().
// ============================================================================

// Stripe subscription statuses (note Stripe's spelling: "canceled").
const STRIPE_STATUSES = [
  'active',
  'trialing',
  'past_due',
  'incomplete',
  'incomplete_expired',
  'unpaid',
  'canceled',
  'paused',
];

// Statuses that keep paid features switched on.
// past_due: Stripe is retrying a failed renewal. Access continues during the retry
// window; if every retry fails Stripe moves the subscription to unpaid or canceled
// (per your Stripe settings) and access stops.
const ENTITLED_STATUSES = new Set(['active', 'trialing', 'past_due']);

/** Normalise any status (including legacy values stored before this fix). */
function normalizeStatus(status) {
  if (status === 'cancelled') return 'canceled'; // legacy British spelling
  if (status === 'expired') return 'canceled';
  return STRIPE_STATUSES.includes(status) ? status : 'incomplete';
}

/** The plan whose features and limits apply to this user right now. */
function effectivePlan(user) {
  const sub = user?.subscription || {};
  const plan = sub.plan || 'free';
  if (plan === 'free') return 'free';
  if (!sub.stripeSubscriptionId) return 'free'; // never paid through Stripe
  return ENTITLED_STATUSES.has(normalizeStatus(sub.status)) ? plan : 'free';
}

/** True when a paid subscription exists but is not currently granting access. */
function isPaymentIssue(user) {
  const sub = user?.subscription || {};
  return sub.plan !== 'free' && effectivePlan(user) === 'free';
}

module.exports = {
  STRIPE_STATUSES,
  ENTITLED_STATUSES,
  normalizeStatus,
  effectivePlan,
  isPaymentIssue,
};
