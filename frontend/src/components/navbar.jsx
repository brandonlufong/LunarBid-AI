// src/components/Navbar.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Moon, Sparkles, LogOut, Zap, Menu, User, X, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggle';
import LanguageSelector from './UI/LanguageSelector';
import { useLanguage } from '../locales/LanguageContext.jsx';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { user, logoutUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { darkMode } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Toggle sidebar function for dashboard
  const toggleDashboardSidebar = () => {
    // Dispatch custom event to toggle sidebar
    window.dispatchEvent(new CustomEvent('toggleDashboardSidebar'));
  };

  // Don't show navbar on landing page or auth pages - they have their own
  const hideNavbar = location.pathname === '/' || 
                     location.pathname === '/login' || 
                     location.pathname === '/register' ||
                     location.pathname === '/forgot-password' ||
                     location.pathname === '/reset-password' ||
                     location.pathname === '/terms-of-service' ||
                     location.pathname === '/privacy-policy' ||
                     location.pathname === '/about' ||
                     location.pathname === '/contact' ||
                     location.pathname === '/blog' ||
                     location.pathname === '/faq' ||
                     location.pathname === '/pricing' ||
                     location.pathname === '/testimonials' ||
                     location.pathname === '/features' ||
                     location.pathname === '/integrations';

  // Only show this navbar when user is authenticated and not on landing/auth pages
  if (hideNavbar || !user) {
    return null;
  }

  // Dashboard menu items
  const dashboardMenuItems = [
    { id: 'generate', label: t('dashboard.navigation.generate'), icon: '📝' },
    { id: 'history', label: t('dashboard.navigation.history'), icon: '📄' },
    { id: 'clients', label: t('dashboard.navigation.clients'), icon: '👥' },
    { id: 'analytics', label: t('dashboard.navigation.analytics'), icon: '📊' },
    { id: 'calculator', label: t('dashboard.navigation.calculator'), icon: '🧮' },
    { id: 'branding', label: t('dashboard.navigation.branding'), icon: '🎨' },
    { id: 'profile', label: t('dashboard.navigation.profile'), icon: '👤' },
    { id: 'subscription', label: t('dashboard.navigation.subscription'), icon: '💎' },
  ];

  const handleDashboardMenuClick = (tabId) => {
    navigate('/dashboard', { state: { tab: tabId } });
    setShowProfileMenu(false);
  };

  return (
    <nav className="w-full border-b shadow-lg sticky top-0 z-50 bg-[#0b1020]/90 backdrop-blur-xl border-white/10">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3.5 flex items-center justify-between">

        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
              <Moon className="w-6 h-6 text-white" />
            </div>
            <Sparkles className="w-4 h-4 text-accent-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              LunarBid
              <span className="text-xs font-semibold text-brand-200 bg-brand-500/20 px-2 py-0.5 rounded-full border border-brand-400/30">
                AI
              </span>
            </h1>
            <p className="hidden sm:block text-xs text-brand-200 font-medium">{t('dashboard.navigation.tagline')}</p>
          </div>
        </div>

        {/* User Section */}
        <div className="flex items-center gap-4">
          {/* Dashboard Text */}
          <button
            onClick={() => navigate('/dashboard')}
            className={`text-sm font-medium transition-colors duration-200 cursor-pointer ${
              location.pathname === '/dashboard'
                ? 'text-indigo-300'
                : darkMode ? 'text-white/80 hover:text-white' : 'text-white/80 hover:text-white'
            }`}
          >
            {t('dashboard.navigation.dashboardLink')}
          </button>

          {/* Profile Icon with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                showProfileMenu ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950' : ''
              } bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg hover:shadow-xl`}
            >
              {user?.name?.charAt(0) || 'U'}
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <>
                {/* Overlay */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowProfileMenu(false)}
                />
                
                {/* Menu */}
                <div className={`absolute top-full right-0 mt-2 w-72 rounded-xl shadow-2xl border z-50 overflow-hidden transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-slate-800 border-slate-700' 
                    : 'bg-white border-slate-200'
                }`}>
                  {/* User Info */}
                  <div className={`p-4 border-b ${
                    darkMode ? 'border-slate-700' : 'border-slate-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br from-indigo-500 to-purple-600">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className={`font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{user?.name}</p>
                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Language</span>
                      <LanguageSelector />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Theme</span>
                      <DarkModeToggle />
                    </div>
                  </div>

                  {/* Logout */}
                  <div className={`p-4 border-t ${
                    darkMode ? 'border-slate-700' : 'border-slate-200'
                  }`}>
                    <button
                      onClick={() => {
                        logoutUser();
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-red-500 transform hover:scale-105 active:scale-95"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;