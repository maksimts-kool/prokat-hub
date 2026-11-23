import { useTranslation } from 'react-i18next'
import { useFormat } from '@/i18n/format'

/** Formats a rental's days: "24 Nov 2026 – 30 Nov 2026", or one date for a one-day rental. */
export function useDateRange() {
  const { t } = useTranslation()
  const { formatDate } = useFormat()
  return (from: string, to: string) =>
    from === to
      ? formatDate(from)
      : t('catalogue.dateRange', { from: formatDate(from), to: formatDate(to) })
}
