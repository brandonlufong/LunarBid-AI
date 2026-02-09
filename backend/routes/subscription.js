const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Stripe Price IDs
const STRIPE_PRICES = {
  starter: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter',
  pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
  agency: process.env.STRIPE_AGENCY_PRICE_ID || 'price_agency'
};

// ===============================
// Get current subscription info
// ===============================
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const limits = user.getPlanLimits();
    const features = {
      clientProfiles: user.hasFeatureAccess('clientProfiles'),
      analytics: user.hasFeatureAccess('analytics'),
      customBranding: user.hasFeatureAccess('customBranding'),
      priorityAI: user.hasFeatureAccess('priorityAI'),
      teamCollaboration: user.hasFeatureAccess('teamCollaboration'),
      whiteLabel: user.hasFeatureAccess('whiteLabel'),
      apiAccess: user.hasFeatureAccess('apiAccess'),
      prioritySupport: user.hasFeatureAccess('prioritySupport')
    };
    
    res.json({
      subscription: {
        plan: user.subscription.plan,
        status: user.subscription.status,
        startDate: user.subscription.startDate,
        endDate: user.subscription.endDate,
        cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd
      },
      usage: {
        proposalsToday: user.usage.proposalsToday,
        proposalsThisMonth: user.usage.proposalsThisMonth,
        totalProposals: user.usage.totalProposals
      },
      limits,
      features
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Upgrade/Change plan - FINAL FIX
// ===============================
router.post('/upgrade', auth, async (req, res) => {
  try {
    const { plan } = req.body;
    
    if (!['starter', 'pro', 'agency'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    const user = await User.findById(req.user._id);
    const priceId = STRIPE_PRICES[plan];
    
    if (!priceId) {
      return res.status(500).json({ 
        message: 'Stripe price ID not configured for this plan' 
      });
    }
    
    // Create Stripe customer if doesn't exist
    if (!user.subscription.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString()
        }
      });
      user.subscription.stripeCustomerId = customer.id;
      await user.save();
    }
    
    let stripeSubscription;
    
    // Check if user has existing subscription
    if (user.subscription.stripeSubscriptionId) {
      try {
        const existingSubscription = await stripe.subscriptions.retrieve(
          user.subscription.stripeSubscriptionId
        );
        
        // Handle incomplete subscriptions
        if (existingSubscription.status === 'incomplete' || existingSubscription.status === 'incomplete_expired') {
          console.log('Cancelling incomplete subscription:', existingSubscription.id);
          await stripe.subscriptions.cancel(existingSubscription.id);
          user.subscription.stripeSubscriptionId = null;
          await user.save();
        } else {
          // Update existing active subscription
          console.log('Updating existing subscription:', existingSubscription.id);
          stripeSubscription = await stripe.subscriptions.update(
            user.subscription.stripeSubscriptionId,
            {
              items: [{
                id: existingSubscription.items.data[0].id,
                price: priceId
              }],
              proration_behavior: 'always_invoice'
            }
          );
        }
      } catch (stripeError) {
        console.error('Error with subscription:', stripeError.message);
        user.subscription.stripeSubscriptionId = null;
        await user.save();
      }
    }
    
    // Create new subscription if needed
    if (!stripeSubscription) {
      console.log('Creating new subscription for plan:', plan);
      
      stripeSubscription = await stripe.subscriptions.create({
        customer: user.subscription.stripeCustomerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: user._id.toString(),
          plan: plan
        }
      });
    }
    
    // FIXED: Properly handle dates and status
    user.subscription.plan = plan;
    user.subscription.stripeSubscriptionId = stripeSubscription.id;
    user.subscription.stripePriceId = priceId;
    
    // FIXED: Check if dates exist before converting
    if (stripeSubscription.current_period_start) {
      user.subscription.startDate = new Date(stripeSubscription.current_period_start * 1000);
    }
    
    if (stripeSubscription.current_period_end) {
      user.subscription.endDate = new Date(stripeSubscription.current_period_end * 1000);
    }
    
    // FIXED: Only set status if it's valid, otherwise keep as 'active'
    const validStatuses = ['active', 'cancelled', 'expired', 'incomplete', 'past_due', 'trialing', 'unpaid'];
    if (validStatuses.includes(stripeSubscription.status)) {
      user.subscription.status = stripeSubscription.status;
    } else {
      user.subscription.status = 'active';
    }
    
    await user.save();
    
    // Prepare response
    const responseData = {
      success: true,
      message: 'Subscription created successfully',
      subscription: {
        plan: user.subscription.plan,
        status: user.subscription.status,
        subscriptionId: stripeSubscription.id
      }
    };
    
    // If subscription is incomplete, send client secret
    if (stripeSubscription.status === 'incomplete' && stripeSubscription.latest_invoice) {
      const invoice = stripeSubscription.latest_invoice;
      if (invoice.payment_intent) {
        responseData.clientSecret = invoice.payment_intent.client_secret;
        responseData.requiresPayment = true;
      }
    }
    
    res.json(responseData);
    
  } catch (error) {
    console.error('Upgrade error:', error);
    res.status(500).json({ 
      message: 'Upgrade failed. Please try again.',
      error: error.message 
    });
  }
});

// ===============================
// Cancel subscription
// ===============================
router.post('/cancel', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.subscription.stripeSubscriptionId) {
      return res.status(400).json({ 
        message: 'No active subscription to cancel' 
      });
    }
    
    await stripe.subscriptions.update(
      user.subscription.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );
    
    user.subscription.cancelAtPeriodEnd = true;
    await user.save();
    
    res.json({ 
      success: true,
      message: 'Subscription will be cancelled at the end of the billing period',
      endDate: user.subscription.endDate
    });
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ message: 'Cancellation failed' });
  }
});

// ===============================
// Stripe Webhook Handler - FINAL FIX
// ===============================
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  console.log('✅ Webhook verified! Event type:', event.type);
  
  // Handle the event
  try {
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
        await handleSubscriptionUpdate(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
        
      case 'invoice.created':
      case 'invoice.finalized':
      case 'invoice.updated':
      case 'invoice.voided':
      case 'payment_intent.created':
      case 'payment_intent.canceled':
        console.log(`ℹ️  Informational event: ${event.type}`);
        break;
        
      default:
        console.log(`⚠️  Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
  
  res.json({ received: true });
});

// ===============================
// Webhook Helper Functions - FIXED
// ===============================

async function handleSubscriptionUpdate(subscription) {
  try {
    // FIXED: Use metadata to find user if subscription lookup fails
    let user = await User.findOne({ 
      'subscription.stripeSubscriptionId': subscription.id 
    });
    
    // If not found by subscription ID, try by customer ID
    if (!user && subscription.customer) {
      user = await User.findOne({
        'subscription.stripeCustomerId': subscription.customer
      });
      
      // Update subscription ID if we found user by customer
      if (user) {
        user.subscription.stripeSubscriptionId = subscription.id;
      }
    }
    
    // If still not found, try using metadata
    if (!user && subscription.metadata && subscription.metadata.userId) {
      user = await User.findById(subscription.metadata.userId);
      
      if (user) {
        user.subscription.stripeSubscriptionId = subscription.id;
        user.subscription.stripeCustomerId = subscription.customer;
      }
    }
    
    if (!user) {
      console.log('⚠️  User not found for subscription:', subscription.id);
      return;
    }
    
    console.log('📝 Updating subscription for user:', user.email);
    
    // Determine plan from price ID or metadata
    let plan = subscription.metadata?.plan || user.subscription.plan;
    for (const [planName, priceId] of Object.entries(STRIPE_PRICES)) {
      if (subscription.items.data[0].price.id === priceId) {
        plan = planName;
        break;
      }
    }
    
    user.subscription.plan = plan;
    
    // FIXED: Validate status before setting
    const validStatuses = ['active', 'cancelled', 'expired', 'incomplete', 'past_due', 'trialing', 'unpaid'];
    user.subscription.status = validStatuses.includes(subscription.status) ? subscription.status : 'active';
    
    // FIXED: Properly handle dates
    if (subscription.current_period_start) {
      user.subscription.startDate = new Date(subscription.current_period_start * 1000);
    }
    
    if (subscription.current_period_end) {
      user.subscription.endDate = new Date(subscription.current_period_end * 1000);
    }
    
    user.subscription.cancelAtPeriodEnd = subscription.cancel_at_period_end || false;
    
    await user.save();
    
    console.log('✅ Subscription updated:', user.email, '| Plan:', plan, '| Status:', subscription.status);
  } catch (error) {
    console.error('Error in handleSubscriptionUpdate:', error);
  }
}

async function handleSubscriptionCancellation(subscription) {
  try {
    const user = await User.findOne({ 
      'subscription.stripeSubscriptionId': subscription.id 
    });
    
    if (!user) {
      console.log('⚠️  User not found for subscription:', subscription.id);
      return;
    }
    
    console.log('🚫 Cancelling subscription for user:', user.email);
    
    user.subscription.status = 'cancelled';
    user.subscription.plan = 'free';
    
    await user.save();
    
    console.log('✅ Subscription cancelled:', user.email);
  } catch (error) {
    console.error('Error in handleSubscriptionCancellation:', error);
  }
}

async function handlePaymentSuccess(invoice) {
  try {
    const user = await User.findOne({ 
      'subscription.stripeCustomerId': invoice.customer 
    });
    
    if (!user) {
      console.log('⚠️  User not found for customer:', invoice.customer);
      return;
    }
    
    console.log('💳 Payment succeeded for user:', user.email);
    
    user.subscription.status = 'active';
    await user.save();
    
    console.log('✅ Payment processed:', user.email);
  } catch (error) {
    console.error('Error in handlePaymentSuccess:', error);
  }
}

async function handlePaymentFailure(invoice) {
  try {
    const user = await User.findOne({ 
      'subscription.stripeCustomerId': invoice.customer 
    });
    
    if (!user) {
      console.log('⚠️  User not found for customer:', invoice.customer);
      return;
    }
    
    console.log('❌ Payment failed for user:', user.email);
    
    user.subscription.status = 'past_due';
    await user.save();
    
    console.log('⚠️  User marked as past_due:', user.email);
  } catch (error) {
    console.error('Error in handlePaymentFailure:', error);
  }
}

module.exports = router;


// Backup of previous version:
// const express = require('express');
// const router = express.Router();
// const User = require('../models/User');
// const auth = require('../middleware/auth');

// // Get current subscription info
// router.get('/', auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id);
    
//     res.json({
//       subscription: user.subscription,
//       usage: user.usage,
//       limits: getPlanLimits(user.subscription.plan)
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Upgrade/Change plan
// router.post('/upgrade', auth, async (req, res) => {
//   try {
//     const { plan } = req.body; // 'starter' or 'pro'
    
//     if (!['starter', 'pro'].includes(plan)) {
//       return res.status(400).json({ message: 'Invalid plan' });
//     }

//     const user = await User.findById(req.user._id);
    
//     // In production, integrate with Stripe here
//     // For now, just update the plan
//     user.subscription.plan = plan;
//     user.subscription.status = 'active';
//     user.subscription.startDate = new Date();
//     user.subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
//     await user.save();
    
//     res.json({ 
//       message: 'Plan upgraded successfully',
//       subscription: user.subscription 
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Cancel subscription
// router.post('/cancel', auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id);
    
//     user.subscription.status = 'cancelled';
//     await user.save();
    
//     res.json({ message: 'Subscription cancelled' });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Helper function
// function getPlanLimits(plan) {
//   const limits = {
//     free: { daily: 5, monthly: null, name: 'Free' },
//     starter: { daily: null, monthly: 50, name: 'Starter' },
//     pro: { daily: null, monthly: null, name: 'Pro' }
//   };
//   return limits[plan];
// }

// module.exports = router;