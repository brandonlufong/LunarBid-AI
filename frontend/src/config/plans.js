// frontend/src/config/plans.js
// ----------------------------------------------------------------------------
// NOTE: The live UI reads plans from GET /api/subscription/plans, falling back to
// frontend/src/config/publicPlans.js (which a backend test keeps in sync with
// backend/config/plans.js). This file is kept aligned for reference only.
// Numbers below mirror the backend; publicPlans.js is the enforced mirror.
// ----------------------------------------------------------------------------

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'forever',
    tagline: 'Perfect for getting started',
    popular: false,
    limits: { dailyProposals: null, monthlyProposals: 15, clientProfiles: 0, teamMembers: 1 },
    features: {
      clientProfiles: false, analytics: false, customBranding: false, priorityAI: false,
      teamCollaboration: false, whiteLabel: false, apiAccess: false, prioritySupport: false, export: true,
    },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 12,
    interval: 'month',
    tagline: 'For freelancers getting serious',
    popular: false,
    limits: { dailyProposals: null, monthlyProposals: 150, clientProfiles: 10, teamMembers: 1 },
    features: {
      clientProfiles: true, analytics: false, customBranding: false, priorityAI: false,
      teamCollaboration: false, whiteLabel: false, apiAccess: false, prioritySupport: false, export: true,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 19,
    interval: 'month',
    tagline: 'For growing freelancers & pros',
    popular: true,
    limits: { dailyProposals: null, monthlyProposals: null, clientProfiles: 50, teamMembers: 1 },
    features: {
      clientProfiles: true, analytics: true, customBranding: true, priorityAI: true,
      teamCollaboration: false, whiteLabel: false, apiAccess: false, prioritySupport: true, export: true,
    },
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    price: 49,
    interval: 'month',
    tagline: 'For agencies & teams',
    popular: false,
    limits: { dailyProposals: null, monthlyProposals: null, clientProfiles: null, teamMembers: 5 },
    features: {
      clientProfiles: true, analytics: true, customBranding: true, priorityAI: true,
      teamCollaboration: true, whiteLabel: true, apiAccess: true, prioritySupport: true, export: true,
    },
  },
};

export const PLAN_ORDER = ['free', 'starter', 'pro', 'agency'];
export const PLAN_LIST = PLAN_ORDER.map((id) => PLANS[id]);

export const getPlan = (planId) => PLANS[planId] || PLANS.free;
export const planHasFeature = (planId, feature) => !!getPlan(planId).features[feature];
export const priceLabel = (planId) => `$${getPlan(planId).price}`;

// Optional: hydrate from the API (keeps a single server-driven source of truth)
export async function fetchPlans(api) {
  try {
    const res = await api.get('/subscription/plans');
    return res.data.plans;
  } catch {
    return PLAN_LIST;
  }
}
