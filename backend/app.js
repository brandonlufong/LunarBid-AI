// backend/app.js
// The Express application. server.js starts it; tests import it directly.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const Sentry = require('./instrument');
const { handleStripeWebhook } = require('./routes/stripeWebhook');
const { requestId, notFound, errorHandler } = require('./middleware/errors');
const { apiLimiter } = require('./middleware/rateLimits');

// Run schema validators on updates too, not only on create/save.
mongoose.set('runValidators', true);

const app = express();

// Behind a load balancer/proxy (Render, Railway, Fly, Heroku, nginx): trust one hop
// so rate limits see the real client IP. Override with TRUST_PROXY if needed.
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));
app.disable('x-powered-by');
app.use(requestId);
app.use(helmet());

// CORS: only the LunarBid frontend (plus extra origins listed in CORS_ORIGINS).
const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ORIGINS || '').split(','),
  ...(process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173', 'http://localhost:5174']),
]
  .map((o) => (o || '').trim().replace(/\/$/, ''))
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
    credentials: false,
  })
);

// ========================================
// Stripe webhook: raw body, registered BEFORE express.json().
// /api/subscription/webhook is kept so an endpoint already configured in Stripe keeps working.
// ========================================
app.post(['/api/stripe/webhook', '/api/subscription/webhook'], express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json({ limit: '100kb' }));

// Health check for the host and uptime monitoring.
app.get('/health', (req, res) => {
  const db = mongoose.connection.readyState === 1;
  res.status(db ? 200 : 503).json({ status: db ? 'ok' : 'degraded', db });
});

// Uploaded images in local development (production uses an S3-compatible bucket).
// Served with nosniff and a locked-down CSP; cross-origin so the frontend can display them.
if (!require('./services/storage').useS3()) {
  app.use(
    '/uploads',
    express.static(require('./services/storage').LOCAL_DIR, {
      fallthrough: false,
      setHeaders: (res) => {
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        res.set('Content-Security-Policy', "default-src 'none'");
      },
    })
  );
}

app.use('/api', apiLimiter);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/proposals', require('./routes/proposals'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/branding', require('./routes/branding'));
app.use('/api/client-profiles', require('./routes/clientProfiles'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/support', require('./routes/support'));
app.use('/api/account', require('./routes/account'));

app.use('/api', notFound);
if (process.env.SENTRY_DSN) Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

module.exports = app;
