import { format as formatWithPattern } from 'date-fns'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getLanguage, type Language } from './languages'

const priceFormatters = new Map<string, Intl.NumberFormat>()

function priceFormatter(language: Language): Intl.NumberFormat {
  let formatter = priceFormatters.get(language.intl)
  if (!formatter) {
    formatter = new Intl.NumberFormat(language.intl, { style: 'currency', currency: 'EUR' })
    priceFormatters.set(language.intl, formatter)
  }
  return formatter
}

/** Formats a euro amount, e.g. "€1,234.50" in English and "1234,50 €" in Estonian. */
export function formatPrice(amount: number, languageCode?: string): string {
  return priceFormatter(getLanguage(languageCode)).format(amount)
}

/**
 * Formats a date with a date-fns pattern in the given language. The default `PP` is a
 * medium date: "14 Nov 2026" in English, "14. nov 2026" in Estonian.
 */
export function formatDate(
  date: Date | string | number,
  languageCode?: string,
  pattern = 'PP',
): string {
  return formatWithPattern(new Date(date), pattern, { locale: getLanguage(languageCode).dateFns })
}

/** Date and price formatters bound to the active UI language; re-render on language change. */
export function useFormat() {
  const { i18n } = useTranslation()
  const code = getLanguage(i18n.resolvedLanguage).code

  return useMemo(
    () => ({
      language: code,
      formatPrice: (amount: number) => formatPrice(amount, code),
      formatDate: (date: Date | string | number, pattern?: string) =>
        formatDate(date, code, pattern),
    }),
    [code],
  )
}
