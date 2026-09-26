// backend/middleware/rateLimits.js
// Rate limits. They sit behind app.set('trust proxy') so client IPs are real when
// running behind a load balancer. Limits are per IP, except AI which is per user.
const rateLimit = require('express-rate-limit');

const json = (message) => ({ standardHeaders: 'draft-7', legacyHeaders: false, message: { message } });
const minutes = (n) => n * 60 * 1000;

// Every API request: a generous ceiling that stops floods and scraping.
const apiLimiter = rateLimit({ windowMs: minutes(15), limit: 600, ...json('Too many requests. Please slow down.') });

// Sign-in and sign-up: slows password guessing and mass account creation.
const authLimiter = rateLimit({
  windowMs: minutes(15),
  limit: 10,
  skipSuccessfulRequests: true, // only failed attempts count toward the limit
  ...json('Too many attempts. Please wait a few minutes and try again.'),
});
const signupLimiter = rateLimit({ windowMs: minutes(60), limit: 5, ...json('Too many new accounts from this network. Please try again later.') });

// Password reset emails: stops using the form to spam inboxes.
const passwordResetLimiter = rateLimit({ windowMs: minutes(60), limit: 5, ...json('Too many reset requests. Please try again later.') });

// AI endpoints, per signed-in user (on top of the plan's daily quotas).
const aiLimiter = rateLimit({
  windowMs: minutes(1),
  limit: 6,
  keyGenerator: (req) => (req.user ? `user:${req.user._id}` : req.ip),
  ...json('You are generating very quickly. Please wait a moment and try again.'),
});

// Public share links (no sign-in).
const publicLimiter = rateLimit({ windowMs: minutes(1), limit: 60, ...json('Too many requests.') });

module.exports = { apiLimiter, authLimiter, signupLimiter, passwordResetLimiter, aiLimiter, publicLimiter };
