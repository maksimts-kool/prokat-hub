import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { fallbackLanguage, languageCodes } from './languages'
import { en } from './locales/en'
import { et } from './locales/et'

/** localStorage key that remembers the language the user picked. */
export const LANGUAGE_STORAGE_KEY = 'prokat-hub.language'

// Keep <html lang> in step with the UI so screen readers, hyphenation and spell-check use it.
// Registered before init, which emits the first languageChanged event.
i18n.on('languageChanged', () => {
  document.documentElement.lang = i18n.resolvedLanguage ?? fallbackLanguage
})

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      et: { translation: et },
    },
    supportedLngs: languageCodes,
    fallbackLng: fallbackLanguage,
    // Translations are bundled, so initialise synchronously and render the first frame translated.
    initAsync: false,
    detection: {
      // A saved choice wins, then the browser language.
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
      // "et-EE" -> "et", so regional browser settings match a supported language.
      convertDetectedLanguage: (lng) => lng.split('-')[0].toLowerCase(),
    },
    interpolation: {
      // React escapes rendered strings already.
      escapeValue: false,
    },
  })

export default i18n
