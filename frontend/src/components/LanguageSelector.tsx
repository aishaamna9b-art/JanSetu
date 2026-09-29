import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

export const LanguageSelector: React.FC<{ className?: string }> = ({ className }) => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('jan_setu_lang', lng);
  };

  return (
    <div className={cn("flex space-x-2", className)}>
      <button 
        onClick={() => changeLanguage('en')}
        className={cn("px-3 py-1 rounded-full border border-gray-300 text-sm font-medium", i18n.language === 'en' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700')}
      >
        English
      </button>
      <button 
        onClick={() => changeLanguage('hi')}
        className={cn("px-3 py-1 rounded-full border border-gray-300 text-sm font-medium", i18n.language === 'hi' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700')}
      >
        हिंदी
      </button>
      <button 
        onClick={() => changeLanguage('ta')}
        className={cn("px-3 py-1 rounded-full border border-gray-300 text-sm font-medium", i18n.language === 'ta' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700')}
      >
        தமிழ்
      </button>
    </div>
  );
};
