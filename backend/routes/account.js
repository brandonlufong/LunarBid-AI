// backend/routes/account.js
// ============================================================================
// The user's own data: export everything, or delete the account.
// Deletion cancels any Stripe subscription immediately (no further charges),
// then removes the user's content, uploaded logo and account. Stripe keeps its
// own invoice records, which the law requires.
// ============================================================================
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Proposal = require('../models/Proposal');
const ClientProfile = require('../models/ClientProfile');
const ProposalAnalytics = require('../models/ProposalAnalytics');
const { authLimiter } = require('../middleware/rateLimits');
const { removeFile } = require('../services/storage');
const { stripe } = require('../billing/stripe');
const log = require('../utils/logger');

// Support tickets are defined in routes/support.js; look the model up lazily.
const SupportTicket = () => mongoose.models.SupportTicket;

const SECRET_FIELDS = ['password', 'resetPasswordToken', 'resetPasswordExpires', '__v'];

router.get('/export', auth, async (req, res, next) => {
  try {
    const id = req.user._id;
    const user = await User.findById(id).lean();
    SECRET_FIELDS.forEach((f) => delete user[f]);
    if (user.apiAccess) delete user.apiAccess.apiKey;

    const [proposals, clientProfiles, analytics, supportTickets] = await Promise.all([
      Proposal.find({ user: id }).lean(),
      ClientProfile.find({ user: id }).lean(),
      ProposalAnalytics.find({ user: id }).lean(),
      SupportTicket() ? SupportTicket().find({ user: id }).lean() : [],
    ]);

    const date = new Date().toISOString().slice(0, 10);
    res.set('Content-Disposition', `attachment; filename="lunarbid-export-${date}.json"`);
    res.json({ exportedAt: new Date().toISOString(), account: user, proposals, clientProfiles, analytics, supportTickets });
  } catch (error) {
    next(error);
  }
});

router.delete('/', auth, authLimiter, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const { password, confirmEmail } = req.body || {};

    // Re-confirm identity: password for email accounts, typed email for Google/GitHub accounts.
    if (user.password) {
      if (typeof password !== 'string' || !(await user.comparePassword(password))) {
        return res.status(400).json({ message: 'Your password is incorrect.' });
      }
    } else if ((confirmEmail || '').trim().toLowerCase() !== user.email) {
      return res.status(400).json({ message: 'Type your email address to confirm.' });
    }

    // Stop billing first, so a later failure can never leave a paid subscription running.
    const subId = user.subscription?.stripeSubscriptionId;
    if (subId && !['canceled', 'incomplete_expired'].includes(user.subscription.status)) {
      try {
        await stripe().subscriptions.cancel(subId);
      } catch (err) {
        if (err.code !== 'resource_missing') throw err;
      }
    }

    await removeFile(user.branding?.logoUrl);
    await Promise.all([
      Proposal.deleteMany({ user: user._id }),
      ClientProfile.deleteMany({ user: user._id }),
      ProposalAnalytics.deleteMany({ user: user._id }),
      SupportTicket() ? SupportTicket().deleteMany({ user: user._id }) : null,
    ]);
    await User.deleteOne({ _id: user._id });

    log.info({ userId: String(user._id) }, 'account deleted');
    res.json({ deleted: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
