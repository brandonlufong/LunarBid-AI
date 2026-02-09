import React, { useState, useEffect } from 'react';
import { getSubscription, upgradePlan, cancelSubscription } from '../../services/api';
import { Crown, Zap, Check, TrendingUp, Loader2, X, CheckCircle, AlertTriangle, Building2 } from 'lucide-react';

const Subscription = ({ onSubscriptionChange }) => {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const res = await getSubscription();
      setSubscriptionData(res.data);
    } catch (error) {
      console.error('Error loading subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan) => {
    setUpgrading(true);
    setSuccessMessage('');
    
    try {
      await upgradePlan(plan);
      await loadSubscription();
      
      // ✅ FIXED: Call the callback to refresh parent Dashboard
      if (onSubscriptionChange) {
        console.log('🔄 Triggering subscription refresh in Dashboard');
        onSubscriptionChange();
      }
      
      setSuccessMessage(`🎉 Successfully upgraded to ${plan.toUpperCase()}! You now have access to all premium features.`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      alert('Upgrade failed. Please try again or contact support.');
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelSubscription();
      await loadSubscription();
      
      // ✅ FIXED: Call the callback to refresh parent Dashboard
      if (onSubscriptionChange) {
        onSubscriptionChange();
      }
      
      setSuccessMessage('❌ Subscription cancelled. You can continue using your current plan until the end of the billing period.');
      setShowCancelConfirm(false);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      alert('Cancellation failed. Please contact support.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const { subscription, usage, limits } = subscriptionData;
  const currentPlan = subscription.plan;

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        '5 proposals per day',
        'Basic templates',
        'Email support'
      ],
      icon: Zap,
      color: 'from-gray-500 to-gray-600',
      popular: false
    },
    {
      id: 'starter',
      name: 'Starter',
      price: '$12',
      period: 'per month',
      features: [
        '50 proposals per month',
        'Save client profiles',
        'All tones & styles',
        'Standard support'
      ],
      icon: TrendingUp,
      color: 'from-blue-500 to-indigo-600',
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$19',
      period: 'per month',
      features: [
        'Unlimited proposals',
        'Priority AI processing',
        'Advanced analytics',
        'Priority support',
        'Custom branding'
      ],
      icon: Crown,
      color: 'from-purple-500 to-pink-600',
      popular: true
    },
    {
      id: 'agency',
      name: 'Agency',
      price: '$49',
      period: 'per month',
      features: [
        'Everything in Pro',
        'Team collaboration',
        '5 team members',
        'White-label branding',
        'API access',
        'Dedicated support'
      ],
      icon: Building2,
      color: 'from-emerald-500 to-teal-600',
      popular: false
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-8 p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl flex items-start gap-3 animate-fade-in">
          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-green-900 dark:text-green-300 font-semibold">
              {successMessage}
            </p>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Current Plan & Usage */}
      <div className="bg-gradient-to-br from-white to-indigo-50/30 dark:from-slate-800 dark:to-indigo-900/30 rounded-2xl shadow-xl p-8 border-2 border-indigo-100 dark:border-indigo-800 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Your Subscription
          </h2>
          
          {currentPlan !== 'free' && subscription.status === 'active' && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 border-2 border-red-600 dark:border-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              Cancel Subscription
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white dark:bg-slate-700 rounded-xl border-2 border-indigo-200 dark:border-indigo-600 shadow-sm">
            <div className="text-sm text-slate-600 dark:text-slate-300 mb-1">Current Plan</div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 capitalize flex items-center gap-2">
              {currentPlan}
              {subscription.status === 'cancelled' && (
                <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded">
                  Cancelled
                </span>
              )}
            </div>
          </div>
          
          <div className="p-6 bg-white dark:bg-slate-700 rounded-xl border-2 border-purple-200 dark:border-purple-600 shadow-sm">
            <div className="text-sm text-slate-600 dark:text-slate-300 mb-1">Proposals Today</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {usage.proposalsToday} {limits.dailyProposals && `/ ${limits.dailyProposals}`}
            </div>
          </div>
          
          <div className="p-6 bg-white dark:bg-slate-700 rounded-xl border-2 border-pink-200 dark:border-pink-600 shadow-sm">
            <div className="text-sm text-slate-600 dark:text-slate-300 mb-1">This Month</div>
            <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
              {usage.proposalsThisMonth} {limits.monthlyProposals && `/ ${limits.monthlyProposals}`}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Cancel Subscription?</h3>
            </div>
            
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all flex items-center justify-center gap-2"
              >
                {upgrading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yes, Cancel'}
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                No, Keep Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Plans */}
      <div>
        <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Choose Your Plan</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = currentPlan === plan.id;
            
            return (
              <div
                key={plan.id}
                className={`relative p-8 rounded-2xl backdrop-blur-sm transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-2 border-yellow-400 scale-105 shadow-2xl'
                    : 'bg-white/5 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 hover:bg-white/10 dark:hover:bg-white/10'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-slate-900 font-bold text-sm rounded-full">
                    Most Popular
                  </div>
                )}
                
                <div className={`w-14 h-14 bg-gradient-to-br ${plan.color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold mb-2 dark:text-white">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-5xl font-black dark:text-white">{plan.price}</span>
                  <span className="text-slate-600 dark:text-slate-300 ml-2">/{plan.period}</span>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm dark:text-slate-200">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => !isCurrent && plan.id !== 'free' && handleUpgrade(plan.id)}
                  disabled={isCurrent || upgrading || plan.id === 'free'}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${
                    isCurrent
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : plan.popular
                      ? 'bg-white text-indigo-600 hover:bg-gray-100'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : upgrading ? 'Processing...' : plan.id === 'free' ? 'Free Plan' : plan.id === 'agency' ? 'Contact Sales' : 'Upgrade Now'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Subscription;