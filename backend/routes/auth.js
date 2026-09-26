const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
const User = require('../models/User');
const OAuthCode = require('../models/OAuthCode');
const auth = require('../middleware/auth');
const { sendMail, isConfigured: emailConfigured } = require('../services/mailer');
const { authLimiter, signupLimiter, passwordResetLimiter } = require('../middleware/rateLimits');
const log = require('../utils/logger');

const MIN_PASSWORD = 8;
const normalizeEmail = (email) => (typeof email === 'string' ? email.toLowerCase().trim() : '');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;

const { signSession, revokeSessions } = require('../services/session');
const { verificationEmail } = require('../services/emails');
const signToken = signSession;
const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  profile: user.profile,
  avatar: user.avatar,
  authProvider: user.authProvider || 'local',
  emailVerified: user.emailVerified !== false,
  hasPassword: !!user.password,
});

// Issue a 24-hour email confirmation link and send it. Returns true when the email was sent.
async function sendVerification(user) {
  const raw = crypto.randomBytes(32).toString('hex');
  user.emailVerifyToken = hashToken(raw);
  user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();
  const link = `${FRONTEND_URL}/verify-email?token=${raw}`;
  const { html, text } = verificationEmail({ name: user.name, link });
  const result = await sendMail({ to: user.email, subject: 'Confirm your email for LunarBid', html, text });
  if (!result.sent) {
    log.error({ reason: result.reason }, 'verification email not sent');
    if (process.env.NODE_ENV !== 'production') console.log(`[dev] Email confirmation link for ${user.email}: ${link}`);
  }
  return result.sent;
}
const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

// Register
router.post('/register', signupLimiter, async (req, res) => {
  try {
    const { name, password } = req.body;
    const email = normalizeEmail(req.body.email);

    // Validation
    if (!name || !email || !password || typeof name !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    if (name.trim().length > 100) {
      return res.status(400).json({ message: 'Name is too long' });
    }
    if (password.length < MIN_PASSWORD || password.length > 128) {
      return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD} characters` });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = new User({ name: name.trim(), email, password, emailVerified: false });
    await user.save();
    const verificationSent = await sendVerification(user);

    // Generate token
    const token = signToken(user);

    res.status(201).json({ token, user: publicUser(user), verificationSent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    // Validation
    if (!email || !password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Social-only accounts have no password
    if (!user.password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = signToken(user);

    res.json({ token, user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Forgot password — issue a reset token (emailed, or returned in dev)
// ===============================
router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Please provide your email' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Generic response either way (don't reveal whether the account exists).
    const generic = { message: 'If an account exists for that email, a reset link has been sent.' };

    if (!user || user.authProvider !== 'local') {
      return res.json(generic);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashToken(rawToken);
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await user.save();

    const resetLink = `${FRONTEND_URL}/reset-password?token=${rawToken}`;
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:auto">
        <h2 style="color:#4f46e5">Reset your LunarBid password</h2>
        <p>We received a request to reset your password. This link expires in 1 hour.</p>
        <p><a href="${resetLink}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600">Reset password</a></p>
        <p style="color:#64748b;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
      </div>`;

    const result = await sendMail({ to: user.email, subject: 'Reset your LunarBid password', html, text: `Reset your password: ${resetLink}` });

    // The reset link is NEVER returned to the caller: anyone could request it for any
    // email address. When email can't be sent, log the failure; in development only,
    // print the link to the server console so the flow can still be tested locally.
    if (!result.sent) {
      log.error({ reason: result.reason }, 'password reset email not sent');
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[dev] Password reset link for ${user.email}: ${resetLink}`);
      }
    }
    return res.json(generic);
  } catch (error) {
    console.error('forgot-password error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Reset password — consume the token, set a new password
// ===============================
router.post('/reset-password', passwordResetLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and new password are required' });
    if (typeof password !== 'string' || password.length < MIN_PASSWORD || password.length > 128) {
      return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD} characters` });
    }

    const user = await User.findOne({
      resetPasswordToken: hashToken(token),
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: 'This reset link is invalid or has expired.' });

    user.password = password; // hashed by the pre-save hook
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.emailVerified = true; // they proved access to the inbox
    revokeSessions(user);      // sign out every other device
    await user.save();

    res.json({ message: 'Password reset successfully. You can now sign in.', token: signToken(user), user: publicUser(user) });
  } catch (error) {
    console.error('reset-password error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// OAuth — Google & GitHub (auth-code flow, no passport)
// Activates once GOOGLE_/GITHUB_ CLIENT_ID + SECRET are set in .env.
// ===============================
// ---- OAuth state (login-CSRF protection) ----
// A random state value is stored in a short-lived httpOnly cookie on the API domain and
// sent to the provider; the callback must return the same value.
const STATE_COOKIE = 'lb_oauth_state';
function issueState(res) {
  const state = crypto.randomBytes(24).toString('hex');
  res.cookie(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
    path: '/api/auth',
  });
  return state;
}
function checkState(req, res) {
  const cookie = (req.headers.cookie || '').split(';').map((c) => c.trim()).find((c) => c.startsWith(`${STATE_COOKIE}=`));
  const expected = cookie ? decodeURIComponent(cookie.slice(STATE_COOKIE.length + 1)) : '';
  res.clearCookie(STATE_COOKIE, { path: '/api/auth' });
  const given = typeof req.query.state === 'string' ? req.query.state : '';
  return expected.length > 0 && expected.length === given.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(given));
}

const googleConfigured = () => !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
const githubConfigured = () => !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;

// Public: which providers are enabled (frontend hides/greys buttons accordingly)
router.get('/providers', (req, res) => {
  res.json({ google: googleConfigured(), github: githubConfigured(), email: emailConfigured() });
});

const finishOAuth = async (res, { provider, providerId, name, email, avatar, emailVerified }) => {
  if (!email) return res.redirect(`${FRONTEND_URL}/login?error=oauth_no_email`);
  // Only a verified email may create an account or sign in to an existing one with that email.
  if (!emailVerified) return res.redirect(`${FRONTEND_URL}/login?error=oauth_unverified_email`);
  let user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    user = new User({ name: name || email.split('@')[0], email: email.toLowerCase(), authProvider: provider, providerId, avatar: avatar || '', emailVerified: true });
    await user.save();
  } else if (user.authProvider === 'local') {
    // Link the social identity to the existing local account.
    user.providerId = user.providerId || providerId;
    if (avatar && !user.avatar) user.avatar = avatar;
    user.emailVerified = true; // the provider verified this address
    await user.save();
  }
  // Hand over with a single-use code; the frontend exchanges it for a session token.
  const code = crypto.randomBytes(32).toString('hex');
  await OAuthCode.create({ _id: hashToken(code), user: user._id });
  return res.redirect(`${FRONTEND_URL}/oauth?code=${code}`);
};

// Exchange a single-use OAuth code for a session token.
router.post('/oauth/exchange', authLimiter, async (req, res) => {
  const code = typeof req.body?.code === 'string' ? req.body.code : '';
  const record = code ? await OAuthCode.findOneAndDelete({ _id: hashToken(code) }) : null;
  if (!record) return res.status(400).json({ message: 'This sign-in link has expired. Please try again.' });
  const user = await User.findById(record.user);
  if (!user) return res.status(400).json({ message: 'Account not found.' });
  res.json({ token: signToken(user), user: publicUser(user) });
});

// --- Google ---
router.get('/google', (req, res) => {
  if (!googleConfigured()) return res.redirect(`${FRONTEND_URL}/login?error=oauth_unconfigured&provider=google`);
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${BACKEND_URL}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    state: issueState(res),
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code || !checkState(req, res)) return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${BACKEND_URL}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    });
    const profile = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
    });
    const p = profile.data;
    return finishOAuth(res, { provider: 'google', providerId: p.id, name: p.name, email: p.email, avatar: p.picture, emailVerified: p.verified_email === true || p.email_verified === true });
  } catch (error) {
    console.error('Google OAuth error:', error.response?.data || error.message);
    res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
  }
});

// --- GitHub ---
router.get('/github', (req, res) => {
  if (!githubConfigured()) return res.redirect(`${FRONTEND_URL}/login?error=oauth_unconfigured&provider=github`);
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: `${BACKEND_URL}/api/auth/github/callback`,
    scope: 'read:user user:email',
    state: issueState(res),
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get('/github/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code || !checkState(req, res)) return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    const tokenRes = await axios.post('https://github.com/login/oauth/access_token', {
      code,
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      redirect_uri: `${BACKEND_URL}/api/auth/github/callback`,
    }, { headers: { Accept: 'application/json' } });
    const accessToken = tokenRes.data.access_token;
    const [profile, emails] = await Promise.all([
      axios.get('https://api.github.com/user', { headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'LunarBid' } }),
      axios.get('https://api.github.com/user/emails', { headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'LunarBid' } }).catch(() => ({ data: [] })),
    ]);
    // Only the primary, verified GitHub email is trusted.
    const primary = (emails.data || []).find((e) => e.primary && e.verified);
    return finishOAuth(res, { provider: 'github', providerId: String(profile.data.id), name: profile.data.name || profile.data.login, email: primary?.email, avatar: profile.data.avatar_url, emailVerified: !!primary });
  } catch (error) {
    console.error('GitHub OAuth error:', error.response?.data || error.message);
    res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    profile: req.user.profile,
    authProvider: req.user.authProvider || 'local',
    emailVerified: req.user.emailVerified !== false,
    // auth middleware omits the password field; check existence without exposing it
    hasPassword: !!(await User.exists({ _id: req.user._id, password: { $exists: true, $ne: null } }))
  });
});

// ===============================
// Email confirmation
// ===============================
router.post('/verify-email', authLimiter, async (req, res, next) => {
  try {
    const token = typeof req.body?.token === 'string' ? req.body.token : '';
    const user = token
      ? await User.findOne({ emailVerifyToken: hashToken(token), emailVerifyExpires: { $gt: new Date() } })
      : null;
    if (!user) return res.status(400).json({ message: 'This confirmation link is invalid or has expired. Request a new one from your dashboard.' });
    user.emailVerified = true;
    user.emailVerifyToken = null;
    user.emailVerifyExpires = null;
    await user.save();
    res.json({ message: 'Email confirmed.', emailVerified: true });
  } catch (error) {
    next(error);
  }
});

router.post('/resend-verification', auth, passwordResetLimiter, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.isEmailVerified()) return res.json({ message: 'Your email is already confirmed.', emailVerified: true });
    const sent = await sendVerification(user);
    if (!sent) return res.status(503).json({ message: 'We could not send the email right now. Please try again later.' });
    res.json({ message: 'Confirmation email sent.' });
  } catch (error) {
    next(error);
  }
});

// ===============================
// Sessions
// ===============================
// Renew the session while in use (the frontend calls this about once a day).
router.post('/refresh', auth, async (req, res) => {
  res.json({ token: signSession(req.user) });
});

// Sign out every device; this device gets a fresh session.
router.post('/logout-all', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    revokeSessions(user);
    await user.save();
    res.json({ message: 'Signed out of all other devices.', token: signSession(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/change-password', auth, authLimiter, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    const user = await User.findById(req.user._id);
    if (!user.password) return res.status(400).json({ message: 'This account signs in with Google or GitHub.' });
    if (typeof currentPassword !== 'string' || !(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Your current password is incorrect.' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD || newPassword.length > 128) {
      return res.status(400).json({ message: `New password must be at least ${MIN_PASSWORD} characters` });
    }
    user.password = newPassword;
    revokeSessions(user); // other devices must sign in again
    await user.save();
    res.json({ message: 'Password changed. Other devices have been signed out.', token: signSession(user) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;