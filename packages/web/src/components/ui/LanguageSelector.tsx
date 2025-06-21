// Language selector component for switching between ES/EN
import { useI18n } from '../../hooks/useI18n';
import { Button } from './Button';
import type { Language } from '../../types/i18n';

interface LanguageSelectorProps {
  variant?: 'button' | 'dropdown';
  className?: string;
}

export function LanguageSelector({ variant = 'button', className }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useI18n();

  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="input text-sm pr-8 appearance-none bg-white border border-gray-300 rounded-xl"
          aria-label={t('language.selectLanguage')}
        >
          <option value="en">{t('language.english')}</option>
          <option value="es">{t('language.spanish')}</option>
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  }

  // Toggle between languages
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  const getIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
    </svg>
  );

  const getLanguageLabel = () => {
    return language === 'en' ? 'English' : 'Español';
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className={className}
      aria-label={`${t('language.selectLanguage')}: ${getLanguageLabel()}`}
      title={`${t('language.selectLanguage')}: ${getLanguageLabel()}`}
    >
      {getIcon()}
      <span className="ml-2 hidden sm:inline">{getLanguageLabel()}</span>
    </Button>
  );
}