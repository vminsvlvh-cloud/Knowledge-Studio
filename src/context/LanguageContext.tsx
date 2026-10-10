import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations } from '../utils/i18n';

interface LanguageContextType {
  lang: Language;
  dir: 'ltr' | 'rtl';
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY_LANG = 'synapse_language_v1';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANG);
      if (saved === 'en' || saved === 'ar') return saved;
    } catch (e) {
      console.error('Failed to read language preference', e);
    }
    // Default to 'ar' since the user requested Arabic language
    return 'ar';
  });

  const dir: 'ltr' | 'rtl' = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LANG, lang);
    } catch (e) {
      console.error('Failed to save language preference', e);
    }

    // Sync HTML document direction and lang attribute
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
    if (dir === 'rtl') {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }, [lang, dir]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
  };

  const toggleLang = () => {
    setLangState((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const t = translations[lang] || translations.en;

  return (
    <LanguageContext.Provider value={{ lang, dir, setLang, toggleLang, t }}>
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
