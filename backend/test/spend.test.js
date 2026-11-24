// backend/test/spend.test.js
// Application-wide AI spend ceiling: disabled → allow; over → block; errors → fail-open.
process.env.NODE_ENV = 'test';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const AppUsage = require('../models/AppUsage');
const beta = require('../config/beta');
const spend = require('../services/spend');

const stub = (fn) => { AppUsage.findById = fn; };

test('no ceiling configured → always allowed', async () => {
  beta.AI_DAILY_SPEND_CEILING_USD = 0;
  beta.AI_MONTHLY_SPEND_CEILING_USD = 0;
  assert.equal((await spend.withinCeiling()).allowed, true);
});

test('blocks when daily spend is at/over the ceiling', async () => {
  beta.AI_DAILY_SPEND_CEILING_USD = 5;
  beta.AI_MONTHLY_SPEND_CEILING_USD = 50;
  stub(() => ({ lean: async () => ({ spendUsd: 6 }) }));
  assert.equal((await spend.withinCeiling()).allowed, false);
});

test('allows when under both ceilings', async () => {
  beta.AI_DAILY_SPEND_CEILING_USD = 5;
  beta.AI_MONTHLY_SPEND_CEILING_USD = 50;
  stub(() => ({ lean: async () => ({ spendUsd: 1 }) }));
  assert.equal((await spend.withinCeiling()).allowed, true);
});

test('fail-open when the meter read throws', async () => {
  beta.AI_DAILY_SPEND_CEILING_USD = 5;
  stub(() => ({ lean: async () => { throw new Error('db down'); } }));
  assert.equal((await spend.withinCeiling()).allowed, true);
});
