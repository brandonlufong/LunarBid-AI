// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   name: { type: String, required: true, trim: true },
//   email: { type: String, required: true, unique: true, lowercase: true, trim: true },
//   password: { type: String, required: true, minlength: 6 },
  
//   profile: {
//     experience: { type: String, default: '' },
//     skills: { type: String, default: '' },
//     hourlyRate: { type: String, default: '' },
//     portfolio: { type: String, default: '' },
//     bio: { type: String, default: '' },
//     role: { type: String, default: '' },
//     preferredTone: { type: String, enum: ['Professional', 'Friendly', 'Persuasive'], default: 'Professional' },
//     platformFocus: { type: [String], enum: ['Upwork', 'Fiverr', 'Freelancer'], default: [] }
//   },
  
//   subscription: {
//     plan: { type: String, enum: ['free', 'starter', 'pro', 'agency'], default: 'free' },
//     status: { type: String, enum: ['active', 'cancelled', 'expired', 'incomplete', 'past_due', 'trialing', 'unpaid'], default: 'active' },
//     startDate: { type: Date },
//     endDate: { type: Date },
//     cancelAtPeriodEnd: { type: Boolean, default: false },
//     stripeCustomerId: { type: String },
//     stripeSubscriptionId: { type: String },
//     stripePriceId: { type: String }
//   },
  
//   usage: {
//     proposalsToday: { type: Number, default: 0 },
//     proposalsThisMonth: { type: Number, default: 0 },
//     lastResetDate: { type: Date, default: Date.now },
//     totalProposals: { type: Number, default: 0 },
//     monthlyResetDate: { type: Date, default: Date.now }
//   },
  
//   branding: {
//     logoUrl: { type: String, default: '' },
//     primaryColor: { type: String, default: '#6366f1' },
//     secondaryColor: { type: String, default: '#8b5cf6' },
//     companyName: { type: String, default: '' },
//     tagline: { type: String, default: '' },
//     website: { type: String, default: '' }
//   },
  
//   team: {
//     teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
//     role: { type: String, enum: ['owner', 'admin', 'member'], default: 'owner' },
//     isTeamOwner: { type: Boolean, default: false }
//   },
  
//   apiAccess: {
//     apiKey: { type: String, default: '' },
//     apiKeyCreatedAt: { type: Date },
//     apiCallsThisMonth: { type: Number, default: 0 },
//     lastApiCall: { type: Date }
//   },
  
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// });

// // ===================================
// // PRE-SAVE HOOKS - MODERN ASYNC/AWAIT (NO next())
// // ===================================

// // Hash password before saving - async functions return promises, no need for next()
// userSchema.pre('save', async function() {
//   if (!this.isModified('password')) return;
//   this.password = await bcrypt.hash(this.password, 12);
// });

// // Update timestamp - this is synchronous, also no next() needed in Mongoose 6+
// userSchema.pre('save', function() {
//   this.updatedAt = Date.now();
// });

// // ===================================
// // INSTANCE METHODS
// // ===================================

// userSchema.methods.comparePassword = async function(candidatePassword) {
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// userSchema.methods.canGenerateProposal = function() {
//   const limits = {
//     free: { daily: 5, monthly: null },
//     starter: { daily: null, monthly: 50 },
//     pro: { daily: null, monthly: null },
//     agency: { daily: null, monthly: null }
//   };
  
//   const plan = this.subscription.plan;
//   const limit = limits[plan];
  
//   const now = new Date();
//   const lastReset = new Date(this.usage.lastResetDate);
//   if (now.getDate() !== lastReset.getDate() || now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
//     this.usage.proposalsToday = 0;
//     this.usage.lastResetDate = now;
//   }
  
//   const monthlyReset = new Date(this.usage.monthlyResetDate);
//   if (now.getMonth() !== monthlyReset.getMonth() || now.getFullYear() !== monthlyReset.getFullYear()) {
//     this.usage.proposalsThisMonth = 0;
//     this.usage.monthlyResetDate = now;
//   }
  
//   if (plan === 'pro' || plan === 'agency') return { allowed: true };
//   if (limit.daily && this.usage.proposalsToday >= limit.daily) return { allowed: false, reason: 'daily_limit', limit: limit.daily };
//   if (limit.monthly && this.usage.proposalsThisMonth >= limit.monthly) return { allowed: false, reason: 'monthly_limit', limit: limit.monthly };
  
//   return { allowed: true };
// };

// userSchema.methods.incrementUsage = function() {
//   this.usage.proposalsToday += 1;
//   this.usage.proposalsThisMonth += 1;
//   this.usage.totalProposals += 1;
// };

// userSchema.methods.hasFeatureAccess = function(featureName) {
//   const features = {
//     free: { clientProfiles: false, analytics: false, customBranding: false, priorityAI: false, teamCollaboration: false, whiteLabel: false, apiAccess: false, prioritySupport: false },
//     starter: { clientProfiles: true, analytics: false, customBranding: false, priorityAI: false, teamCollaboration: false, whiteLabel: false, apiAccess: false, prioritySupport: false },
//     pro: { clientProfiles: true, analytics: true, customBranding: true, priorityAI: true, teamCollaboration: false, whiteLabel: false, apiAccess: false, prioritySupport: true },
//     agency: { clientProfiles: true, analytics: true, customBranding: true, priorityAI: true, teamCollaboration: true, whiteLabel: true, apiAccess: true, prioritySupport: true }
//   };
//   return features[this.subscription.plan]?.[featureName] || false;
// };

// userSchema.methods.getPlanLimits = function() {
//   const limits = {
//     free: { dailyProposals: 5, monthlyProposals: null, clientProfiles: 0, teamMembers: 1, storage: 100 * 1024 * 1024, aiTokens: 800 },
//     starter: { dailyProposals: null, monthlyProposals: 50, clientProfiles: 10, teamMembers: 1, storage: 500 * 1024 * 1024, aiTokens: 1000 },
//     pro: { dailyProposals: null, monthlyProposals: null, clientProfiles: 50, teamMembers: 1, storage: 2 * 1024 * 1024 * 1024, aiTokens: 2000 },
//     agency: { dailyProposals: null, monthlyProposals: null, clientProfiles: null, teamMembers: 5, storage: 10 * 1024 * 1024 * 1024, aiTokens: 2500 }
//   };
//   return limits[this.subscription.plan];
// };

// userSchema.index({ email: 1 });
// userSchema.index({ 'subscription.plan': 1 });
// userSchema.index({ 'team.teamId': 1 });

// module.exports = mongoose.model('User', userSchema);

// Backup of previous version 2:
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
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
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// ===============================
// ✅ FIXED: Modern async/await - NO next() needed!
// Hash password before saving
// ===============================
userSchema.pre('save', async function() {
  // Only hash if password was modified
  if (!this.isModified('password')) return;
  
  // Hash password
  this.password = await bcrypt.hash(this.password, 12);
});

// ===============================
// ✅ FIXED: Modern pattern - NO next() needed!
// Update timestamp on save
// ===============================
userSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// ===============================
// Compare password method
// ===============================
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ===============================
// Check if user can generate proposal
// ===============================
userSchema.methods.canGenerateProposal = function() {
  const limits = {
    free: { daily: 5, monthly: null },
    starter: { daily: null, monthly: 50 },
    pro: { daily: null, monthly: null },
    agency: { daily: null, monthly: null }
  };
  
  const plan = this.subscription.plan;
  const limit = limits[plan];
  
  // Reset daily counter if needed
  const now = new Date();
  const lastReset = new Date(this.usage.lastResetDate);
  if (now.getDate() !== lastReset.getDate() || 
      now.getMonth() !== lastReset.getMonth() || 
      now.getFullYear() !== lastReset.getFullYear()) {
    this.usage.proposalsToday = 0;
    this.usage.lastResetDate = now;
  }
  
  // Reset monthly counter if needed
  const monthlyReset = new Date(this.usage.monthlyResetDate);
  if (now.getMonth() !== monthlyReset.getMonth() || 
      now.getFullYear() !== monthlyReset.getFullYear()) {
    this.usage.proposalsThisMonth = 0;
    this.usage.monthlyResetDate = now;
  }
  
  // Check limits
  if (plan === 'pro' || plan === 'agency') {
    return { allowed: true };
  }
  
  if (limit.daily && this.usage.proposalsToday >= limit.daily) {
    return { allowed: false, reason: 'daily_limit', limit: limit.daily };
  }
  
  if (limit.monthly && this.usage.proposalsThisMonth >= limit.monthly) {
    return { allowed: false, reason: 'monthly_limit', limit: limit.monthly };
  }
  
  return { allowed: true };
};

// ===============================
// Increment usage
// ===============================
userSchema.methods.incrementUsage = function() {
  this.usage.proposalsToday += 1;
  this.usage.proposalsThisMonth += 1;
  this.usage.totalProposals += 1;
};

// ===============================
// Check feature access
// ===============================
userSchema.methods.hasFeatureAccess = function(featureName) {
  const features = {
    free: {
      clientProfiles: false,
      analytics: false,
      customBranding: false,
      priorityAI: false,
      teamCollaboration: false,
      whiteLabel: false,
      apiAccess: false,
      prioritySupport: false
    },
    starter: {
      clientProfiles: true,
      analytics: false,
      customBranding: false,
      priorityAI: false,
      teamCollaboration: false,
      whiteLabel: false,
      apiAccess: false,
      prioritySupport: false
    },
    pro: {
      clientProfiles: true,
      analytics: true,
      customBranding: true,
      priorityAI: true,
      teamCollaboration: false,
      whiteLabel: false,
      apiAccess: false,
      prioritySupport: true
    },
    agency: {
      clientProfiles: true,
      analytics: true,
      customBranding: true,
      priorityAI: true,
      teamCollaboration: true,
      whiteLabel: true,
      apiAccess: true,
      prioritySupport: true
    }
  };
  
  return features[this.subscription.plan]?.[featureName] || false;
};

// ===============================
// Get plan limits
// ===============================
userSchema.methods.getPlanLimits = function() {
  const limits = {
    free: {
      dailyProposals: 5,
      monthlyProposals: null,
      clientProfiles: 0,
      teamMembers: 1,
      storage: 100 * 1024 * 1024,
      aiTokens: 800
    },
    starter: {
      dailyProposals: null,
      monthlyProposals: 50,
      clientProfiles: 10,
      teamMembers: 1,
      storage: 500 * 1024 * 1024,
      aiTokens: 1000
    },
    pro: {
      dailyProposals: null,
      monthlyProposals: null,
      clientProfiles: 50,
      teamMembers: 1,
      storage: 2 * 1024 * 1024 * 1024,
      aiTokens: 2000
    },
    agency: {
      dailyProposals: null,
      monthlyProposals: null,
      clientProfiles: null,
      teamMembers: 5,
      storage: 10 * 1024 * 1024 * 1024,
      aiTokens: 2500
    }
  };
  
  return limits[this.subscription.plan];
};

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ 'subscription.plan': 1 });
userSchema.index({ 'team.teamId': 1 });

module.exports = mongoose.model('User', userSchema);


// Backup of previous version:
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true,
//     trim: true
//   },
//   password: {
//     type: String,
//     required: true,
//     minlength: 6
//   },
//   profile: {
//     experience: { type: String, default: '' },
//     skills: { type: String, default: '' },
//     hourlyRate: { type: String, default: '' },
//     portfolio: { type: String, default: '' },
//     bio: { type: String, default: '' },
//     // ADD THESE:
//     role: { type: String, default: '' },                    // e.g., 'Web Developer', 'UI Designer'
//     preferredTone: { 
//       type: String, 
//       enum: ['Professional', 'Friendly', 'Persuasive'],
//       default: 'Professional'
//     },
//     platformFocus: {
//       type: [String],                                        // Array to support multiple platforms
//       enum: ['Upwork', 'Fiverr', 'Freelancer'],
//       default: []
//     }
//   },
//     // NEW: Subscription info
//   subscription: {
//     plan: { 
//       type: String, 
//       enum: ['free', 'starter', 'pro'], 
//       default: 'free' 
//     },
//     status: { 
//       type: String, 
//       enum: ['active', 'cancelled', 'expired'], 
//       default: 'active' 
//     },
//     startDate: { type: Date },
//     endDate: { type: Date },
//     stripeCustomerId: { type: String },
//     stripeSubscriptionId: { type: String }
//   },
  
//   // NEW: Usage tracking
//   usage: {
//     proposalsToday: { type: Number, default: 0 },
//     proposalsThisMonth: { type: Number, default: 0 },
//     lastResetDate: { type: Date, default: Date.now },
//     totalProposals: { type: Number, default: 0 }
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // Hash password before saving
// userSchema.pre('save', async function() {
//   if (!this.isModified('password')) return;
//   this.password = await bcrypt.hash(this.password, 12);
// });

// // Compare password method
// userSchema.methods.comparePassword = async function(candidatePassword) {
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// // NEW: Check if user can generate proposal
// userSchema.methods.canGenerateProposal = function() {
//   const limits = {
//     free: { daily: 5, monthly: null },
//     starter: { daily: null, monthly: 50 },
//     pro: { daily: null, monthly: null } // Unlimited
//   };
  
//   const plan = this.subscription.plan;
//   const limit = limits[plan];
  
//   // Reset daily counter if needed
//   const now = new Date();
//   const lastReset = new Date(this.usage.lastResetDate);
//   if (now.getDate() !== lastReset.getDate() || 
//       now.getMonth() !== lastReset.getMonth() || 
//       now.getFullYear() !== lastReset.getFullYear()) {
//     this.usage.proposalsToday = 0;
//     this.usage.lastResetDate = now;
//   }
  
//   // Check limits
//   if (plan === 'pro') return { allowed: true };
  
//   if (limit.daily && this.usage.proposalsToday >= limit.daily) {
//     return { allowed: false, reason: 'daily_limit', limit: limit.daily };
//   }
  
//   if (limit.monthly && this.usage.proposalsThisMonth >= limit.monthly) {
//     return { allowed: false, reason: 'monthly_limit', limit: limit.monthly };
//   }
  
//   return { allowed: true };
// };

// // NEW: Increment usage
// userSchema.methods.incrementUsage = function() {
//   this.usage.proposalsToday += 1;
//   this.usage.proposalsThisMonth += 1;
//   this.usage.totalProposals += 1;
// };

// module.exports = mongoose.model('User', userSchema);