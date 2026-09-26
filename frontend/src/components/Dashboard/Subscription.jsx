import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSubscription, createCheckout, openBillingPortal } from '../../services/api';
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
  const [activating, setActivating] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const loadSubscription = async () => {
    try {
      const res = await getSubscription();
      setSubscriptionData(res.data);
      return res.data;
    } catch (error) {
      console.error('Error loading subscription');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkout = new URLSearchParams(location.search).get('checkout');
    loadSubscription().then((data) => {
      if (checkout === 'success') {
        // Stripe confirms payment through the webhook, usually within seconds.
        // Check a few times until the plan shows as active.
        setSuccessMessage(t('dashboard.subscription.checkoutSuccess'));
        if (data?.subscription?.plan === 'free') pollForActivation();
      } else if (checkout === 'cancelled') {
        toast.info(t('dashboard.subscription.checkoutCancelled'));
      }
      if (checkout) navigate('/dashboard?tab=subscription', { replace: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pollForActivation = async () => {
    setActivating(true);
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const data = await loadSubscription();
      if (data?.subscription?.plan !== 'free') {
        onSubscriptionChange?.();
        break;
      }
    }
    setActivating(false);
  };

  // Upgrade: redirect to Stripe Checkout. The plan changes only after Stripe confirms payment.
  const handleUpgrade = async (plan) => {
    setUpgrading(true);
    setSuccessMessage('');
    try {
      const res = await createCheckout(plan);
      window.location.assign(res.data.url);
    } catch (error) {
      toast.error(error.response?.data?.message || t('dashboard.subscription.checkoutError'));
      setUpgrading(false);
    }
  };

  // Manage billing: Stripe Customer Portal (change plan, cancel, invoices, payment method).
  const handleManageBilling = async () => {
    setUpgrading(true);
    try {
      const res = await openBillingPortal();
      window.location.assign(res.data.url);
    } catch (error) {
      toast.error(t('dashboard.subscription.portalError'));
      setUpgrading(false);
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

          {subscription.hasBillingAccount && (
            <button
              onClick={handleManageBilling}
              disabled={upgrading}
              className={`self-start sm:self-auto px-4 py-2 text-sm font-semibold border-2 rounded-lg transition-all disabled:opacity-60 ${
                darkMode
                  ? 'text-indigo-300 border-indigo-400 hover:bg-indigo-900/20'
                  : 'text-indigo-700 border-indigo-600 hover:bg-indigo-50'
              }`}
            >
              {t('dashboard.subscription.manageBilling')}
            </button>
          )}
        </div>

        {/* Payment and cancellation notices */}
        {subscription.paymentIssue && (
          <div role="alert" className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${darkMode ? 'border-amber-700 bg-amber-900/20 text-amber-200' : 'border-amber-300 bg-amber-50 text-amber-900'}`}>
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-sm">{t('dashboard.subscription.paymentIssue', { plan: subscription.subscribedPlan })}</p>
          </div>
        )}
        {activating && (
          <div role="status" className={`mb-6 flex items-center gap-3 rounded-xl border p-4 text-sm ${darkMode ? 'border-indigo-700 bg-indigo-900/20 text-indigo-200' : 'border-indigo-200 bg-indigo-50 text-indigo-900'}`}>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            {t('dashboard.subscription.activating')}
          </div>
        )}
        {subscription.cancelAtPeriodEnd && subscription.endDate && currentPlan !== 'free' && (
          <p className={`mb-6 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            {t('dashboard.subscription.endsOn', { date: new Date(subscription.endDate).toLocaleDateString() })}
          </p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`p-6 rounded-xl border-2 shadow-sm transition-colors duration-300 ${
            darkMode 
              ? 'bg-slate-700 border-indigo-600' 
              : 'bg-white border-indigo-200'
          }`}>
            <div className={`text-sm mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t('dashboard.subscription.currentPlan')}</div>
            <div className={`text-2xl font-bold capitalize flex items-center gap-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
              {currentPlan}
              {subscription.cancelAtPeriodEnd && currentPlan !== 'free' && (
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
                  onClick={() => !isCurrent && plan.id !== 'free' && plan.id !== 'agency' && handleUpgrade(plan.id)}
                  disabled={isCurrent || upgrading || plan.id === 'free' || plan.id === 'agency'}
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
                  {isCurrent ? t('dashboard.subscription.currentPlanBtn') : upgrading ? t('dashboard.subscription.processing') : plan.id === 'free' ? t('dashboard.subscription.freePlanBtn') : plan.id === 'agency' ? t('dashboard.subscription.comingSoon') : t('dashboard.subscription.upgradeNow')}
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