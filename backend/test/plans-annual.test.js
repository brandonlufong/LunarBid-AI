// backend/test/plans-annual.test.js
// Additive scaffolding: interval-aware Stripe price resolution (monthly unchanged; annual opt-in)
// and the Groq GPT-OSS provider slot added alongside the existing providers.
process.env.NODE_ENV = 'test';
process.env.STRIPE_STARTER_PRICE_ID = 'price_starter_m';
process.env.STRIPE_PRO_PRICE_ID = 'price_pro_m';
process.env.STRIPE_STARTER_ANNUAL_PRICE_ID = 'price_starter_y';
process.env.STRIPE_PRO_ANNUAL_PRICE_ID = 'price_pro_y';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const plans = require('../config/plans');

test('monthly price resolution is unchanged (default interval)', () => {
  assert.equal(plans.getStripePriceId('starter'), 'price_starter_m');
  assert.equal(plans.getStripePriceId('pro'), 'price_pro_m');
  assert.equal(plans.getStripePriceId('starter', 'month'), 'price_starter_m');
});

test('annual price resolves when configured', () => {
  assert.equal(plans.getStripePriceId('starter', 'year'), 'price_starter_y');
  assert.equal(plans.getStripePriceId('pro', 'year'), 'price_pro_y');
});

test('webhook maps BOTH monthly and annual price ids to the plan', () => {
  assert.equal(plans.getPlanByPriceId('price_starter_m'), 'starter');
  assert.equal(plans.getPlanByPriceId('price_starter_y'), 'starter');
  assert.equal(plans.getPlanByPriceId('price_pro_y'), 'pro');
  assert.equal(plans.getPlanByPriceId('price_unknown'), null);
});

test('annual is purchasable only when its price id is set', () => {
  assert.equal(plans.isPurchasable('pro', 'year'), true);
  assert.equal(plans.isPurchasable('agency', 'year'), false); // no annual id + not purchasable
});

test('approved allowances: Free 15/mo, Starter 150/mo', () => {
  assert.equal(plans.getLimits('free').monthlyProposals, 15);
  assert.equal(plans.getLimits('starter').monthlyProposals, 150);
});

test('public plans expose annual price for the UI toggle', () => {
  const pub = plans.getPublicPlans();
  assert.deepEqual(pub.find((p) => p.id === 'pro').annual, { price: 190, interval: 'year' });
  assert.equal(pub.find((p) => p.id === 'free').annual, null);
});

test('Groq GPT-OSS slot is present and ordered before the legacy Groq/Llama slot', () => {
  // The provider table and default order live in aiService; assert via the module's defaults.
  const src = require('fs').readFileSync(require('path').join(__dirname, '../services/aiService.js'), 'utf8');
  assert.match(src, /groq_oss:/);
  assert.match(src, /openai\/gpt-oss-120b/);
  assert.match(src, /DEFAULT_ORDER = \['groq_oss', 'groq'/);
});
