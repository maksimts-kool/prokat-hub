import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { TFunction } from 'i18next'
import { z } from 'zod'
import { MAX_DAYS, todayIso } from '@/pages/catalogue/catalogue-filters'

/**
 * The dates of a booking (`POST /api/rentals`), checked before they are sent: both days given, the
 * end not before the start, no past days and at most {@link MAX_DAYS} days. The same rules as
 * `CreateRentalRequestValidator` and `RentalDateRange.EnsureBookable` on the server.
 */
export function bookingSchema(t: TFunction, today = todayIso()) {
  const day = z.iso.date(t('item.booking.validation.required'))

  return z
    .object({ from: day, to: day })
    .refine((dates) => dates.from >= today, {
      path: ['from'],
      message: t('item.booking.validation.past'),
    })
    .refine((dates) => dates.to >= dates.from, {
      path: ['to'],
      message: t('item.booking.validation.endBeforeStart'),
    })
    .refine(
      (dates) =>
        dates.to < dates.from ||
        differenceInCalendarDays(parseISO(dates.to), parseISO(dates.from)) + 1 <= MAX_DAYS,
      { path: ['to'], message: t('item.booking.validation.tooLong', { count: MAX_DAYS }) },
    )
}

export type BookingDates = z.infer<ReturnType<typeof bookingSchema>>

/** The first problem with `dates`, or undefined when they can be booked. */
export function bookingDatesError(
  t: TFunction,
  dates: { from?: string; to?: string },
  today = todayIso(),
): string | undefined {
  const result = bookingSchema(t, today).safeParse(dates)
  return result.success ? undefined : result.error.issues[0]?.message
}
