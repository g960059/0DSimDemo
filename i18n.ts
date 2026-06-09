import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslation from "./locales/en/translation.json";
import jaTranslation from "./locales/ja/translation.json";
import {
  detectPreferredLocale,
  FALLBACK_LOCALE,
  localePrefixFromPathname,
  SUPPORTED_LOCALES,
} from "./localeRouting";

const initialLocale = typeof window === "undefined"
  ? detectPreferredLocale()
  : localePrefixFromPathname(window.location.pathname) ?? detectPreferredLocale();

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      ja: { translation: jaTranslation },
    },
    lng: initialLocale,
    fallbackLng: FALLBACK_LOCALE,
    supportedLngs: SUPPORTED_LOCALES,
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });

export default i18n;
