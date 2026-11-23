import { differenceInCalendarDays, format } from 'date-fns'
import type { RentalStatus } from '@/api/generated/model'

/** Today as `yyyy-MM-dd` in the browser's time zone, the format the API uses for rental days. */
export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/** How the rental lists group statuses: what is coming, what is out now, and what is over. */
export const rentalGroups = {
  upcoming: ['Booked'],
  active: ['Issued', 'Overdue'],
  past: ['Returned', 'Cancelled'],
} as const satisfies Record<string, readonly RentalStatus[]>

export type RentalGroup = keyof typeof rentalGroups

export function inGroup(status: RentalStatus, group: RentalGroup): boolean {
  return (rentalGroups[group] as readonly RentalStatus[]).includes(status)
}

/**
 * Whether a rental is out past its end date. The worker marks such rentals Overdue once an hour,
 * so an Issued rental can be late before its status says so.
 */
export function isLate(rental: { status: RentalStatus; endDate: string }, today = todayIso()) {
  return inGroup(rental.status, 'active') && rental.endDate < today
}

/** Whole days since the end date, for a late rental; 0 otherwise. */
export function daysLate(rental: { status: RentalStatus; endDate: string }, today = todayIso()) {
  return isLate(rental, today) ? differenceInCalendarDays(today, rental.endDate) : 0
}

/** Sorts by a date field, earliest first, without changing the input. */
export function byDate<T>(rows: readonly T[], date: (row: T) => string): T[] {
  return [...rows].sort((a, b) => date(a).localeCompare(date(b)))
}
