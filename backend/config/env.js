// backend/config/env.js
// ============================================================================
// Validates configuration at startup. In production, missing or placeholder
// values stop the server with a clear message instead of failing later at
// runtime (for example, password-reset links pointing at localhost).
// ============================================================================
const isProd = process.env.NODE_ENV === 'production';

const looksPlaceholder = (v) => !v || /your_|change_this|xxx|placeholder/i.test(v);

function checkEnv() {
  const errors = [];
  const warnings = [];
  const env = process.env;

  const require = (name, why) => {
    if (looksPlaceholder(env[name])) errors.push(`${name} is missing or still a placeholder (${why})`);
  };

  require('MONGODB_URI', 'database connection');
  require('JWT_SECRET', 'signing sign-in tokens');
  if (env.JWT_SECRET && env.JWT_SECRET.length < 32) errors.push('JWT_SECRET must be at least 32 characters');
  require('FRONTEND_URL', 'links in emails, Stripe redirects and CORS');
  if (isProd && /localhost|127\.0\.0\.1/.test(env.FRONTEND_URL || '')) errors.push('FRONTEND_URL points at localhost');
  if (isProd && env.FRONTEND_URL && !env.FRONTEND_URL.startsWith('https://')) errors.push('FRONTEND_URL must use https in production');

  require('STRIPE_SECRET_KEY', 'billing');
  require('STRIPE_WEBHOOK_SECRET', 'verifying Stripe webhooks');
  require('STRIPE_STARTER_PRICE_ID', 'Starter plan checkout');
  require('STRIPE_PRO_PRICE_ID', 'Pro plan checkout');
  if (isProd && (env.STRIPE_SECRET_KEY || '').startsWith('sk_test_')) {
    warnings.push('STRIPE_SECRET_KEY is a test key in production');
  }

  const aiKeys = ['GROQ_API_KEY', 'TOGETHER_API_KEY', 'OPENROUTER_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY'];
  if (!aiKeys.some((k) => !looksPlaceholder(env[k]))) errors.push(`at least one AI provider key is required (${aiKeys.join(', ')})`);

  if (looksPlaceholder(env.SUPPORT_EMAIL_PASSWORD) && looksPlaceholder(env.SMTP_PASSWORD)) {
    (isProd ? errors : warnings).push('email is not configured: password-reset and support emails cannot be sent');
  }
  if (isProd && !env.SENTRY_DSN) warnings.push('SENTRY_DSN is not set: errors will not be reported');

  return { errors, warnings };
}

/** Log problems; in production, exit if anything essential is missing. */
function validateEnv(logger = console) {
  const { errors, warnings } = checkEnv();
  warnings.forEach((w) => logger.warn(`config: ${w}`));
  if (errors.length) {
    const msg = `Configuration problems:\n  - ${errors.join('\n  - ')}`;
    if (isProd) {
      logger.error(msg);
      process.exit(1);
    }
    logger.warn(`${msg}\n(Development mode: continuing anyway.)`);
  }
}

module.exports = { validateEnv, checkEnv };
