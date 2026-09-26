// backend/routes/stripeWebhook.js
// ============================================================================
// Stripe webhook. Mounted in app.js with express.raw() BEFORE the JSON parser,
// because signature verification needs the exact bytes Stripe sent.
//
// Rules:
//  - Verify the signature; reject anything else with 400.
//  - Never trust the event payload for state: re-read the subscription from Stripe,
//    so out-of-order or duplicate events always converge on Stripe's current state.
//  - Return 5xx on failure so Stripe retries; return 2xx only once applied.
// ============================================================================
const ProcessedEvent = require('../models/ProcessedEvent');
const { stripe, applySubscription, subscriptionIdFromInvoice } = require('../billing/stripe');
const log = require('../utils/logger');

const SUBSCRIPTION_EVENTS = new Set([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
]);
const INVOICE_EVENTS = new Set(['invoice.paid', 'invoice.payment_succeeded', 'invoice.payment_failed']);

/** The subscription id an event is about, or null if the event does not affect access. */
function subscriptionIdFor(event) {
  const obj = event.data.object;
  if (SUBSCRIPTION_EVENTS.has(event.type)) return obj.id;
  if (INVOICE_EVENTS.has(event.type)) return subscriptionIdFromInvoice(obj);
  if (event.type === 'checkout.session.completed' && obj.mode === 'subscription') return obj.subscription;
  return null;
}

async function handleStripeWebhook(req, res) {
  let event;
  try {
    event = stripe().webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    log.warn({ err: err.message }, 'stripe webhook: signature verification failed');
    return res.status(400).send('Invalid signature');
  }

  try {
    if (await ProcessedEvent.exists({ _id: event.id })) {
      return res.json({ received: true, duplicate: true });
    }

    const subscriptionId = subscriptionIdFor(event);
    if (subscriptionId) {
      const sub = await stripe().subscriptions.retrieve(subscriptionId);
      const result = await applySubscription(sub);
      log.info({ event: event.type, id: event.id, result }, 'stripe webhook applied');
    } else {
      log.debug({ event: event.type, id: event.id }, 'stripe webhook ignored');
    }

    await ProcessedEvent.create({ _id: event.id, type: event.type }).catch((e) => {
      if (e.code !== 11000) throw e; // a concurrent delivery already recorded it
    });
    return res.json({ received: true });
  } catch (err) {
    log.error({ err, event: event.type, id: event.id }, 'stripe webhook: processing failed');
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

module.exports = { handleStripeWebhook, subscriptionIdFor };
