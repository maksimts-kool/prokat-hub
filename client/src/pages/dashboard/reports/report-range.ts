import { format, startOfMonth, startOfYear, subDays, subMonths, endOfMonth } from 'date-fns'

/** The ranges offered as one click; `custom` uses the `from` and `to` in the URL. */
export const rangePresets = [
  'thisMonth',
  'lastMonth',
  'last90',
  'thisYear',
  'all',
  'custom',
] as const
export type RangePreset = (typeof rangePresets)[number]

export const DEFAULT_PRESET: RangePreset = 'thisYear'

export function isPreset(value: string | null): value is RangePreset {
  return rangePresets.includes(value as RangePreset)
}

const iso = (date: Date) => format(date, 'yyyy-MM-dd')

/** A `yyyy-MM-dd` from the URL, or nothing for a missing or malformed one. */
export function dateParam(value: string | null): string | undefined {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined
}

/**
 * The start days a preset covers, both inclusive; `{}` for all time. Ranges that reach today stop at
 * today, so bookings that start later don't count yet.
 */
export function presetRange(preset: Exclude<RangePreset, 'custom'>, today = new Date()) {
  switch (preset) {
    case 'thisMonth':
      return { from: iso(startOfMonth(today)), to: iso(today) }
    case 'lastMonth': {
      const last = subMonths(today, 1)
      return { from: iso(startOfMonth(last)), to: iso(endOfMonth(last)) }
    }
    case 'last90':
      return { from: iso(subDays(today, 89)), to: iso(today) }
    case 'thisYear':
      return { from: iso(startOfYear(today)), to: iso(today) }
    case 'all':
      return {}
  }
}
