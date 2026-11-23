import {
  useGetApiRentals,
  useGetApiRentalsMy,
  useGetApiRentalsOverdue,
} from '@/api/generated/rentals/rentals'
import { byDate, inGroup, isLate, todayIso } from '@/lib/rentals'

/**
 * The customer's rentals (`GET /api/rentals/my`) split the way the dashboard shows them. The band,
 * the overview and My rentals share the one request through the query cache.
 */
export function useCustomerRentals() {
  const query = useGetApiRentalsMy()
  const rentals = query.data ?? []
  const today = todayIso()

  // A Booked rental whose last day has passed was never picked up: it is no longer coming.
  const upcoming = byDate(
    rentals.filter((r) => r.status === 'Booked' && r.endDate >= today),
    (r) => r.startDate,
  )
  const withYou = byDate(
    rentals.filter((r) => inGroup(r.status, 'active')),
    (r) => r.endDate,
  )
  const late = withYou.filter((r) => isLate(r, today))

  return { query, rentals, upcoming, withYou, late, today }
}

/** Enough rows for a day at a small shop; the desk (#31) pages through the rest. */
const PAGE_SIZE = 100

/**
 * What the desk needs today: Booked rentals that cover today (pickups), Issued rentals (out now,
 * soonest return first) and the overdue list (`GET /api/rentals/overdue`, oldest end date first).
 */
export function useStaffToday() {
  const today = todayIso()
  const pickups = useGetApiRentals({
    Status: ['Booked'],
    From: today,
    To: today,
    PageSize: PAGE_SIZE,
  })
  const out = useGetApiRentals({ Status: ['Issued'], PageSize: PAGE_SIZE })
  const overdue = useGetApiRentalsOverdue()

  return {
    today,
    pickups,
    out,
    overdue,
    pickupRows: byDate(pickups.data?.items ?? [], (r) => r.startDate),
    // Late Issued rentals show in the overdue list until the worker marks them.
    outRows: byDate(
      (out.data?.items ?? []).filter((r) => !isLate(r, today)),
      (r) => r.endDate,
    ),
    overdueRows: overdue.data ?? [],
  }
}
