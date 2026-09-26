// backend/test/phase3.test.js
// Email verification, session revocation/renewal and history pagination. No database,
// email account or AI provider needed: models and the mail transport are stubbed.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-1234567890';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
process.env.FRONTEND_URL = 'https://app.lunarbid.test';
process.env.SMTP_HOST = 'smtp.test';
process.env.SMTP_PASSWORD = 'secret';
process.env.GROQ_API_KEY = 'gsk_test';

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const sentMail = [];
nodemailer.createTransport = () => ({ sendMail: async (opts) => { sentMail.push(opts); return {}; } });

const User = require('../models/User');
const Proposal = require('../models/Proposal');
const { signSession } = require('../services/session');
const app = require('../app');

mongoose.set('bufferCommands', false);

// ---------- stubs ----------
const users = new Map();
function makeUser(fields = {}) {
  const u = new User({ name: 'Ann', email: `u${users.size}-${Date.now()}@test.dev`, password: 'password123', ...fields });
  u.save = async function () { users.set(String(this._id), this); return this; };
  users.set(String(u._id), u);
  return u;
}
const query = (value) => ({ select: async () => value, then: (r, j) => Promise.resolve(value).then(r, j), catch: () => Promise.resolve(value) });
require('./helpers/atomicUsers')(User, users);
User.findById = (id) => query(users.get(String(id)) || null);
User.findOne = (f) => {
  const all = [...users.values()];
  let hit = null;
  if (f.email) hit = all.find((u) => u.email === f.email);
  if (f.emailVerifyToken) hit = all.find((u) => u.emailVerifyToken === f.emailVerifyToken && u.emailVerifyExpires > f.emailVerifyExpires.$gt);
  return query(hit || null);
};

User.exists = async ({ _id }) => (users.get(String(_id))?.password ? { _id } : null);
// Users created through sign-up
User.prototype.save = async function () { users.set(String(this._id), this); return this; };

let proposals = [];
Proposal.find = (q) => {
  let rows = proposals.filter((p) => String(p.user) === String(q.user));
  if (q._id?.$lt) rows = rows.filter((p) => String(p._id) < q._id.$lt);
  return {
    sort: () => ({ limit: async (n) => rows.sort((a, b) => (String(a._id) < String(b._id) ? 1 : -1)).slice(0, n) }),
  };
};

// ---------- server ----------
let base;
let server;
before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());
beforeEach(() => { sentMail.length = 0; });

const bearer = (token) => ({ authorization: `Bearer ${token}` });
const call = (method, path, body, headers = {}) =>
  fetch(base + path, { method, headers: { 'content-type': 'application/json', ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });

// ================= Email verification =================
test('sign-up sends a confirmation email and starts unverified', async () => {
  const res = await call('POST', '/api/auth/register', { name: 'New User', email: 'new@test.dev', password: 'password123' });
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.equal(body.user.emailVerified, false);
  assert.equal(body.verificationSent, true);
  assert.equal(sentMail.length, 1);
  assert.match(sentMail[0].html, /https:\/\/app\.lunarbid\.test\/verify-email\?token=[a-f0-9]{64}/);
});

test('unverified accounts cannot use AI features', async () => {
  const u = makeUser({ emailVerified: false });
  const res = await call('POST', '/api/proposals/generate', { jobTitle: 'Logo', jobDescription: 'Design a logo for our bakery brand' }, bearer(signSession(u)));
  assert.equal(res.status, 403);
  assert.equal((await res.json()).code, 'email_unverified');
});

test('accounts created before verification existed are not blocked', () => {
  const legacy = makeUser();
  assert.equal(legacy.emailVerified, undefined);
  assert.equal(legacy.isEmailVerified(), true);
});

test('the confirmation link verifies the account once', async () => {
  const u = makeUser({ emailVerified: false });
  const raw = 'a'.repeat(64);
  u.emailVerifyToken = crypto.createHash('sha256').update(raw).digest('hex');
  u.emailVerifyExpires = new Date(Date.now() + 60_000);
  let res = await call('POST', '/api/auth/verify-email', { token: raw });
  assert.equal(res.status, 200);
  assert.equal(u.emailVerified, true);
  res = await call('POST', '/api/auth/verify-email', { token: raw });
  assert.equal(res.status, 400, 'the link cannot be reused');
});

test('expired confirmation links are refused', async () => {
  const u = makeUser({ emailVerified: false });
  const raw = 'b'.repeat(64);
  u.emailVerifyToken = crypto.createHash('sha256').update(raw).digest('hex');
  u.emailVerifyExpires = new Date(Date.now() - 1000);
  const res = await call('POST', '/api/auth/verify-email', { token: raw });
  assert.equal(res.status, 400);
  assert.equal(u.emailVerified, false);
});

// ================= Sessions =================
test('changing the password signs out other devices but keeps this one', async () => {
  const u = makeUser();
  u.password = await require('bcryptjs').hash('password123', 4);
  const oldToken = signSession(u);
  const res = await call('POST', '/api/auth/change-password', { currentPassword: 'password123', newPassword: 'newpassword456' }, bearer(oldToken));
  const body = await res.json();
  assert.equal(res.status, 200);
  const old = await call('GET', '/api/auth/me', undefined, bearer(oldToken));
  assert.equal(old.status, 401);
  assert.equal((await old.json()).code, 'session_revoked');
  const fresh = await call('GET', '/api/auth/me', undefined, bearer(body.token));
  assert.equal(fresh.status, 200);
});

test('sign out everywhere revokes existing sessions', async () => {
  const u = makeUser();
  const other = signSession(u);
  const res = await call('POST', '/api/auth/logout-all', undefined, bearer(signSession(u)));
  assert.equal(res.status, 200);
  assert.equal((await call('GET', '/api/auth/me', undefined, bearer(other))).status, 401);
});

test('a password reset revokes existing sessions', async () => {
  const u = makeUser();
  const before = signSession(u);
  const raw = 'c'.repeat(64);
  u.resetPasswordToken = crypto.createHash('sha256').update(raw).digest('hex');
  u.resetPasswordExpires = new Date(Date.now() + 60_000);
  User.findOne = ((orig) => (f) => (f.resetPasswordToken ? query([...users.values()].find((x) => x.resetPasswordToken === f.resetPasswordToken) || null) : orig(f)))(User.findOne);
  const res = await call('POST', '/api/auth/reset-password', { token: raw, password: 'brandnewpass1' });
  assert.equal(res.status, 200);
  assert.equal((await call('GET', '/api/auth/me', undefined, bearer(before))).status, 401);
});

test('expired sessions get a clear code; refresh issues a new token', async () => {
  const u = makeUser();
  const expired = jwt.sign({ id: u._id, v: 0, exp: Math.floor(Date.now() / 1000) - 10 }, process.env.JWT_SECRET);
  const res = await call('GET', '/api/auth/me', undefined, bearer(expired));
  assert.equal(res.status, 401);
  assert.equal((await res.json()).code, 'session_expired');
  const refreshed = await call('POST', '/api/auth/refresh', undefined, bearer(signSession(u)));
  const { token } = await refreshed.json();
  const payload = jwt.decode(token);
  assert.ok(payload.exp - payload.iat <= 7 * 24 * 3600, 'sessions last at most 7 days');
});

// ================= History pagination =================
test('history is paginated with a cursor', async () => {
  const u = makeUser();
  proposals = Array.from({ length: 25 }, () => ({ _id: new mongoose.Types.ObjectId(), user: u._id }));
  const first = await (await call('GET', '/api/proposals/history', undefined, bearer(signSession(u)))).json();
  assert.equal(first.items.length, 20);
  assert.ok(first.nextCursor);
  const second = await (await call('GET', `/api/proposals/history?cursor=${first.nextCursor}`, undefined, bearer(signSession(u)))).json();
  assert.equal(second.items.length, 5);
  assert.equal(second.nextCursor, null);
  const ids = new Set([...first.items, ...second.items].map((p) => String(p._id)));
  assert.equal(ids.size, 25, 'no duplicates, nothing missed');
});

// ================= BIL-10: atomic quotas =================
test('simultaneous requests cannot exceed the plan limit', async () => {
  const { reserve } = require('../services/usage');
  const u = makeUser(); // free plan: 5 proposals per day
  u.usage.lastResetDate = new Date();
  u.usage.monthlyResetDate = new Date();
  const results = await Promise.all(Array.from({ length: 8 }, () => reserve(u, 'proposal')));
  assert.equal(results.filter((r) => r.allowed).length, 5);
  assert.equal(results.filter((r) => !r.allowed)[0].reason, 'daily_limit');
  assert.equal(u.usage.proposalsToday, 5);
});

test('a released reservation gives the quota back', async () => {
  const { reserve } = require('../services/usage');
  const u = makeUser();
  u.usage.analysisResetDate = new Date();
  const r = await reserve(u, 'analysis');
  assert.equal(u.usage.analysesToday, 1);
  await r.release();
  await r.release(); // releasing twice has no extra effect
  assert.equal(u.usage.analysesToday, 0);
});
