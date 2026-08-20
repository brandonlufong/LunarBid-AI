import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from './en';
import { fr } from './fr';

// Available languages
export const LANGUAGES = {
  en: { name: 'English', code: 'en', flag: '🇺🇸' },
  fr: { name: 'Français', code: 'fr', flag: '🇫🇷' }
};

// Translation resources
export const TRANSLATIONS = {
  en,
  fr
};

// Language context
const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  // Get saved language from localStorage or default to English
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const saved = localStorage.getItem('lunarbid-language');
    return saved && Object.keys(LANGUAGES).includes(saved) ? saved : 'en';
  });

  // Translation function
  const t = (key, params = {}) => {
    const keys = key.split('.');
    let translation = TRANSLATIONS[currentLanguage];
    
    // Navigate through nested keys
    for (const k of keys) {
      translation = translation?.[k];
    }
    
    // If translation not found, try English as fallback
    if (!translation && currentLanguage !== 'en') {
      let fallback = TRANSLATIONS.en;
      for (const k of keys) {
        fallback = fallback?.[k];
      }
      translation = fallback;
    }
    
    // If still not found, return the key
    if (!translation) {
      return key;
    }
    
    // Replace parameters in translation
    let result = translation;
    Object.entries(params).forEach(([param, value]) => {
      result = result.replace(`{{${param}}}`, value);
    });
    
    return result;
  };

  // Change language
  const changeLanguage = (languageCode) => {
    if (Object.keys(LANGUAGES).includes(languageCode)) {
      setCurrentLanguage(languageCode);
      localStorage.setItem('lunarbid-language', languageCode);
      
      // Update document language attribute
      document.documentElement.lang = languageCode;
      
      // Update document direction (for future RTL languages)
      document.documentElement.dir = LANGUAGES[languageCode].direction || 'ltr';
    }
  };

  // Set initial language on mount
  useEffect(() => {
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = LANGUAGES[currentLanguage].direction || 'ltr';
  }, [currentLanguage]);

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    languages: LANGUAGES
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageProvider;
