import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all language resources
import enUS from './locales/en-US.json';
import zhCN from './locales/zh-CN.json';

// Define available languages
export const LANGUAGES = {
  'en-US': {
    label: 'English',
    flag: '🇺🇸',
    translation: enUS,
  },
  'zh-CN': {
    label: '简体中文',
    flag: '🇨🇳',
    translation: zhCN,
  },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

// Build resources object
const resources = Object.entries(LANGUAGES).reduce((acc, [code, lang]) => {
  (acc as any)[code] = { translation: lang.translation };
  return acc;
}, {} as Record<string, any>);

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en-US',
    debug: process.env.NODE_ENV === 'development',

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    interpolation: {
      escapeValue: false, // React already escapes values
      formatSeparator: ',',
    },

    react: {
      useSuspense: false,
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i'],
    },

    // Namespace configuration
    ns: ['translation'],
    defaultNS: 'translation',

    // Missing key handling
    saveMissing: process.env.NODE_ENV === 'development',
    saveMissingTo: 'current',
    missingKeyHandler: (lngs, _ns, key) => {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn(`Missing translation: ${key} for languages: ${lngs.join(', ')}`);
      }
    },

    // Language whitelist
    supportedLngs: Object.keys(LANGUAGES),
    nonExplicitSupportedLngs: false,
    cleanCode: true,

    // Load configuration: use explicit region codes (e.g., en-US)
    load: 'currentOnly',
    preload: Object.keys(LANGUAGES),
  });

// Helper functions
export const getCurrentLanguage = (): LanguageCode => {
  return i18n.language as LanguageCode;
};

export const changeLanguage = async (code: LanguageCode) => {
  try {
    await i18n.changeLanguage(code);
    localStorage.setItem('preferredLanguage', code);
    document.documentElement.lang = code;
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to change language:', error);
    return false;
  }
};

export const getLanguageLabel = (code: LanguageCode): string => {
  return LANGUAGES[code]?.label || code;
};

export const getLanguageFlag = (code: LanguageCode): string => {
  return LANGUAGES[code]?.flag || '🏳️';
};

// Auto-detect and set initial language
const initLanguage = () => {
  const savedLang = localStorage.getItem('preferredLanguage') as LanguageCode | null;
  if (savedLang && LANGUAGES[savedLang]) {
    i18n.changeLanguage(savedLang);
    document.documentElement.lang = savedLang;
  } else {
    const browserLang = navigator.language.toLowerCase();
    // Map browser language to our language codes
    let targetLang: LanguageCode = 'en-US';

    if (browserLang.includes('zh')) {
      targetLang = 'zh-CN';
    } else if (browserLang.includes('en')) {
      targetLang = 'en-US';
    }

    i18n.changeLanguage(targetLang);
    document.documentElement.lang = targetLang;
  }
};

initLanguage();

export default i18n;
