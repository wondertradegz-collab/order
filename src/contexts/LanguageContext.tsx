import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type Language, translations, t as translate, getTranslation } from '../i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  translations: typeof translations;
  getT: <T>(obj: T) => any;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = 'invoice-app-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['ja', 'zh', 'en'].includes(saved)) {
      return saved as Language;
    }
    // Detect browser language
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('zh')) return 'zh';
    if (browserLang.startsWith('en')) return 'en';
    return 'ja'; // Default to Japanese
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    // Update document lang attribute
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string) => translate(key, language);

  const getT = <T,>(obj: T) => getTranslation(obj, language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translations, getT }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
