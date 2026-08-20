const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendMail, isConfigured: emailConfigured } = require('../services/mailer');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;

const signToken = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, profile: user.profile, avatar: user.avatar });
const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = new User({ name, email, password });
    await user.save();

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Forgot password — issue a reset token (emailed, or returned in dev)
// ===============================
router.post('/forgot-password', async (req, res) => {
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

    // In dev (email not configured) return the link so the flow is testable.
    if (!result.sent) {
      return res.json({ ...generic, devResetLink: resetLink, emailConfigured: emailConfigured() });
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
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and new password are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const user = await User.findOne({
      resetPasswordToken: hashToken(token),
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: 'This reset link is invalid or has expired.' });

    user.password = password; // hashed by the pre-save hook
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
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
const googleConfigured = () => !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
const githubConfigured = () => !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;

// Public: which providers are enabled (frontend hides/greys buttons accordingly)
router.get('/providers', (req, res) => {
  res.json({ google: googleConfigured(), github: githubConfigured(), email: emailConfigured() });
});

const finishOAuth = async (res, { provider, providerId, name, email, avatar }) => {
  if (!email) return res.redirect(`${FRONTEND_URL}/login?error=oauth_no_email`);
  let user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    user = new User({ name: name || email.split('@')[0], email: email.toLowerCase(), authProvider: provider, providerId, avatar: avatar || '' });
    await user.save();
  } else if (user.authProvider === 'local') {
    // Link the social identity to the existing local account.
    user.providerId = user.providerId || providerId;
    if (avatar && !user.avatar) user.avatar = avatar;
    await user.save();
  }
  const token = signToken(user);
  return res.redirect(`${FRONTEND_URL}/oauth?token=${token}`);
};

// --- Google ---
router.get('/google', (req, res) => {
  if (!googleConfigured()) return res.redirect(`${FRONTEND_URL}/login?error=oauth_unconfigured&provider=google`);
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${BACKEND_URL}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
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
    return finishOAuth(res, { provider: 'google', providerId: p.id, name: p.name, email: p.email, avatar: p.picture });
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
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get('/github/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
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
    const primary = (emails.data || []).find((e) => e.primary && e.verified) || (emails.data || [])[0];
    const email = primary?.email || profile.data.email;
    return finishOAuth(res, { provider: 'github', providerId: String(profile.data.id), name: profile.data.name || profile.data.login, email, avatar: profile.data.avatar_url });
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
    profile: req.user.profile
  });
});

module.exports = router;