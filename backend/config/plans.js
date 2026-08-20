// backend/config/plans.js
// ============================================================================
// SINGLE SOURCE OF TRUTH for subscription plans: prices, limits and features.
// Backend uses this for gating (User.js) and Stripe (routes/subscription.js).
// The frontend mirrors the public fields in frontend/src/config/plans.js and
// can also fetch them from GET /api/subscription/plans.
//
// Prices match the landing page and the configured Stripe price IDs. If you
// change a price here, update the matching Stripe product OR checkout will show
// a different amount than advertised.
// ============================================================================

const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'forever',
    tagline: 'Perfect for getting started',
    stripePriceEnv: null,
    limits: {
      dailyProposals: 5,
      monthlyProposals: null,
      clientProfiles: 0,
      teamMembers: 1,
      storage: 100 * 1024 * 1024,     // 100 MB
      aiTokens: 800,
    },
    features: {
      clientProfiles: false,
      analytics: false,
      customBranding: false,
      priorityAI: false,
      teamCollaboration: false,
      whiteLabel: false,
      apiAccess: false,
      prioritySupport: false,
      export: true,                    // PDF/DOCX export available to everyone
    },
  },

  starter: {
    id: 'starter',
    name: 'Starter',
    price: 12,
    interval: 'month',
    tagline: 'For freelancers getting serious',
    stripePriceEnv: 'STRIPE_STARTER_PRICE_ID',
    limits: {
      dailyProposals: null,
      monthlyProposals: 50,
      clientProfiles: 10,
      teamMembers: 1,
      storage: 500 * 1024 * 1024,     // 500 MB
      aiTokens: 1000,
    },
    features: {
      clientProfiles: true,
      analytics: false,
      customBranding: false,
      priorityAI: false,
      teamCollaboration: false,
      whiteLabel: false,
      apiAccess: false,
      prioritySupport: false,
      export: true,
    },
  },

  pro: {
    id: 'pro',
    name: 'Pro',
    price: 19,
    interval: 'month',
    tagline: 'For growing freelancers & pros',
    popular: true,
    stripePriceEnv: 'STRIPE_PRO_PRICE_ID',
    limits: {
      dailyProposals: null,
      monthlyProposals: null,          // unlimited
      clientProfiles: 50,
      teamMembers: 1,
      storage: 2 * 1024 * 1024 * 1024, // 2 GB
      aiTokens: 2000,
    },
    features: {
      clientProfiles: true,
      analytics: true,
      customBranding: true,
      priorityAI: true,
      teamCollaboration: false,
      whiteLabel: false,
      apiAccess: false,
      prioritySupport: true,
      export: true,
    },
  },

  agency: {
    id: 'agency',
    name: 'Agency',
    price: 49,
    interval: 'month',
    tagline: 'For agencies & teams',
    stripePriceEnv: 'STRIPE_AGENCY_PRICE_ID',
    limits: {
      dailyProposals: null,
      monthlyProposals: null,          // unlimited
      clientProfiles: null,            // unlimited
      teamMembers: 5,
      storage: 10 * 1024 * 1024 * 1024, // 10 GB
      aiTokens: 2500,
    },
    features: {
      clientProfiles: true,
      analytics: true,
      customBranding: true,
      priorityAI: true,
      teamCollaboration: true,
      whiteLabel: true,
      apiAccess: true,
      prioritySupport: true,
      export: true,
    },
  },
};

const PLAN_ORDER = ['free', 'starter', 'pro', 'agency'];
const PAID_PLANS = ['starter', 'pro', 'agency'];

const getPlan = (planId) => PLANS[planId] || PLANS.free;
const getLimits = (planId) => getPlan(planId).limits;
const hasFeature = (planId, feature) => !!getPlan(planId).features[feature];

// Map planId -> resolved Stripe price id (from env)
const getStripePriceId = (planId) => {
  const env = getPlan(planId).stripePriceEnv;
  return env ? process.env[env] : null;
};

// Public-safe representation for the frontend / landing page
const getPublicPlans = () =>
  PLAN_ORDER.map((id) => {
    const p = PLANS[id];
    return {
      id: p.id,
      name: p.name,
      price: p.price,
      interval: p.interval,
      tagline: p.tagline,
      popular: !!p.popular,
      limits: p.limits,
      features: p.features,
    };
  });

module.exports = {
  PLANS,
  PLAN_ORDER,
  PAID_PLANS,
  getPlan,
  getLimits,
  hasFeature,
  getStripePriceId,
  getPublicPlans,
};
