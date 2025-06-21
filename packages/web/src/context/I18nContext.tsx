// Internationalization context for FAMAPP
import { createContext, useEffect, useState, ReactNode } from 'react';
import type { I18nContextType, Language, TranslationKeys } from '@famapp/shared';
import { en, es } from '../i18n/translations';

export const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

const translations: Record<Language, TranslationKeys> = {
  en,
  es,
};

export function I18nProvider({ children, defaultLanguage = 'en' }: I18nProviderProps) {
  const [language, setLanguage] = useState<Language>(defaultLanguage);

  // Load saved language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('famapp-language') as Language;
    if (savedLanguage && ['en', 'es'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else {
      // Try to detect browser language
      const browserLanguage = navigator.language.toLowerCase();
      if (browserLanguage.startsWith('es')) {
        setLanguage('es');
      }
    }
  }, []);

  // Update document language and save preference
  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('famapp-language', language);
  }, [language]);

  // Translation function with parameter interpolation
  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = translations[language][key as keyof TranslationKeys] || key;
    
    if (!params) {
      return translation;
    }

    // Replace {param} placeholders with actual values
    return Object.entries(params).reduce((str, [param, value]) => {
      return str.replace(new RegExp(`{${param}}`, 'g'), String(value));
    }, translation);
  };

  // Date formatting with locale support
  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    
    return new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-US', {
      ...defaultOptions,
      ...options,
    }).format(date);
  };

  // Time formatting with locale support
  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: language === 'en',
    }).format(date);
  };

  // Number formatting with locale support
  const formatNumber = (number: number): string => {
    return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US').format(number);
  };

  // Update language preference
  const updateLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  const value: I18nContextType = {
    language,
    setLanguage: updateLanguage,
    t,
    formatDate,
    formatTime,
    formatNumber,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}