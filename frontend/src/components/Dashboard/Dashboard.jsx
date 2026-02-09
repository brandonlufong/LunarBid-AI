import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, FileText, User, Moon, Zap, Crown, Users, BarChart3, Palette } from 'lucide-react';
import ProposalForm from './ProposalForm';
import ProposalHistory from './ProposalHistory';
import ProfileSetup from './ProfileSetup';
import Subscription from './Subscription';
import ClientProfiles from './ClientProfiles';
import Analytics from './Analytics';
import Branding from './Branding';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const location = useLocation();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('generate');
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [editingProposal, setEditingProposal] = useState(null);
  const [userPlan, setUserPlan] = useState('free');
  const [subscriptionRefresh, setSubscriptionRefresh] = useState(0);

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

  const PLANS = {
    FREE: "free",
    STARTER: "starter",
    PRO: "pro",
    AGENCY: "agency",
  };

  const PLAN_RULES = {
    free: {
      tabs: ["generate", "history", "profile", "subscription"],
      proposals: { daily: 5 },
      templates: "basic",
      tones: false,
      clients: false,
      analytics: false,
      branding: false,
      api: false,
      team: { enabled: false },
      support: "email",
      priorityAI: false,
    },

    starter: {
      tabs: ["generate", "history", "clients", "profile", "subscription"],
      proposals: { monthly: 50 },
      templates: "basic",
      tones: true,
      clients: true,
      analytics: false,
      branding: false,
      api: false,
      team: { enabled: false },
      support: "standard",
      priorityAI: false,
    },

    pro: {
      tabs: ["generate", "history", "clients", "analytics", "branding", "profile", "subscription"],
      proposals: { unlimited: true },
      templates: "advanced",
      tones: true,
      clients: true,
      analytics: true,
      branding: true,
      api: false,
      team: { enabled: false },
      support: "priority",
      priorityAI: true,
    },

    agency: {
      tabs: ["generate", "history", "clients", "analytics", "branding", "profile", "subscription"],
      proposals: { unlimited: true },
      templates: "advanced",
      tones: true,
      clients: true,
      analytics: true,
      branding: "white-label",
      api: true,
      team: { enabled: true, members: 5 },
      support: "dedicated",
      priorityAI: true,
    },
  };

  // Tab configuration - FIXED with correct access levels
  const tabs = [
    { 
      id: 'generate', 
      label: 'Generate', 
      icon: Sparkles,
      requiresPlan: 'free'  // Available to everyone
    },
    { 
      id: 'history', 
      label: 'History', 
      icon: FileText,
      requiresPlan: 'free'  // Available to everyone
    },
    { 
      id: 'clients', 
      label: 'Clients', 
      icon: Users,
      requiresPlan: 'starter',  // Requires Starter or higher
      badge: 'Starter+'
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: BarChart3,
      requiresPlan: 'pro',  // Requires Pro or higher
      badge: 'Pro+'
    },
    { 
      id: 'branding', 
      label: 'Branding', 
      icon: Palette,
      requiresPlan: 'pro',  // Requires Pro or higher
      badge: 'Pro+'
    },
    { 
      id: 'profile', 
      label: 'Profile', 
      icon: User,
      requiresPlan: 'free'  // Available to everyone
    },
    { 
      id: 'subscription', 
      label: 'Subscription', 
      icon: Crown,
      requiresPlan: 'free'  // Available to everyone
    }
  ];

  // FIXED: Proper plan hierarchy check
  const hasAccessToTab = (tab) => {
    const planHierarchy = {
      free: 0,
      starter: 1,
      pro: 2,
      agency: 3
    };
    
    const userLevel = planHierarchy[userPlan] || 0;
    const requiredLevel = planHierarchy[tab.requiresPlan] || 0;
    
    // User has access if their plan level is >= required level
    return userLevel >= requiredLevel;
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

  const handleTabClick = (tab) => {
    // Check if user has access
    if (!hasAccessToTab(tab)) {
      // Redirect to subscription page if locked
      setActiveTab('subscription');
      return;
    }
    
    setActiveTab(tab.id);
    if (tab.id !== 'generate') {
      setEditingProposal(null);
    }
  };

  // Handler for when subscription changes
  const handleSubscriptionChange = () => {
    console.log('🔄 Subscription changed, refreshing...');
    setSubscriptionRefresh(prev => prev + 1);
  };

  return (
    <div className={`min-h-screen w-full relative overflow-hidden transition-colors duration-500 ${darkMode ? 'bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-slate-200' : 'bg-gradient-to-br from-indigo-50 via-white to-blue-50 text-slate-900'}`}>
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse ${darkMode ? 'bg-indigo-400/10' : 'bg-indigo-500/10'}`} />
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse delay-1000 ${darkMode ? 'bg-purple-400/10' : 'bg-purple-500/10'}`} />
        <div className={`absolute top-1/2 left-1/2 w-64 h-64 rounded-full blur-3xl animate-pulse delay-500 ${darkMode ? 'bg-blue-400/10' : 'bg-blue-500/10'}`} />
      </div>

      <div className="relative flex justify-center items-start py-10 px-4">
        <div className={`w-full max-w-7xl rounded-3xl shadow-2xl flex flex-col gap-8 px-6 md:px-12 py-10 backdrop-blur-2xl border transition-colors duration-500 ${darkMode ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-indigo-100'}`}>
          
          {/* Header */}
          <header className={`flex flex-col md:flex-row items-center md:justify-between gap-6 pb-6 border-b transition-colors duration-500 ${darkMode ? 'border-slate-700' : 'border-indigo-100'}`}>
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
              </div>
            </div>

            {/* AI Badge & Plan Indicator */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-sm border transition-colors duration-500 ${darkMode ? 'bg-emerald-900/40 border-emerald-700' : 'bg-emerald-50 border-emerald-200'}`}>
                <Zap className={darkMode ? 'w-4 h-4 text-emerald-400 animate-pulse' : 'w-4 h-4 text-emerald-600 animate-pulse'} />
                <span className={darkMode ? 'text-emerald-300 font-semibold text-sm' : 'text-emerald-700 font-semibold text-sm'}>
                  AI Ready
                </span>
              </div>
              
              {/* Plan Badge with color coding */}
              <div className={`px-4 py-2.5 rounded-full font-bold text-sm capitalize ${
                userPlan === 'agency' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' :
                userPlan === 'pro' ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white' :
                userPlan === 'starter' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' :
                darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
              }`}>
                {userPlan} Plan
              </div>
            </div>
          </header>

          {/* Tabs Navigation */}
          <nav className="flex justify-center overflow-x-auto">
            <div className={`flex gap-2 p-2 rounded-2xl shadow-inner transition-colors duration-500 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                const hasAccess = hasAccessToTab(tab);

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab)}
                    className={`relative flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                      active 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105' 
                        : darkMode 
                          ? 'text-slate-300 hover:bg-slate-700' 
                          : 'text-slate-600 hover:bg-white/60'
                    } ${!hasAccess ? 'opacity-60' : ''}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    
                    {/* Badge for locked features */}
                    {!hasAccess && tab.badge && (
                      <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-slate-900 text-xs font-black rounded-full">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Edit/Duplicate Banner */}
          {editingProposal && activeTab === 'generate' && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {editingProposal.isDuplicate ? (
                  <>
                    <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-bold text-blue-900 dark:text-blue-200">Duplicating Proposal</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Modify the details below and generate a new proposal</p>
                    </div>
                  </>
                ) : (
                  <>
                    <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <p className="font-bold text-indigo-900 dark:text-indigo-200">Editing Proposal</p>
                      <p className="text-sm text-indigo-700 dark:text-indigo-300">Make your changes and regenerate</p>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => setEditingProposal(null)}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          {/* Content */}
          <main className="w-full transition-colors duration-500">
            {activeTab === 'generate' && (
              <ProposalForm 
                onProposalGenerated={handleProposalGenerated} 
                editingProposal={editingProposal}
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
            {activeTab === 'branding' && <Branding />}
            {activeTab === 'profile' && <ProfileSetup />}
            {activeTab === 'subscription' && (
              <Subscription onSubscriptionChange={handleSubscriptionChange} />
            )}
          </main>

          {/* Footer */}
          <footer className={`pt-6 border-t text-center transition-colors duration-500 ${darkMode ? 'border-slate-700 text-slate-400' : 'border-indigo-100 text-slate-500'}`}>
            <p>
              Powered by <span className={darkMode ? 'text-indigo-400 font-semibold' : 'text-indigo-600 font-semibold'}>LunarBid AI</span>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

// Backup of previous version:
// import React, { useState, useEffect } from 'react';
// import { useLocation } from 'react-router-dom';
// import { Sparkles, FileText, User, Moon, Zap, Crown } from 'lucide-react';
// import ProposalForm from './ProposalForm';
// import ProposalHistory from './ProposalHistory';
// import ProfileSetup from './ProfileSetup';
// import Subscription from './Subscription';
// import { useTheme } from '../../context/ThemeContext'; // for dark mode

// const Dashboard = () => {
//   const location = useLocation();

//   const initialTab = location.state?.tab || 'generate';
//   const { darkMode } = useTheme(); // get current theme
//   const [activeTab, setActiveTab] = useState('generate');
//   const [refreshHistory, setRefreshHistory] = useState(0);
//   const [editingProposal, setEditingProposal] = useState(null);

//   // Update tab when location state changes
//   useEffect(() => {
//     if (location.state?.tab) {
//       setActiveTab(location.state.tab);
//     }
//   }, [location.state]);

//   const tabs = [
//     { id: 'generate', label: 'Generate Proposal', icon: Sparkles },
//     { id: 'history', label: 'Proposal History', icon: FileText },
//     { id: 'profile', label: 'Profile Settings', icon: User },
//     { id: 'subscription', label: 'Subscription', icon: Crown }
//   ];

//   // Handle editing a proposal - switches to generate tab with pre-filled data
//   const handleEditProposal = (proposal) => {
//     setEditingProposal({
//       jobTitle: proposal.jobTitle,
//       jobDescription: proposal.jobDescription,
//       clientName: proposal.clientName || '',
//       budget: proposal.budget || '',
//       tone: proposal.tone || 'friendly',
//       originalId: proposal._id
//     });
//     setActiveTab('generate');
//   };

//   // Handle duplicating a proposal - switches to generate tab with pre-filled data
//   const handleDuplicateProposal = (proposal) => {
//     setEditingProposal({
//       jobTitle: `${proposal.jobTitle} (Copy)`,
//       jobDescription: proposal.jobDescription,
//       clientName: proposal.clientName || '',
//       budget: proposal.budget || '',
//       tone: proposal.tone || 'friendly',
//       isDuplicate: true
//     });
//     setActiveTab('generate');
//   };

//   // Clear editing state when proposal is generated
//   const handleProposalGenerated = () => {
//     setRefreshHistory(prev => prev + 1);
//     setEditingProposal(null);
//   };

//   return (
//     <div
//       className={`
//         min-h-screen w-full relative overflow-hidden
//         transition-colors duration-500
//         ${darkMode 
//           ? 'bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-slate-200' 
//           : 'bg-gradient-to-br from-indigo-50 via-white to-blue-50 text-slate-900'
//         }
//       `}
//     >
//       {/* Animated background */}
//       <div className="absolute inset-0 pointer-events-none">
//         <div
//           className={`
//             absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse
//             ${darkMode ? 'bg-indigo-400/10' : 'bg-indigo-500/10'}
//           `}
//         />
//         <div
//           className={`
//             absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse delay-1000
//             ${darkMode ? 'bg-purple-400/10' : 'bg-purple-500/10'}
//           `}
//         />
//         <div
//           className={`
//             absolute top-1/2 left-1/2 w-64 h-64 rounded-full blur-3xl animate-pulse delay-500
//             ${darkMode ? 'bg-blue-400/10' : 'bg-blue-500/10'}
//           `}
//         />
//       </div>

//       <div className="relative flex justify-center items-start py-10 px-4">
//         <div
//           className={`
//             w-full max-w-7xl rounded-3xl shadow-2xl flex flex-col gap-8 px-6 md:px-12 py-10
//             backdrop-blur-2xl border transition-colors duration-500
//             ${darkMode 
//               ? 'bg-slate-900/95 border-slate-700' 
//               : 'bg-white/95 border-indigo-100'
//             }
//           `}
//         >
//           {/* Header */}
//           <header className={`
//             flex flex-col md:flex-row items-center md:justify-between gap-6 pb-6 border-b transition-colors duration-500
//             ${darkMode ? 'border-slate-700' : 'border-indigo-100'}
//           `}>
//             <div className="flex items-center gap-4">
//               {/* <div className="relative">
//                 <Moon className={darkMode ? 'w-12 h-12 text-indigo-400' : 'w-12 h-12 text-indigo-600'} />
//                 <Sparkles className="w-5 h-5 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
//               </div> */}
//               <div>
//                 <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
//                   Dashboard
//                 </h1>

//                 {/* <p className={darkMode ? 'text-slate-400 font-medium mt-1' : 'text-slate-500 font-medium mt-1'}>
//                   Win more clients with AI-powered proposals
//                 </p> */}
//               </div>
//             </div>

//             {/* AI Badge */}
//             <div className={`
//               flex items-center gap-2 px-4 py-2.5 rounded-full shadow-sm border transition-colors duration-500
//               ${darkMode 
//                 ? 'bg-emerald-900/40 border-emerald-700' 
//                 : 'bg-emerald-50 border-emerald-200'
//               }
//             `}>
//               <Zap className={darkMode ? 'w-4 h-4 text-emerald-400 animate-pulse' : 'w-4 h-4 text-emerald-600 animate-pulse'} />
//               <span className={darkMode ? 'text-emerald-300 font-semibold text-sm' : 'text-emerald-700 font-semibold text-sm'}>
//                 AI Ready
//               </span>
//             </div>
//           </header>

//           {/* Tabs */}
//           <nav className="flex justify-center">
//             <div className={`
//               flex gap-2 p-2 rounded-2xl shadow-inner transition-colors duration-500
//               ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}
//             `}>
//               {tabs.map((tab) => {
//                 const Icon = tab.icon;
//                 const active = activeTab === tab.id;

//                 return (
//                   <button
//                     key={tab.id}
//                     onClick={() => { 
//                       setActiveTab(tab.id);
//                       // Clear editing state when switching tabs
//                       if (tab.id !== 'generate') {
//                         setEditingProposal(null);
//                       }
//                     }}
//                     className={`
//                       flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold
//                       transition-all duration-300
//                       ${active 
//                         ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105' 
//                         : darkMode 
//                           ? 'text-slate-300 hover:bg-slate-700' 
//                           : 'text-slate-600 hover:bg-white/60'
//                       }
//                     `}
//                   >
//                     <Icon className="w-5 h-5" />
//                     <span className="hidden sm:inline">{tab.label}</span>
//                   </button>
//                 );
//               })}
//             </div>
//           </nav>

//           {/* Edit/Duplicate Banner */}
//           {editingProposal && activeTab === 'generate' && (
//             <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 {editingProposal.isDuplicate ? (
//                   <>
//                     <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
//                     <div>
//                       <p className="font-bold text-blue-900 dark:text-blue-200">Duplicating Proposal</p>
//                       <p className="text-sm text-blue-700 dark:text-blue-300">Modify the details below and generate a new proposal</p>
//                     </div>
//                   </>
//                 ) : (
//                   <>
//                     <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
//                     <div>
//                       <p className="font-bold text-indigo-900 dark:text-indigo-200">Editing Proposal</p>
//                       <p className="text-sm text-indigo-700 dark:text-indigo-300">Make your changes and regenerate</p>
//                     </div>
//                   </>
//                 )}
//               </div>
//               <button
//                 onClick={() => setEditingProposal(null)}
//                 className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
//               >
//                 Clear
//               </button>
//             </div>
//           )}

//           {/* Content */}
//           <main className="w-full transition-colors duration-500">
//             {activeTab === 'generate' && (
//               <ProposalForm 
//                 onProposalGenerated={() => handleProposalGenerated &&(setRefreshHistory(p => p + 1))} 
//                 editingProposal={editingProposal}
//               />
//             )}
//             {activeTab === 'history' && (
//               <ProposalHistory 
//                 refreshTrigger={refreshHistory} 
//                 onEditProposal={handleEditProposal}
//                 onDuplicateProposal={handleDuplicateProposal}
//               />
//             )}
//             {activeTab === 'profile' && <ProfileSetup />}
//             {activeTab === 'subscription' && <Subscription />}
//           </main>

//           {/* Footer */}
//           <footer className={`
//             pt-6 border-t text-center transition-colors duration-500
//             ${darkMode ? 'border-slate-700 text-slate-400' : 'border-indigo-100 text-slate-500'}
//           `}>
//             <p>
//               Powered by <span className={darkMode ? 'text-indigo-400 font-semibold' : 'text-indigo-600 font-semibold'}>Moon Solutions</span>
//             </p>
//           </footer>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;
