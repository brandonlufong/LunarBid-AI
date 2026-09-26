// backend/test/phase1.test.js
// Regression tests for the Phase 1 launch blockers. No database or Stripe account
// needed: Mongoose model methods and the Stripe client are replaced with stubs.
//   npm test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-1234567890';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
process.env.STRIPE_STARTER_PRICE_ID = 'price_starter';
process.env.STRIPE_PRO_PRICE_ID = 'price_pro';
process.env.STRIPE_AGENCY_PRICE_ID = 'price_agency';
process.env.FRONTEND_URL = 'https://app.lunarbid.test';

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = require('../models/User');
const ProcessedEvent = require('../models/ProcessedEvent');
const { effectivePlan } = require('../billing/access');
const { stripe } = require('../billing/stripe');
const app = require('../app');

mongoose.set('bufferCommands', false);

// ---------- stubs ----------
const users = new Map();
function makeUser(fields = {}) {
  const u = new User({ name: 'Test', email: `u${users.size}@test.dev`, password: 'password123', ...fields });
  u.save = async function () { users.set(String(this._id), this); return this; };
  users.set(String(u._id), u);
  return u;
}
const query = (value) => ({ select: async () => value, then: (r, j) => Promise.resolve(value).then(r, j), catch: () => Promise.resolve(value) });
require('./helpers/atomicUsers')(User, users);
User.findById = (id) => query(users.get(String(id)) || null);
User.findOne = (filter) => {
  const all = [...users.values()];
  const match = all.find((u) =>
    (filter.email && u.email === filter.email) ||
    (filter['subscription.stripeSubscriptionId'] && u.subscription.stripeSubscriptionId === filter['subscription.stripeSubscriptionId']) ||
    (filter['subscription.stripeCustomerId'] && u.subscription.stripeCustomerId === filter['subscription.stripeCustomerId']) ||
    (filter.resetPasswordToken && u.resetPasswordToken === filter.resetPasswordToken)
  );
  return query(match || null);
};
const processed = new Set();
ProcessedEvent.exists = async ({ _id }) => processed.has(_id);
ProcessedEvent.create = async ({ _id }) => { processed.add(_id); };

const stripeCalls = [];
let subscriptions = {};
const client = stripe();
client.subscriptions.retrieve = async (id) => subscriptions[id];
client.customers.create = async () => ({ id: 'cus_new' });
client.checkout.sessions.create = async (params) => { stripeCalls.push(['checkout', params]); return { url: 'https://checkout.stripe.test/session' }; };
client.billingPortal.sessions.create = async (params) => { stripeCalls.push(['portal', params]); return { url: 'https://billing.stripe.test/portal' }; };

// ---------- server ----------
let base;
let server;
before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());
beforeEach(() => { stripeCalls.length = 0; });

const tokenFor = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET);
const post = (path, body, headers = {}) =>
  fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });

function signedEvent(event) {
  const payload = JSON.stringify(event);
  const header = client.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET });
  return { payload, header };
}
const sub = (id, fields) => ({
  id,
  customer: 'cus_1',
  status: 'active',
  metadata: {},
  cancel_at_period_end: false,
  items: { data: [{ price: { id: 'price_pro' }, current_period_start: 1767225600, current_period_end: 1769904000 }] },
  ...fields,
});

// ---------- BIL-1: paid plans require confirmed payment ----------
test('a paid plan without a confirmed Stripe subscription grants nothing', () => {
  assert.equal(effectivePlan({ subscription: { plan: 'pro', status: 'active' } }), 'free'); // no subscription id
  assert.equal(effectivePlan({ subscription: { plan: 'pro', status: 'incomplete', stripeSubscriptionId: 'sub_1' } }), 'free');
  assert.equal(effectivePlan({ subscription: { plan: 'pro', status: 'unpaid', stripeSubscriptionId: 'sub_1' } }), 'free');
  assert.equal(effectivePlan({ subscription: { plan: 'pro', status: 'active', stripeSubscriptionId: 'sub_1' } }), 'pro');
  assert.equal(effectivePlan({ subscription: { plan: 'pro', status: 'past_due', stripeSubscriptionId: 'sub_1' } }), 'pro');
});

test('BIL-3: canceled / incomplete_expired / legacy cancelled never count as active', () => {
  for (const status of ['canceled', 'incomplete_expired', 'cancelled', 'expired', 'something_new']) {
    assert.equal(effectivePlan({ subscription: { plan: 'pro', status, stripeSubscriptionId: 'sub_1' } }), 'free', status);
  }
});

test('feature access and limits follow the effective plan', () => {
  const unpaid = makeUser({ subscription: { plan: 'pro', status: 'incomplete', stripeSubscriptionId: 'sub_x' } });
  assert.equal(unpaid.hasFeatureAccess('analytics'), false);
  assert.equal(unpaid.getPlanLimits().dailyProposals, 5);
  const paid = makeUser({ subscription: { plan: 'pro', status: 'active', stripeSubscriptionId: 'sub_y' } });
  assert.equal(paid.hasFeatureAccess('analytics'), true);
});

test('checkout returns a Stripe URL and does not change the plan', async () => {
  const u = makeUser();
  const res = await post('/api/subscription/checkout', { plan: 'pro' }, { authorization: `Bearer ${tokenFor(u)}` });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).url, 'https://checkout.stripe.test/session');
  assert.equal(u.subscription.plan, 'free');
  const [, params] = stripeCalls.find(([k]) => k === 'checkout');
  assert.equal(params.line_items[0].price, 'price_pro');
  assert.equal(params.subscription_data.metadata.userId, String(u._id));
});

test('legacy /upgrade no longer grants a plan', async () => {
  const u = makeUser();
  const res = await post('/api/subscription/upgrade', { plan: 'starter' }, { authorization: `Bearer ${tokenFor(u)}` });
  assert.equal(res.status, 200);
  assert.ok((await res.json()).url);
  assert.equal(u.subscription.plan, 'free');
});

test('BIL-4: the Agency plan cannot be purchased', async () => {
  const u = makeUser();
  const res = await post('/api/subscription/checkout', { plan: 'agency' }, { authorization: `Bearer ${tokenFor(u)}` });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).comingSoon, true);
});

// ---------- BIL-2: webhook reachable with raw body and verified ----------
test('webhook rejects a bad signature', async () => {
  const res = await post('/api/stripe/webhook', '{"id":"evt_x"}', { 'stripe-signature': 't=1,v1=bad' });
  assert.equal(res.status, 400);
});

test('webhook applies an active subscription (new and legacy paths)', async () => {
  for (const path of ['/api/stripe/webhook', '/api/subscription/webhook']) {
    const u = makeUser();
    subscriptions.sub_ok = sub('sub_ok', { metadata: { userId: String(u._id) } });
    const { payload, header } = signedEvent({ id: `evt_${path}`, type: 'customer.subscription.updated', data: { object: { id: 'sub_ok' } } });
    const res = await post(path, payload, { 'stripe-signature': header });
    assert.equal(res.status, 200, path);
    assert.equal(u.subscription.plan, 'pro');
    assert.equal(u.subscription.status, 'active');
    assert.equal(u.effectivePlan(), 'pro');
    assert.ok(u.subscription.endDate instanceof Date, 'renewal date read from subscription items');
  }
});

test('webhook downgrades an expired subscription and ignores duplicates', async () => {
  const u = makeUser();
  subscriptions.sub_exp = sub('sub_exp', { status: 'incomplete_expired', metadata: { userId: String(u._id) } });
  const { payload, header } = signedEvent({ id: 'evt_exp', type: 'customer.subscription.updated', data: { object: { id: 'sub_exp' } } });
  assert.equal((await post('/api/stripe/webhook', payload, { 'stripe-signature': header })).status, 200);
  assert.equal(u.subscription.plan, 'free');
  const again = await post('/api/stripe/webhook', payload, { 'stripe-signature': header });
  assert.equal((await again.json()).duplicate, true);
});

test('webhook returns 500 (so Stripe retries) for an unknown price', async () => {
  const u = makeUser();
  subscriptions.sub_bad = sub('sub_bad', { metadata: { userId: String(u._id) }, items: { data: [{ price: { id: 'price_unknown' } }] } });
  const { payload, header } = signedEvent({ id: 'evt_bad', type: 'customer.subscription.created', data: { object: { id: 'sub_bad' } } });
  assert.equal((await post('/api/stripe/webhook', payload, { 'stripe-signature': header })).status, 500);
  assert.equal(u.subscription.plan, 'free');
  assert.equal(processed.has('evt_bad'), false, 'failed events are not marked processed');
});

// ---------- SEC-1: reset link never returned ----------
test('forgot-password never returns the reset link', async () => {
  const u = makeUser({ email: 'victim@test.dev' });
  const log = console.log;
  console.log = () => {}; // silence the dev-only console link
  const res = await post('/api/auth/forgot-password', { email: 'victim@test.dev' });
  console.log = log;
  const body = await res.text();
  assert.equal(res.status, 200);
  assert.doesNotMatch(body, /reset-password|token|devResetLink/i);
  assert.ok(u.resetPasswordToken, 'a reset token was still issued');
});

// ---------- SEC-2 / AI-1: limits ----------
test('oversized job descriptions are rejected before any AI call', async () => {
  const u = makeUser();
  const res = await post('/api/proposals/generate', { jobTitle: 'X', jobDescription: 'a'.repeat(8001) }, { authorization: `Bearer ${tokenFor(u)}` });
  assert.equal(res.status, 400);
});

test('the analyzer is metered by plan', async () => {
  const u = makeUser();
  u.usage.analysesToday = 10; // free plan limit
  u.usage.analysisResetDate = new Date();
  const res = await post('/api/proposals/analyze', { jobDescription: 'Need a React developer for a dashboard project' }, { authorization: `Bearer ${tokenFor(u)}` });
  assert.equal(res.status, 403);
  assert.equal((await res.json()).reason, 'daily_analysis_limit');
});

test('failed sign-ins are rate limited', async () => {
  let last;
  for (let i = 0; i < 11; i++) last = await post('/api/auth/login', { email: 'nobody@test.dev', password: 'wrongpassword' });
  assert.equal(last.status, 429);
});

// ---------- SEC-3 / API: CORS and errors ----------
test('CORS only allows the configured frontend', async () => {
  const ok = await fetch(`${base}/api/subscription/plans`, { headers: { origin: 'https://app.lunarbid.test' } });
  assert.equal(ok.headers.get('access-control-allow-origin'), 'https://app.lunarbid.test');
  const bad = await fetch(`${base}/api/subscription/plans`, { headers: { origin: 'https://evil.test' } });
  assert.equal(bad.headers.get('access-control-allow-origin'), null);
});

test('unknown API routes return JSON 404 with a request id', async () => {
  const res = await fetch(`${base}/api/nope`);
  assert.equal(res.status, 404);
  assert.ok((await res.json()).requestId);
});
