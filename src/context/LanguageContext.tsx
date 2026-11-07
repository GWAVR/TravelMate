import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, TranslationKey, translations, SUPPORTED_LANGUAGES, LanguageOption } from '../i18n/translations';

const STORAGE_KEY = 'travelmate_language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  isHindi: boolean;
  supportedLanguages: LanguageOption[];
  currentLanguageOption: LanguageOption;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'hi' || saved === 'en') {
        return saved;
      }
      // Check user preferences in browser
      const navLang = navigator.language?.toLowerCase();
      if (navLang?.startsWith('hi')) {
        return 'hi';
      }
    } catch {
      // Fallback to English
    }
    return 'en';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
      document.documentElement.lang = language;
    } catch (e) {
      console.warn('Could not persist language to localStorage', e);
    }
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'en' ? 'hi' : 'en'));
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const langDict = translations[language] || translations.en;
      let text = (langDict as Record<string, string>)[key] || translations.en[key] || key;

      if (params) {
        Object.entries(params).forEach(([paramKey, paramVal]) => {
          text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
        });
      }

      return text;
    },
    [language]
  );

  const currentLanguageOption =
    SUPPORTED_LANGUAGES.find((opt) => opt.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        isHindi: language === 'hi',
        supportedLanguages: SUPPORTED_LANGUAGES,
        currentLanguageOption,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

const fallbackContext: LanguageContextType = {
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: TranslationKey, params?: Record<string, string | number>) => {
    let text = (translations.en as Record<string, string>)[key] || key;
    if (params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      });
    }
    return text;
  },
  isHindi: false,
  supportedLanguages: SUPPORTED_LANGUAGES,
  currentLanguageOption: SUPPORTED_LANGUAGES[0],
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  return context || fallbackContext;
}
