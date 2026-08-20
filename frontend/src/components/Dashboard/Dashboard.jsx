import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, FileText, Zap, Users, BarChart3, Palette, User, Crown, Calculator } from 'lucide-react';
import ProposalForm from './ProposalForm';
import ProposalHistory from './ProposalHistory';
import ClientProfiles from './ClientProfiles';
import Analytics from './Analytics';
import Branding from './Branding';
import ProfileSetup from './ProfileSetup';
import Subscription from './Subscription';
import PricingCalculator from './PricingCalculator';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext.jsx';

const Dashboard = () => {
  const location = useLocation();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('generate');
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [editingProposal, setEditingProposal] = useState(null);
  const [userPlan, setUserPlan] = useState('free');
  const [subscriptionRefresh, setSubscriptionRefresh] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch subscription on mount and when subscriptionRefresh changes
  useEffect(() => {
    fetchSubscription();
  }, [subscriptionRefresh]);

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subscription', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('📦 Subscription loaded:', data.subscription.plan);
      setUserPlan(data.subscription.plan);
    } catch (error) {
      console.error('❌ Error fetching subscription:', error);
    }
  };

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  // Dashboard menu items
  const dashboardMenuItems = [
    { id: 'generate', label: t('dashboard.navigation.generate'), icon: Sparkles },
    { id: 'history', label: t('dashboard.navigation.history'), icon: FileText },
    { id: 'clients', label: t('dashboard.navigation.clients'), icon: Users },
    { id: 'analytics', label: t('dashboard.navigation.analytics'), icon: BarChart3 },
    { id: 'calculator', label: t('dashboard.navigation.calculator'), icon: Calculator },
    { id: 'branding', label: t('dashboard.navigation.branding'), icon: Palette },
    { id: 'profile', label: t('dashboard.navigation.profile'), icon: User },
    { id: 'subscription', label: t('dashboard.navigation.subscription'), icon: Crown },
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (tabId !== 'generate') {
      setEditingProposal(null);
    }
  };


  // Check if user has access to specific features
  const hasFeatureAccess = (feature) => {
    const features = {
      free: {
        tones: ['formal', 'friendly'], // Basic tones only
        templates: 'basic',
        clientProfiles: false,
        analytics: false,
        branding: false,
        priorityAI: false
      },
      starter: {
        tones: ['formal', 'friendly', 'persuasive'], // All tones
        templates: 'basic',
        clientProfiles: true,
        analytics: false,
        branding: false,
        priorityAI: false
      },
      pro: {
        tones: ['formal', 'friendly', 'persuasive'], // All tones
        templates: 'advanced',
        clientProfiles: true,
        analytics: true,
        branding: true,
        priorityAI: true
      },
      agency: {
        tones: ['formal', 'friendly', 'persuasive'], // All tones
        templates: 'advanced',
        clientProfiles: true,
        analytics: true,
        branding: true, // White-label
        priorityAI: true
      }
    };
    
    return features[userPlan]?.[feature] || false;
  };

  const handleEditProposal = (proposal) => {
    setEditingProposal({
      jobTitle: proposal.jobTitle,
      jobDescription: proposal.jobDescription,
      clientName: proposal.clientName || '',
      budget: proposal.budget || '',
      tone: proposal.tone || 'friendly',
      originalId: proposal._id
    });
    setActiveTab('generate');
  };

  const handleDuplicateProposal = (proposal) => {
    setEditingProposal({
      jobTitle: `${proposal.jobTitle} (Copy)`,
      jobDescription: proposal.jobDescription,
      clientName: proposal.clientName || '',
      budget: proposal.budget || '',
      tone: proposal.tone || 'friendly',
      isDuplicate: true
    });
    setActiveTab('generate');
  };

  const handleProposalGenerated = () => {
    setRefreshHistory(prev => prev + 1);
    setEditingProposal(null);
  };

  const handleSubscriptionChange = () => {
    console.log('🔄 Subscription changed, refreshing...');
    setSubscriptionRefresh(prev => prev + 1);
  };

  return (
    <div className={`relative min-h-screen w-full overflow-x-hidden transition-colors duration-500 ${darkMode ? 'bg-[#0b1020] text-slate-200' : 'bg-gradient-to-b from-white via-indigo-50/40 to-white text-slate-900'}`}>
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse bg-brand-500/10" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse delay-1000 bg-violet-500/10" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full blur-3xl animate-pulse delay-500 bg-accent-400/10" />
      </div>

      {/* Main Content Container */}
      <div className="relative flex justify-center items-start py-10 px-4">
        <div className={`w-full max-w-7xl rounded-3xl shadow-2xl backdrop-blur-2xl border transition-colors duration-500 ${darkMode ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-indigo-100'}`}>
          
          
          {/* Dashboard Layout */}
          <div className="flex flex-col md:flex-row">
            {/* Left Menu */}
            <aside className={`w-full md:w-64 border-b md:border-b-0 md:border-r transition-colors duration-500 ${darkMode ? 'border-slate-700' : 'border-indigo-100'}`}>
              {/* User Info */}
              <div className={`p-6 border-b transition-colors duration-500 ${darkMode ? 'border-slate-700' : 'border-indigo-100'}`}>
                <div>
                  <h2 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{user?.name}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{user?.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      Plan: <span className="capitalize ml-1 font-bold">{userPlan}</span>
                    </div>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      darkMode ? 'bg-emerald-900/40 border-emerald-700' : 'bg-emerald-50 border-emerald-200'
                    }`}>
                      <Zap className={darkMode ? 'w-3 h-3 text-emerald-400 animate-pulse' : 'w-3 h-3 text-emerald-600 animate-pulse'} />
                      <span className={darkMode ? 'text-emerald-300' : 'text-emerald-700'}>
                        {t('dashboard.navigation.aiReady')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Menu — horizontal scroll on mobile, vertical on desktop */}
              <nav className="p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible custom-scrollbar">
                {dashboardMenuItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`
                        flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative group cursor-pointer whitespace-nowrap
                        ${active 
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105' 
                          : darkMode 
                            ? 'text-slate-300 hover:bg-slate-800 hover:text-white' 
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="truncate text-left">{item.label}</span>
                      
                      {/* Active indicator */}
                      {active && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Content Area */}
            <main className="flex-1 p-6 md:p-8">
              {/* ✅ THEMED Edit/Duplicate Banner */}
              {editingProposal && activeTab === 'generate' && (
                <div className={`rounded-xl p-5 flex items-center justify-between mb-6 border-2 transition-colors duration-300 ${
                  editingProposal.isDuplicate
                    ? darkMode 
                      ? 'bg-blue-900/20 border-blue-700' 
                      : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                    : darkMode
                      ? 'bg-purple-900/20 border-purple-700'
                      : 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {editingProposal.isDuplicate ? (
                      <>
                        <Sparkles className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        <div>
                          <p className={`font-bold ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                            Duplicating Proposal
                          </p>
                          <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                            Modify details below and generate a new proposal
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <FileText className={`w-6 h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                        <div>
                          <p className={`font-bold ${darkMode ? 'text-purple-300' : 'text-purple-900'}`}>
                            Editing Proposal
                          </p>
                          <p className={`text-sm ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                            Make your changes and regenerate
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => setEditingProposal(null)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all duration-200 ${
                      darkMode 
                        ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700' 
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Content */}
              <div className="transition-colors duration-500">
                {activeTab === 'generate' && (
                  <ProposalForm 
                    onProposalGenerated={handleProposalGenerated} 
                    editingProposal={editingProposal}
                    userPlan={userPlan}
                    hasFeatureAccess={hasFeatureAccess}
                  />
                )}
                {activeTab === 'history' && (
                  <ProposalHistory 
                    refreshTrigger={refreshHistory} 
                    onEditProposal={handleEditProposal}
                    onDuplicateProposal={handleDuplicateProposal}
                  />
                )}
                {activeTab === 'clients' && <ClientProfiles />}
                {activeTab === 'analytics' && <Analytics />}
                {activeTab === 'calculator' && <PricingCalculator />}
                {activeTab === 'branding' && <Branding />}
                {activeTab === 'profile' && <ProfileSetup />}
                {activeTab === 'subscription' && (
                  <Subscription onSubscriptionChange={handleSubscriptionChange} />
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
