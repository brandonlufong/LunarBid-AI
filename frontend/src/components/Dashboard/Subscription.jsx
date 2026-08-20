import React, { useState, useEffect } from 'react';
import { getSubscription, upgradePlan, cancelSubscription } from '../../services/api';
import { Crown, Zap, Check, TrendingUp, Loader2, X, CheckCircle, AlertTriangle, Building2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../UI/Toast';
import { useLanguage } from '../../locales/LanguageContext.jsx';

const Subscription = ({ onSubscriptionChange }) => {
  const { darkMode } = useTheme();
  const toast = useToast();
  const { t } = useLanguage();
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
      
      if (onSubscriptionChange) {
        console.log('🔄 Triggering subscription refresh in Dashboard');
        onSubscriptionChange();
      }
      
      setSuccessMessage(t('dashboard.subscription.upgradeSuccess', { plan: plan.toUpperCase() }));
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      toast.error('Upgrade failed. Please try again or contact support.');
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelSubscription();
      await loadSubscription();
      
      if (onSubscriptionChange) {
        onSubscriptionChange();
      }
      
      setSuccessMessage(t('dashboard.subscription.cancelSuccess'));
      setShowCancelConfirm(false);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      toast.error('Cancellation failed. Please contact support.');
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
      period: t('dashboard.subscription.forever'),
      features: t('dashboard.subscription.features.free'),
      icon: Zap,
      color: 'from-gray-500 to-gray-600',
      popular: false
    },
    {
      id: 'starter',
      name: 'Starter',
      price: '$12',
      period: t('dashboard.subscription.perMonth'),
      features: t('dashboard.subscription.features.starter'),
      icon: TrendingUp,
      color: 'from-blue-500 to-indigo-600',
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$19',
      period: t('dashboard.subscription.perMonth'),
      features: t('dashboard.subscription.features.pro'),
      icon: Crown,
      color: 'from-purple-500 to-pink-600',
      popular: true
    },
    {
      id: 'agency',
      name: 'Agency',
      price: '$49',
      period: t('dashboard.subscription.perMonth'),
      features: t('dashboard.subscription.features.agency'),
      icon: Building2,
      color: 'from-emerald-500 to-teal-600',
      popular: false
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* ✅ THEMED Success Message */}
      {successMessage && (
        <div className={`mb-8 p-5 rounded-xl border-2 flex items-start gap-3 animate-fade-in transition-colors duration-300 ${
          darkMode 
            ? 'bg-green-900/20 border-green-700' 
            : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
        }`}>
          <CheckCircle className={`w-6 h-6 flex-shrink-0 mt-0.5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
          <div className="flex-1">
            <p className={`font-semibold ${darkMode ? 'text-green-300' : 'text-green-900'}`}>
              {successMessage}
            </p>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className={`transition-colors ${darkMode ? 'text-green-400 hover:text-green-200' : 'text-green-600 hover:text-green-800'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ✅ THEMED Current Plan & Usage Card */}
      <div className={`rounded-2xl shadow-xl p-8 border-2 mb-8 transition-colors duration-300 ${
        darkMode 
          ? 'bg-slate-800 border-indigo-800' 
          : 'bg-gradient-to-br from-white to-indigo-50/30 border-indigo-100'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {t('dashboard.subscription.yourSubscription')}
          </h2>

          {currentPlan !== 'free' && subscription.status === 'active' && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className={`self-start sm:self-auto px-4 py-2 text-sm font-semibold border-2 rounded-lg transition-all ${
                darkMode 
                  ? 'text-red-400 border-red-400 hover:bg-red-900/20' 
                  : 'text-red-600 border-red-600 hover:bg-red-50'
              }`}
            >
              {t('dashboard.subscription.cancelSubscription')}
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`p-6 rounded-xl border-2 shadow-sm transition-colors duration-300 ${
            darkMode 
              ? 'bg-slate-700 border-indigo-600' 
              : 'bg-white border-indigo-200'
          }`}>
            <div className={`text-sm mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t('dashboard.subscription.currentPlan')}</div>
            <div className={`text-2xl font-bold capitalize flex items-center gap-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
              {currentPlan}
              {subscription.status === 'cancelled' && (
                <span className={`text-xs px-2 py-1 rounded ${
                  darkMode 
                    ? 'bg-red-900/30 text-red-400' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {t('dashboard.subscription.cancelled')}
                </span>
              )}
            </div>
          </div>
          
          <div className={`p-6 rounded-xl border-2 shadow-sm transition-colors duration-300 ${
            darkMode 
              ? 'bg-slate-700 border-purple-600' 
              : 'bg-white border-purple-200'
          }`}>
            <div className={`text-sm mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t('dashboard.subscription.proposalsToday')}</div>
            <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
              {usage.proposalsToday} {limits.dailyProposals && `/ ${limits.dailyProposals}`}
            </div>
          </div>
          
          <div className={`p-6 rounded-xl border-2 shadow-sm transition-colors duration-300 ${
            darkMode 
              ? 'bg-slate-700 border-pink-600' 
              : 'bg-white border-pink-200'
          }`}>
            <div className={`text-sm mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t('dashboard.subscription.thisMonth')}</div>
            <div className={`text-2xl font-bold ${darkMode ? 'text-pink-400' : 'text-pink-600'}`}>
              {usage.proposalsThisMonth} {limits.monthlyProposals && `/ ${limits.monthlyProposals}`}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ THEMED Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-8 max-w-md w-full shadow-2xl transition-colors duration-300 ${
            darkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
              <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {t('dashboard.subscription.cancelTitle')}
              </h3>
            </div>
            
            <p className={`mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {t('dashboard.subscription.cancelBody')}
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all flex items-center justify-center gap-2"
              >
                {upgrading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('dashboard.subscription.yesCancel')}
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                className={`flex-1 px-4 py-2 border-2 rounded-lg font-semibold transition-all ${
                  darkMode 
                    ? 'border-slate-600 hover:bg-slate-700' 
                    : 'border-slate-300 hover:bg-slate-100'
                }`}
              >
                {t('dashboard.subscription.noKeep')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Plans */}
      <div>
        <h2 className={`text-3xl font-bold text-center mb-12 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          {t('dashboard.subscription.choosePlan')}
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = currentPlan === plan.id;
            
            return (
              <div
                key={plan.id}
                className={`relative p-8 rounded-2xl backdrop-blur-sm transition-all duration-300 border-2 ${
                  plan.popular
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-yellow-400 scale-105 shadow-2xl'
                    : darkMode
                      ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                      : 'bg-white/80 border-slate-200 hover:bg-white hover:shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-slate-900 font-bold text-sm rounded-full">
                    {t('dashboard.subscription.mostPopular')}
                  </div>
                )}
                
                <div className={`w-14 h-14 bg-gradient-to-br ${plan.color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className={`text-2xl font-bold mb-2 ${
                  plan.popular ? 'text-white' : darkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  {plan.name}
                </h3>
                
                <div className="mb-6">
                  <span className={`text-5xl font-black ${
                    plan.popular ? 'text-white' : darkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    {plan.price}
                  </span>
                  <span className={`ml-2 ${
                    plan.popular ? 'text-white/80' : darkMode ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    /{plan.period}
                  </span>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        plan.popular ? 'text-white' : 'text-green-400'
                      }`} />
                      <span className={`text-sm ${
                        plan.popular ? 'text-white' : darkMode ? 'text-slate-200' : 'text-slate-700'
                      }`}>
                        {feature}
                      </span>
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
                      : darkMode
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {isCurrent ? t('dashboard.subscription.currentPlanBtn') : upgrading ? t('dashboard.subscription.processing') : plan.id === 'free' ? t('dashboard.subscription.freePlanBtn') : plan.id === 'agency' ? t('dashboard.subscription.contactSales') : t('dashboard.subscription.upgradeNow')}
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