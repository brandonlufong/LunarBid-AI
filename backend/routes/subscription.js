// backend/routes/subscription.js
// ============================================================================
// Subscriptions. Purchases go through Stripe Checkout; changes, cancellation,
// invoices and payment methods go through the Stripe Customer Portal.
//
// Nothing in this file grants or removes access. Access changes only when the
// Stripe webhook (routes/stripeWebhook.js) applies Stripe's subscription state.
// ============================================================================
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { getPublicPlans, getStripePriceId, isPurchasable, PLANS } = require('../config/plans');
const { effectivePlan, isPaymentIssue, normalizeStatus } = require('../billing/access');
const { stripe } = require('../billing/stripe');
const log = require('../utils/logger');

const frontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:5174').replace(/\/$/, '');

// ===============================
// Public: list all plans (pricing page, no auth)
// ===============================
router.get('/plans', (req, res) => {
  res.json({ plans: getPublicPlans() });
});

// ===============================
// Current subscription, usage and what is actually unlocked
// ===============================
router.get('/', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const plan = effectivePlan(user);
    const features = Object.fromEntries(
      Object.keys(PLANS.free.features).map((f) => [f, user.hasFeatureAccess(f)])
    );

    res.json({
      subscription: {
        plan,                                   // what the user can use now
        subscribedPlan: user.subscription.plan, // what they subscribed to
        status: normalizeStatus(user.subscription.status),
        paymentIssue: isPaymentIssue(user),
        startDate: user.subscription.startDate,
        endDate: user.subscription.endDate,
        cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
        hasBillingAccount: !!user.subscription.stripeCustomerId,
      },
      usage: {
        proposalsToday: user.usage.proposalsToday,
        proposalsThisMonth: user.usage.proposalsThisMonth,
        totalProposals: user.usage.totalProposals,
        analysesToday: user.usage.analysesToday || 0,
      },
      limits: user.getPlanLimits(),
      features,
    });
  } catch (error) {
    next(error);
  }
});

async function ensureCustomer(user) {
  if (user.subscription.stripeCustomerId) return user.subscription.stripeCustomerId;
  const customer = await stripe().customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: user._id.toString() },
  });
  user.subscription.stripeCustomerId = customer.id;
  await user.save();
  return customer.id;
}

async function portalUrl(customerId) {
  const session = await stripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${frontendUrl()}/dashboard?tab=subscription`,
  });
  return session.url;
}

// ===============================
// Start a purchase: returns a Stripe Checkout URL.
// Users who already have an active subscription are sent to the portal to change plan.
// ===============================
async function createCheckout(req, res, next) {
  try {
    const { plan } = req.body || {};
    if (!PLANS[plan] || plan === 'free') {
      return res.status(400).json({ message: 'Choose a paid plan.' });
    }
    if (!isPurchasable(plan)) {
      return res.status(400).json({ message: 'This plan is not available yet.', comingSoon: true });
    }

    const user = await User.findById(req.user._id);
    const customerId = await ensureCustomer(user);

    if (effectivePlan(user) !== 'free') {
      return res.json({ url: await portalUrl(customerId), portal: true });
    }

    const session = await stripe().checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user._id.toString(),
      line_items: [{ price: getStripePriceId(plan), quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: { metadata: { userId: user._id.toString(), plan } },
      metadata: { userId: user._id.toString(), plan },
      success_url: `${frontendUrl()}/dashboard?tab=subscription&checkout=success`,
      cancel_url: `${frontendUrl()}/dashboard?tab=subscription&checkout=cancelled`,
    });

    log.info({ userId: user._id.toString(), plan }, 'checkout session created');
    return res.json({ url: session.url });
  } catch (error) {
    next(error);
  }
}

router.post('/checkout', auth, createCheckout);
// Kept for older clients: behaves exactly like /checkout and never grants a plan by itself.
router.post('/upgrade', auth, createCheckout);

// ===============================
// Manage billing: Stripe Customer Portal (change plan, cancel, invoices, cards)
// ===============================
router.post('/portal', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.subscription.stripeCustomerId) {
      return res.status(400).json({ message: 'No billing account yet.' });
    }
    res.json({ url: await portalUrl(user.subscription.stripeCustomerId) });
  } catch (error) {
    next(error);
  }
});

// ===============================
// Cancel at period end (kept for API compatibility; the portal is preferred).
// Stripe confirms the change through the webhook.
// ===============================
router.post('/cancel', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.subscription.stripeSubscriptionId || effectivePlan(user) === 'free') {
      return res.status(400).json({ message: 'No active subscription to cancel.' });
    }
    await stripe().subscriptions.update(user.subscription.stripeSubscriptionId, { cancel_at_period_end: true });
    res.json({
      success: true,
      message: 'Your subscription will end at the close of the current billing period.',
      endDate: user.subscription.endDate,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
