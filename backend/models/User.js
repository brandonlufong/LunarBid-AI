const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { getPlan, getLimits, hasFeature } = require('../config/plans');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,   // creates a unique index; do NOT also declare schema.index({email:1})
    lowercase: true,
    trim: true
  },
  password: {
    // Not required for social (google/github) accounts.
    type: String,
    required: function () { return !this.authProvider || this.authProvider === 'local'; },
    minlength: 6
  },

  // Auth provider (local email/password, or social OAuth)
  authProvider: { type: String, enum: ['local', 'google', 'github'], default: 'local' },
  providerId: { type: String, default: null },
  avatar: { type: String, default: '' },

  // Password reset
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  profile: {
    experience: { type: String, default: '' },
    skills: { type: String, default: '' },
    hourlyRate: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    bio: { type: String, default: '' },
    role: { type: String, default: '' },
    preferredTone: {
      type: String,
      enum: ['Professional', 'Friendly', 'Persuasive'],
      default: 'Professional'
    },
    platformFocus: {
      type: [String],
      enum: ['Upwork', 'Fiverr', 'Freelancer'],
      default: []
    }
  },

  // Subscription info
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'starter', 'pro', 'agency'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'incomplete', 'past_due', 'trialing', 'unpaid'],
      default: 'active'
    },
    startDate: { type: Date },
    endDate: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    stripePriceId: { type: String }
  },

  // Usage tracking
  usage: {
    proposalsToday: { type: Number, default: 0 },
    proposalsThisMonth: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now },
    totalProposals: { type: Number, default: 0 },
    monthlyResetDate: { type: Date, default: Date.now }
  },

  // Custom Branding (Pro & Agency)
  branding: {
    logoUrl: { type: String, default: '' },
    primaryColor: { type: String, default: '#6366f1' },
    secondaryColor: { type: String, default: '#8b5cf6' },
    companyName: { type: String, default: '' },
    tagline: { type: String, default: '' },
    website: { type: String, default: '' }
  },

  // Team management (Agency only)
  team: {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'owner'
    },
    isTeamOwner: { type: Boolean, default: false }
  },

  // API Access (Agency only)
  apiAccess: {
    apiKey: { type: String, default: '' },
    apiKeyCreatedAt: { type: Date },
    apiCallsThisMonth: { type: Number, default: 0 },
    lastApiCall: { type: Date }
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving (async fn returns a promise, no next() needed)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Keep updatedAt fresh
userSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ===============================
// Can this user generate a proposal? (limits sourced from config/plans.js)
// Also resets daily/monthly counters when the period rolls over.
// ===============================
userSchema.methods.canGenerateProposal = function () {
  const { dailyProposals, monthlyProposals } = getLimits(this.subscription.plan);

  const now = new Date();

  // Daily reset
  const lastReset = new Date(this.usage.lastResetDate);
  if (now.getDate() !== lastReset.getDate() ||
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear()) {
    this.usage.proposalsToday = 0;
    this.usage.lastResetDate = now;
  }

  // Monthly reset
  const monthlyReset = new Date(this.usage.monthlyResetDate);
  if (now.getMonth() !== monthlyReset.getMonth() ||
      now.getFullYear() !== monthlyReset.getFullYear()) {
    this.usage.proposalsThisMonth = 0;
    this.usage.monthlyResetDate = now;
  }

  if (dailyProposals != null && this.usage.proposalsToday >= dailyProposals) {
    return { allowed: false, reason: 'daily_limit', limit: dailyProposals };
  }

  if (monthlyProposals != null && this.usage.proposalsThisMonth >= monthlyProposals) {
    return { allowed: false, reason: 'monthly_limit', limit: monthlyProposals };
  }

  return { allowed: true };
};

userSchema.methods.incrementUsage = function () {
  this.usage.proposalsToday += 1;
  this.usage.proposalsThisMonth += 1;
  this.usage.totalProposals += 1;
};

userSchema.methods.hasFeatureAccess = function (featureName) {
  return hasFeature(this.subscription.plan, featureName);
};

userSchema.methods.getPlanLimits = function () {
  return getLimits(this.subscription.plan);
};

userSchema.methods.getPlanConfig = function () {
  return getPlan(this.subscription.plan);
};

// Indexes (email index comes from `unique: true` above)
userSchema.index({ 'subscription.plan': 1 });
userSchema.index({ 'team.teamId': 1 });

module.exports = mongoose.model('User', userSchema);
