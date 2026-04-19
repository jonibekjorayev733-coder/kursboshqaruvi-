import React, { useContext, createContext, useState, ReactNode } from 'react';
import { uz } from '@/locales/uz';

type Language = 'en' | 'uz';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }): React.ReactNode {
  const [language, setLanguage] = useState<Language>('uz');

  const t = (path: string): string => {
    const keys = path.split('.');
    let value: any = uz;

    for (const key of keys) {
      value = value?.[key];
      if (!value) return path; // Fallback to path if key not found
    }

    return typeof value === 'string' ? value : path;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
