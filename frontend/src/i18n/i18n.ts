import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import km from './locales/km.json';

export interface LanguageOption {
  code: string;
  nativeName: string;
  englishName: string;
}

// To add a language: import its locale JSON, add it to resources, and add one row here.
export const SUPPORTED_LANGUAGES: readonly LanguageOption[] = [
  { code: 'en', nativeName: 'English', englishName: 'English' },
  { code: 'km', nativeName: 'ខ្មែរ', englishName: 'Khmer' },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      km: { translation: km },
    },
    // The app's own UI is written in Khmer, so an undetected language should
    // land on Khmer rather than English (NAN-HR falls back the other way).
    fallbackLng: 'km',
    supportedLngs: SUPPORTED_LANGUAGES.map((lang) => lang.code),
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

export default i18n;
