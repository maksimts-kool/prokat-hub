import 'i18next'
import type { en } from './locales/en'

// Types t() against the English resources: unknown keys are compile errors and keys autocomplete.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof en
    }
  }
}
