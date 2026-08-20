import React, { useState } from 'react';
import { useLanguage, LANGUAGES } from '../../locales/LanguageContext.jsx';
import { Globe, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const LanguageSelector = ({ className = '' }) => {
  const { currentLanguage, changeLanguage, t } = useLanguage();
  const { darkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const selectedLanguage = LANGUAGES[currentLanguage];

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-lg border transition-all duration-200 ${
          darkMode
            ? 'border-slate-700 bg-slate-800 hover:bg-slate-700'
            : 'border-slate-200 bg-white hover:bg-slate-50'
        }`}
        aria-label="Select language"
      >
        <Globe className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
        <span className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          <span>{selectedLanguage.flag}</span>
          <span className="hidden sm:inline"> {selectedLanguage.name}</span>
        </span>
        <ChevronDown className={`hidden sm:block w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${
          darkMode ? 'text-slate-400' : 'text-slate-600'
        }`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className={`absolute right-0 top-full mt-2 w-48 rounded-lg border shadow-lg z-20 transition-colors duration-300 ${
            darkMode
              ? 'bg-slate-800 border-slate-700'
              : 'bg-white border-slate-200'
          }`}>
            {Object.values(LANGUAGES).map((language) => (
              <button
                key={language.code}
                onClick={() => {
                  changeLanguage(language.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg ${
                  currentLanguage === language.code
                    ? darkMode
                      ? 'bg-brand-900/30 text-brand-300'
                      : 'bg-brand-50 text-brand-600'
                    : darkMode
                      ? 'text-slate-300 hover:bg-slate-700'
                      : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-lg">{language.flag}</span>
                <div>
                  <div className="font-medium">{language.name}</div>
                  <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {language.code === 'en' ? 'English' : language.code === 'fr' ? 'Français' : language.code.toUpperCase()}
                  </div>
                </div>
                {currentLanguage === language.code && (
                  <div className="ml-auto">
                    <div className={`w-2 h-2 rounded-full ${
                      darkMode ? 'bg-brand-400' : 'bg-brand-600'
                    }`}></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
