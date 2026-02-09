// src/components/Navbar.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Moon, Sparkles, LogOut, Zap } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggle';

const Navbar = () => {
  const { user, logoutUser } = useAuth();
  const location = useLocation();

  // Don't show navbar on landing page or auth pages - they have their own
  const hideNavbar = location.pathname === '/' || 
                     location.pathname === '/login' || 
                     location.pathname === '/register';

  // If navbar should be hidden, return null
  if (hideNavbar) {
    return null;
  }

  // Only show this navbar when user is authenticated and not on landing/auth pages
  if (!user) {
    return null;
  }

  return (
    <nav className="w-full bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950 border-b-2 border-indigo-500/30 dark:border-indigo-400/20 shadow-2xl sticky top-0 z-50 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Moon className="w-10 h-10 text-white drop-shadow-lg" />
            <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              LunarBid
              <span className="text-xs font-normal text-indigo-300 bg-indigo-500/20 px-2 py-1 rounded-full border border-indigo-400/30">
                AI
              </span>
            </h1>
            <p className="text-xs text-indigo-200 font-medium">Create winning proposals with AI</p>
          </div>
        </div>

        {/* User Section */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-white font-medium">
              Welcome, <span className="font-bold">{user.name}</span>
            </span>
          </div>

          {/* Dark Mode Toggle */}
          <DarkModeToggle />

          <button
            onClick={logoutUser}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-red-500 transform hover:scale-105 active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;