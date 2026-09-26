// middleware/checkFeatureAccess.js
const User = require('../models/User');

/**
 * Middleware to check if user has access to a specific feature based on their subscription plan
 * Usage: router.get('/analytics', auth, checkFeatureAccess('analytics'), controller)
 */
const checkFeatureAccess = (featureName) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user || !req.user._id) {
        return res.status(401).json({ 
          error: 'Authentication required' 
        });
      }
      
      // Get full user object (req.user might be minimal from auth middleware)
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }
      
      // Check if user has access to the feature
      const hasAccess = user.hasFeatureAccess(featureName);
      const plan = user.effectivePlan();
      
      if (!hasAccess) {
        return res.status(403).json({ 
          error: `Feature '${featureName}' not available in ${plan} plan`,
          upgradeRequired: true,
          currentPlan: plan,
          paymentIssue: user.subscription.plan !== plan,
          feature: featureName,
          message: getUpgradeMessage(plan, featureName)
        });
      }
      
      // hasFeatureAccess() already uses the effective plan, so a paid plan whose
      // payment is incomplete, unpaid or canceled is treated as free above.

      // Attach user to request for use in route handlers
      req.userFull = user;
      
      next();
    } catch (error) {
      console.error('Feature access check error:', error);
      res.status(500).json({ error: 'Error checking feature access' });
    }
  };
};

/**
 * Helper function to get upgrade message for specific features
 */
function getUpgradeMessage(currentPlan, featureName) {
  const upgradeMessages = {
    clientProfiles: {
      free: 'Upgrade to Starter plan ($12/mo) to save client profiles',
      starter: 'Already have access to client profiles!',
      pro: 'Already have access to client profiles!',
      agency: 'Already have access to client profiles!'
    },
    analytics: {
      free: 'Upgrade to Pro plan ($19/mo) to access advanced analytics',
      starter: 'Upgrade to Pro plan ($19/mo) to access advanced analytics',
      pro: 'Already have access to analytics!',
      agency: 'Already have access to analytics!'
    },
    customBranding: {
      free: 'Upgrade to Pro plan ($19/mo) to customize your branding',
      starter: 'Upgrade to Pro plan ($19/mo) to customize your branding',
      pro: 'Already have access to custom branding!',
      agency: 'Already have access to custom branding!'
    },
    priorityAI: {
      free: 'Upgrade to Pro plan ($19/mo) for priority AI processing',
      starter: 'Upgrade to Pro plan ($19/mo) for priority AI processing',
      pro: 'Already have priority AI!',
      agency: 'Already have priority AI!'
    },
    teamCollaboration: {
      free: 'Upgrade to Agency plan ($49/mo) for team collaboration',
      starter: 'Upgrade to Agency plan ($49/mo) for team collaboration',
      pro: 'Upgrade to Agency plan ($49/mo) for team collaboration',
      agency: 'Already have team collaboration!'
    },
    whiteLabel: {
      free: 'Upgrade to Agency plan ($49/mo) for white-label branding',
      starter: 'Upgrade to Agency plan ($49/mo) for white-label branding',
      pro: 'Upgrade to Agency plan ($49/mo) for white-label branding',
      agency: 'Already have white-label branding!'
    },
    apiAccess: {
      free: 'Upgrade to Agency plan ($49/mo) for API access',
      starter: 'Upgrade to Agency plan ($49/mo) for API access',
      pro: 'Upgrade to Agency plan ($49/mo) for API access',
      agency: 'Already have API access!'
    },
    prioritySupport: {
      free: 'Upgrade to Pro plan ($19/mo) for priority support',
      starter: 'Upgrade to Pro plan ($19/mo) for priority support',
      pro: 'Already have priority support!',
      agency: 'Already have dedicated support!'
    }
  };
  
  return upgradeMessages[featureName]?.[currentPlan] || 
         'Upgrade your plan to access this feature';
}

/**
 * Middleware to check usage limits before creating resources
 * Usage: router.post('/proposals', auth, checkUsageLimit('proposals'), controller)
 */
const checkUsageLimit = (resourceType) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (resourceType === 'proposals') {
        const canGenerate = user.canGenerateProposal();
        
        if (!canGenerate.allowed) {
          return res.status(403).json({
            error: canGenerate.reason === 'daily_limit' 
              ? `Daily limit of ${canGenerate.limit} proposals reached`
              : `Monthly limit of ${canGenerate.limit} proposals reached`,
            reason: canGenerate.reason,
            limit: canGenerate.limit,
            currentPlan: user.effectivePlan(),
            usage: {
              today: user.usage.proposalsToday,
              thisMonth: user.usage.proposalsThisMonth
            },
            upgradeMessage: canGenerate.reason === 'daily_limit'
              ? 'Upgrade to Starter plan ($12/mo) for 50 proposals/month or Pro plan ($19/mo) for unlimited proposals'
              : 'Upgrade to Pro plan ($19/mo) for unlimited proposals'
          });
        }
      }
      
      if (resourceType === 'clientProfiles') {
        const limits = user.getPlanLimits();
        const count = await require('../models/ClientProfile').countDocuments({ 
          user: user._id, 
          isActive: true 
        });
        
        if (limits.clientProfiles !== null && count >= limits.clientProfiles) {
          return res.status(403).json({
            error: `Client profile limit reached (${limits.clientProfiles} profiles)`,
            limit: limits.clientProfiles,
            current: count,
            currentPlan: user.effectivePlan(),
            upgradeMessage: 'Upgrade to Pro plan for 50 profiles or Agency plan for unlimited'
          });
        }
      }
      
      req.userFull = user;
      next();
    } catch (error) {
      console.error('Usage limit check error:', error);
      res.status(500).json({ error: 'Error checking usage limits' });
    }
  };
};

/**
 * Middleware to check team permissions (for Agency plan)
 * Usage: router.post('/team/invite', auth, checkTeamPermission('manageTeam'), controller)
 */
const checkTeamPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id);
      
      if (!user.team.teamId) {
        return res.status(403).json({ 
          error: 'Not part of a team',
          message: 'Upgrade to Agency plan for team collaboration'
        });
      }
      
      const Team = require('../models/Team');
      const team = await Team.findById(user.team.teamId);
      
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }
      
      const hasPermission = team.hasPermission(user._id, permission);
      
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: permission,
          yourRole: user.team.role
        });
      }
      
      req.userFull = user;
      req.team = team;
      next();
    } catch (error) {
      console.error('Team permission check error:', error);
      res.status(500).json({ error: 'Error checking team permissions' });
    }
  };
};

module.exports = checkFeatureAccess;
module.exports.checkUsageLimit = checkUsageLimit;
module.exports.checkTeamPermission = checkTeamPermission;