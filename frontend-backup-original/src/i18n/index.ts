import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from '../locales/en/common.json';
import enDashboard from '../locales/en/dashboard.json';
import enProfile from '../locales/en/profile.json';
import enAuth from '../locales/en/auth.json';

import esCommon from '../locales/es/common.json';
import esDashboard from '../locales/es/dashboard.json';
import esProfile from '../locales/es/profile.json';
import esAuth from '../locales/es/auth.json';

import frCommon from '../locales/fr/common.json';
import frProfile from '../locales/fr/profile.json';
import frAuth from '../locales/fr/auth.json';

import deCommon from '../locales/de/common.json';
import deAuth from '../locales/de/auth.json';

import itCommon from '../locales/it/common.json';
import itAuth from '../locales/it/auth.json';

import ptCommon from '../locales/pt/common.json';
import ptAuth from '../locales/pt/auth.json';

import zhCommon from '../locales/zh/common.json';

import ruCommon from '../locales/ru/common.json';
import ruAuth from '../locales/ru/auth.json';

import jaCommon from '../locales/ja/common.json';
import jaAuth from '../locales/ja/auth.json';

import koCommon from '../locales/ko/common.json';
import koAuth from '../locales/ko/auth.json';

import arCommon from '../locales/ar/common.json';
import arAuth from '../locales/ar/auth.json';

import hiCommon from '../locales/hi/common.json';
import hiAuth from '../locales/hi/auth.json';

import trCommon from '../locales/tr/common.json';
import trAuth from '../locales/tr/auth.json';

import plCommon from '../locales/pl/common.json';
import plAuth from '../locales/pl/auth.json';

import nlCommon from '../locales/nl/common.json';
import nlAuth from '../locales/nl/auth.json';

// Define supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español (Spanish)', flag: '🇪🇸' },
  { code: 'fr', name: 'Français (French)', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch (German)', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano (Italian)', flag: '🇮🇹' },
  { code: 'pt', name: 'Português (Portuguese)', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский (Russian)', flag: '🇷🇺' },
  { code: 'zh', name: '中文 (Chinese)', flag: '🇨🇳' },
  { code: 'ja', name: '日本語 (Japanese)', flag: '🇯🇵' },
  { code: 'ko', name: '한국어 (Korean)', flag: '🇰🇷' },
  { code: 'ar', name: 'العربية (Arabic)', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'tr', name: 'Türkçe (Turkish)', flag: '🇹🇷' },
  { code: 'pl', name: 'Polski (Polish)', flag: '🇵🇱' },
  { code: 'nl', name: 'Nederlands (Dutch)', flag: '🇳🇱' }
];

// Define translation resources
const resources = {
  en: {
    common: enCommon,
    dashboard: enDashboard,
    profile: enProfile,
    auth: enAuth
  },
  es: {
    common: esCommon,
    dashboard: esDashboard,
    profile: esProfile,
    auth: esAuth
  },
  fr: {
    common: frCommon,
    dashboard: enDashboard, // Fallback to English
    profile: frProfile,
    auth: frAuth
  },
  de: {
    common: deCommon,
    dashboard: enDashboard, // Fallback to English
    profile: enProfile, // Fallback to English
    auth: deAuth
  },
  it: {
    common: itCommon,
    dashboard: enDashboard, // Fallback to English
    profile: enProfile, // Fallback to English
    auth: itAuth
  },
  pt: {
    common: ptCommon,
    dashboard: enDashboard, // Fallback to English
    profile: enProfile, // Fallback to English
    auth: ptAuth
  },
  zh: {
    common: zhCommon,
    dashboard: enDashboard, // Fallback to English
    profile: enProfile, // Fallback to English
    auth: enAuth // Fallback to English
  },
  ru: {
    common: ruCommon,
    dashboard: enDashboard, // Fallback to English
    profile: enProfile, // Fallback to English
    auth: ruAuth
  },
  ja: {
    common: jaCommon,
    dashboard: enDashboard, // Fallback to English
    profile: enProfile, // Fallback to English
    auth: jaAuth
  },
  ko: {
    common: koCommon,
    dashboard: enDashboard, // Fallback to English
    profile: enProfile, // Fallback to English
    auth: koAuth
  },
  ar: {
    common: arCommon,
    dashboard: enDashboard, // Fallback to English
    profile: enProfile, // Fallback to English
    auth: arAuth
  },
  hi: {
    common: hiCommon,
    dashboard: enDashboard, // Fallback to English
    profile: enProfile, // Fallback to English
    auth: hiAuth
  },
  tr: {
    common: trCommon,
    dashboard: enDashboard, // Fallback to English
    profile: enProfile, // Fallback to English
    auth: trAuth
  },
  pl: {
    common: plCommon,
    dashboard: enDashboard, // Fallback to English
    profile: enProfile, // Fallback to English
    auth: plAuth
  },
  nl: {
    common: nlCommon,
    dashboard: enDashboard, // Fallback to English
    profile: enProfile, // Fallback to English
    auth: nlAuth
  }
};

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'dashboard', 'profile', 'auth'],
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },
    
    interpolation: {
      escapeValue: false // React already escapes values
    },
    
    react: {
      useSuspense: false
    }
  });

export default i18n;