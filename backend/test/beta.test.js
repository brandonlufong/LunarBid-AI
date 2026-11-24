// backend/test/beta.test.js
// Free-beta controls: cap math (tighten-only) and the public flag snapshot.
process.env.NODE_ENV = 'test';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const beta = require('../config/beta');

test('applyBetaLimits is a no-op when beta is off', () => {
  beta.BETA_MODE = false;
  const limits = { dailyProposals: 99, monthlyProposals: 500, clientProfiles: 10 };
  assert.deepEqual(beta.applyBetaLimits(limits), limits);
});

test('applyBetaLimits only tightens caps, never raises them', () => {
  beta.BETA_MODE = true;
  beta.BETA_DAILY_PROPOSALS = 3;
  beta.BETA_MONTHLY_PROPOSALS = 15;

  // "unlimited" (null) becomes the beta cap
  const a = beta.applyBetaLimits({ dailyProposals: null, monthlyProposals: null });
  assert.equal(a.dailyProposals, 3);
  assert.equal(a.monthlyProposals, 15);

  // a smaller plan limit wins over a larger beta cap (never raised)
  const b = beta.applyBetaLimits({ dailyProposals: 1, monthlyProposals: 10 });
  assert.equal(b.dailyProposals, 1);
  assert.equal(b.monthlyProposals, 10);

  // a larger plan limit is tightened down to the beta cap
  const c = beta.applyBetaLimits({ dailyProposals: 100, monthlyProposals: 9999 });
  assert.equal(c.dailyProposals, 3);
  assert.equal(c.monthlyProposals, 15);

  beta.BETA_MODE = false; // restore for other suites in the same process
});

test('publicFlags exposes only client-safe booleans', () => {
  const flags = beta.publicFlags();
  assert.deepEqual(Object.keys(flags).sort(), ['aiEnabled', 'betaMode', 'billingEnabled', 'registrationEnabled']);
  for (const v of Object.values(flags)) assert.equal(typeof v, 'boolean');
  // no secrets / ceilings leak
  assert.equal(flags.spendCeiling, undefined);
  assert.equal(flags.AI_DAILY_SPEND_CEILING_USD, undefined);
});
