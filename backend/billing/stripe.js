// backend/billing/stripe.js
// ============================================================================
// Stripe client and the single function that applies Stripe's subscription
// state to a user. Only the webhook calls applySubscription(); no other code
// path changes a user's plan or status.
// ============================================================================
const Stripe = require('stripe');
const User = require('../models/User');
const { getPlanByPriceId } = require('../config/plans');
const { normalizeStatus } = require('./access');

let client = null;
function stripe() {
  if (!client) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not configured');
    client = Stripe(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2, timeout: 20000 });
  }
  return client;
}

// Stripe moved current_period_* from the subscription onto its items in newer API
// versions. Read whichever is present so renewal dates are always saved.
function periodOf(sub) {
  const item = sub.items?.data?.[0] || {};
  const start = item.current_period_start ?? sub.current_period_start;
  const end = item.current_period_end ?? sub.current_period_end;
  return {
    start: start ? new Date(start * 1000) : undefined,
    end: end ? new Date(end * 1000) : undefined,
  };
}

async function findUserForSubscription(sub) {
  const userId = sub.metadata?.userId;
  if (userId) {
    const byId = await User.findById(userId).catch(() => null);
    if (byId) return byId;
  }
  return (
    (await User.findOne({ 'subscription.stripeSubscriptionId': sub.id })) ||
    (sub.customer ? await User.findOne({ 'subscription.stripeCustomerId': sub.customer }) : null)
  );
}

/**
 * Apply a Stripe subscription (freshly retrieved from Stripe) to its user.
 * Returns a short description of what happened, for logs.
 */
async function applySubscription(sub) {
  const user = await findUserForSubscription(sub);
  if (!user) return `no user for subscription ${sub.id}`;

  // A user can only hold one subscription. Ignore stale events about an older one,
  // unless the current one is gone.
  const current = user.subscription.stripeSubscriptionId;
  if (current && current !== sub.id && sub.status !== 'active' && sub.status !== 'trialing') {
    return `ignored ${sub.id} (${sub.status}); user is on ${current}`;
  }

  const priceId = sub.items?.data?.[0]?.price?.id;
  const plan = getPlanByPriceId(priceId);
  const status = normalizeStatus(sub.status);
  const ended = status === 'canceled' || status === 'incomplete_expired';

  if (!plan && !ended) {
    // A price that no plan maps to: never grant anything for it.
    throw new Error(`Unknown Stripe price ${priceId} on subscription ${sub.id}`);
  }

  const { start, end } = periodOf(sub);
  user.subscription.plan = ended ? 'free' : plan;
  user.subscription.status = status;
  user.subscription.stripeSubscriptionId = sub.id;
  user.subscription.stripeCustomerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
  user.subscription.stripePriceId = priceId;
  if (start) user.subscription.startDate = start;
  if (end) user.subscription.endDate = end;
  user.subscription.cancelAtPeriodEnd = !!(sub.cancel_at_period_end || sub.cancel_at);
  user.subscription.syncedAt = new Date();
  await user.save();

  return `user ${user._id}: plan=${user.subscription.plan} status=${status}`;
}

/** Subscription id referenced by an invoice (field location differs across API versions). */
function subscriptionIdFromInvoice(invoice) {
  return (
    invoice.subscription ||
    invoice.parent?.subscription_details?.subscription ||
    invoice.lines?.data?.[0]?.parent?.subscription_item_details?.subscription ||
    null
  );
}

module.exports = { stripe, applySubscription, subscriptionIdFromInvoice, periodOf };
