// Public plan data (same shape as GET /api/subscription/plans), used by the landing page
// when the API is unreachable, so pricing is always shown. Must match backend/config/plans.js:
// backend test "frontend fallback plans match the backend" fails if they drift.
export const PUBLIC_PLANS = [
  {
    "id": "free",
    "name": "Free",
    "price": 0,
    "interval": "forever",
    "tagline": "Perfect for getting started",
    "popular": false,
    "purchasable": false,
    "comingSoon": false,
    "limits": {
      "dailyAnalyses": 5,
      "dailyProposals": null,
      "monthlyProposals": 10,
      "clientProfiles": 0,
      "teamMembers": 1,
      "storage": 104857600,
      "aiTokens": 800
    },
    "features": {
      "clientProfiles": false,
      "analytics": false,
      "customBranding": false,
      "priorityAI": false,
      "teamCollaboration": false,
      "whiteLabel": false,
      "apiAccess": false,
      "prioritySupport": false,
      "export": true
    }
  },
  {
    "id": "starter",
    "name": "Starter",
    "price": 12,
    "interval": "month",
    "tagline": "For freelancers getting serious",
    "popular": false,
    "purchasable": true,
    "comingSoon": false,
    "limits": {
      "dailyAnalyses": 40,
      "dailyProposals": null,
      "monthlyProposals": 50,
      "clientProfiles": 10,
      "teamMembers": 1,
      "storage": 524288000,
      "aiTokens": 1000
    },
    "features": {
      "clientProfiles": true,
      "analytics": false,
      "customBranding": false,
      "priorityAI": false,
      "teamCollaboration": false,
      "whiteLabel": false,
      "apiAccess": false,
      "prioritySupport": false,
      "export": true
    }
  },
  {
    "id": "pro",
    "name": "Pro",
    "price": 19,
    "interval": "month",
    "tagline": "For growing freelancers & pros",
    "popular": true,
    "purchasable": true,
    "comingSoon": false,
    "limits": {
      "dailyAnalyses": 150,
      "dailyProposals": 100,
      "monthlyProposals": null,
      "fairUse": true,
      "clientProfiles": 50,
      "teamMembers": 1,
      "storage": 2147483648,
      "aiTokens": 2000
    },
    "features": {
      "clientProfiles": true,
      "analytics": true,
      "customBranding": true,
      "priorityAI": true,
      "teamCollaboration": false,
      "whiteLabel": false,
      "apiAccess": false,
      "prioritySupport": true,
      "export": true
    }
  },
  {
    "id": "agency",
    "name": "Agency",
    "price": 49,
    "interval": "month",
    "tagline": "For agencies & teams",
    "popular": false,
    "purchasable": false,
    "comingSoon": true,
    "limits": {
      "dailyAnalyses": 300,
      "dailyProposals": null,
      "monthlyProposals": null,
      "clientProfiles": null,
      "teamMembers": 5,
      "storage": 10737418240,
      "aiTokens": 2500
    },
    "features": {
      "clientProfiles": true,
      "analytics": true,
      "customBranding": true,
      "priorityAI": true,
      "teamCollaboration": true,
      "whiteLabel": true,
      "apiAccess": true,
      "prioritySupport": true,
      "export": true
    }
  }
];
