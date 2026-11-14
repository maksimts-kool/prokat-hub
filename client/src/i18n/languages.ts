import type { Locale } from 'date-fns'
import { enGB, et } from 'date-fns/locale'

/** Languages the UI is translated into. English is the fallback. */
export const languages = [
  { code: 'en', short: 'EN', name: 'English', intl: 'en-GB', dateFns: enGB },
  { code: 'et', short: 'ET', name: 'Eesti', intl: 'et-EE', dateFns: et },
] as const satisfies readonly {
  code: string
  short: string
  /** Name of the language in that language, so people can find their own. */
  name: string
  /** BCP 47 tag for `Intl` formatters. */
  intl: string
  dateFns: Locale
}[]

export type Language = (typeof languages)[number]
export type LanguageCode = Language['code']

export const fallbackLanguage: LanguageCode = 'en'

export const languageCodes: LanguageCode[] = languages.map((language) => language.code)

/** Looks up a supported language, falling back to English for anything else. */
export function getLanguage(code: string | undefined): Language {
  return languages.find((language) => language.code === code) ?? languages[0]
}
