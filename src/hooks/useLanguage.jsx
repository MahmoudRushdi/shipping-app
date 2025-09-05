import { useState, useEffect, createContext, useContext } from 'react';
import { t, tWithVars } from '../translations/translations';

// Create Language Context
const LanguageContext = createContext();

// Custom hook for using language
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Language Provider
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get saved language from localStorage or use English as default
    return localStorage.getItem('language') || 'en';
  });

  // Save language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('language', language);
    
    // Change page direction based on language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Add/remove language class
    document.documentElement.classList.remove('rtl', 'ltr');
    document.documentElement.classList.add(language === 'ar' ? 'rtl' : 'ltr');
    
  }, [language]);

  // Function to change language
  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
  };

  // Translation function
  const translate = (key, vars = {}) => {
    if (Object.keys(vars).length > 0) {
      return tWithVars(key, vars, language);
    }
    return t(key, language);
  };

  // Short translation function
  const tr = (key, vars = {}) => {
    return translate(key, vars);
  };

  const value = {
    language,
    changeLanguage,
    translate,
    tr,
    isRTL: language === 'ar',
    isLTR: language === 'en'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Helper hook for quick translation
export const useTranslation = () => {
  const { translate, tr, language } = useLanguage();
  return { t: translate, tr, language };
};
