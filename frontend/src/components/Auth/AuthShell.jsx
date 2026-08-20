// Shared minimal auth layout (forgot/reset pages) — matches the redesigned palette.
import React from 'react';
import { Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import LanguageSelector from '../UI/LanguageSelector';
import DarkModeToggle from '../DarkModeToggle';

const AuthShell = ({ children }) => {
  const { darkMode } = useTheme();
  return (
    <div className={`min-h-screen relative flex items-center justify-center p-4 overflow-hidden transition-colors duration-500 ${
      darkMode ? 'bg-[#0b1020]' : 'bg-gradient-to-br from-white via-indigo-50/60 to-white'
    }`}>
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 sm:gap-3">
        <LanguageSelector />
        <DarkModeToggle />
      </div>
      <div className="absolute w-96 h-96 bg-brand-500/15 rounded-full blur-3xl -top-24 -left-24 pointer-events-none" />
      <div className="absolute w-80 h-80 bg-violet-600/15 rounded-full blur-3xl -bottom-24 -right-24 pointer-events-none" />

      <div className={`relative w-full max-w-md rounded-3xl border-2 shadow-2xl p-7 sm:p-8 ${
        darkMode ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-600/30 relative">
            <Moon className="w-6 h-6 text-white" />
            <Sparkles className="w-3.5 h-3.5 text-accent-400 absolute -top-1 -right-1" />
          </div>
          <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>LunarBid</span>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthShell;
