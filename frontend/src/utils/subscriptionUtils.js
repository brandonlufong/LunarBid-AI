// Subscription Access Control Utility
// This file defines what features are available for each plan

export const PLAN_HIERARCHY = {
  free: 0,
  starter: 1,
  pro: 2,
  agency: 3
};

export const PLAN_FEATURES = {
  free: {
    // Proposal Limits
    dailyProposals: 5,
    monthlyProposals: null,
    unlimitedProposals: false,
    
    // Features
    clientProfiles: false,
    analytics: false,
    customBranding: false,
    priorityAI: false,
    teamCollaboration: false,
    whiteLabel: false,
    apiAccess: false,
    
    // Tones & Styles
    tones: ['Professional'], // Only professional tone
    styles: ['Basic'],
    
    // Support
    support: 'email',
    
    // Storage
    clientProfilesLimit: 0,
    teamMembers: 1,
    storage: 100 * 1024 * 1024, // 100 MB
  },
  
  starter: {
    // Proposal Limits
    dailyProposals: null,
    monthlyProposals: 50,
    unlimitedProposals: false,
    
    // Features
    clientProfiles: true,
    analytics: false,
    customBranding: false,
    priorityAI: false,
    teamCollaboration: false,
    whiteLabel: false,
    apiAccess: false,
    
    // Tones & Styles
    tones: ['Professional', 'Friendly', 'Persuasive'], // All tones
    styles: ['Basic', 'Modern', 'Creative'],
    
    // Support
    support: 'standard',
    
    // Storage
    clientProfilesLimit: 10,
    teamMembers: 1,
    storage: 500 * 1024 * 1024, // 500 MB
  },
  
  pro: {
    // Proposal Limits
    dailyProposals: null,
    monthlyProposals: null,
    unlimitedProposals: true,
    
    // Features
    clientProfiles: true,
    analytics: true,
    customBranding: true,
    priorityAI: true,
    teamCollaboration: false,
    whiteLabel: false,
    apiAccess: false,
    
    // Tones & Styles
    tones: ['Professional', 'Friendly', 'Persuasive'],
    styles: ['Basic', 'Modern', 'Creative', 'Premium'],
    
    // Support
    support: 'priority',
    
    // Storage
    clientProfilesLimit: 50,
    teamMembers: 1,
    storage: 2 * 1024 * 1024 * 1024, // 2 GB
  },
  
  agency: {
    // Proposal Limits
    dailyProposals: null,
    monthlyProposals: null,
    unlimitedProposals: true,
    
    // Features
    clientProfiles: true,
    analytics: true,
    customBranding: true,
    priorityAI: true,
    teamCollaboration: true,
    whiteLabel: true,
    apiAccess: true,
    
    // Tones & Styles
    tones: ['Professional', 'Friendly', 'Persuasive'],
    styles: ['Basic', 'Modern', 'Creative', 'Premium'],
    
    // Support
    support: 'dedicated',
    
    // Storage
    clientProfilesLimit: null, // Unlimited
    teamMembers: 5,
    storage: 10 * 1024 * 1024 * 1024, // 10 GB
  }
};

// Check if user has access to a feature
export const hasFeatureAccess = (userPlan, featureName) => {
  const plan = PLAN_FEATURES[userPlan] || PLAN_FEATURES.free;
  return plan[featureName] === true;
};

// Check if user has access to a specific plan level
export const hasMinimumPlan = (userPlan, requiredPlan) => {
  const userLevel = PLAN_HIERARCHY[userPlan] || 0;
  const requiredLevel = PLAN_HIERARCHY[requiredPlan] || 0;
  return userLevel >= requiredLevel;
};

// Get plan limits
export const getPlanLimits = (userPlan) => {
  return PLAN_FEATURES[userPlan] || PLAN_FEATURES.free;
};

// Check if user can create proposal
export const canCreateProposal = (userPlan, usage) => {
  const limits = getPlanLimits(userPlan);
  
  // Check daily limit
  if (limits.dailyProposals !== null && usage.proposalsToday >= limits.dailyProposals) {
    return {
      allowed: false,
      reason: 'daily_limit',
      limit: limits.dailyProposals,
      current: usage.proposalsToday
    };
  }
  
  // Check monthly limit
  if (limits.monthlyProposals !== null && usage.proposalsThisMonth >= limits.monthlyProposals) {
    return {
      allowed: false,
      reason: 'monthly_limit',
      limit: limits.monthlyProposals,
      current: usage.proposalsThisMonth
    };
  }
  
  return { allowed: true };
};

// Get available tones for user's plan
export const getAvailableTones = (userPlan) => {
  const plan = PLAN_FEATURES[userPlan] || PLAN_FEATURES.free;
  return plan.tones;
};

// Check if user can use a specific tone
export const canUseTone = (userPlan, tone) => {
  const availableTones = getAvailableTones(userPlan);
  return availableTones.includes(tone);
};

export default {
  PLAN_HIERARCHY,
  PLAN_FEATURES,
  hasFeatureAccess,
  hasMinimumPlan,
  getPlanLimits,
  canCreateProposal,
  getAvailableTones,
  canUseTone
};