import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { apiErrorMessage } from '@/api/error-message'
import {
  getGetApiItemsIdAvailabilityQueryKey,
  getGetApiItemsQueryKey,
} from '@/api/generated/items/items'
import {
  getGetApiRentalsMyQueryKey,
  getGetApiRentalsQuoteQueryKey,
  usePostApiRentals,
} from '@/api/generated/rentals/rentals'
import { isApiError } from '@/api/http-client'
import { errorsShownInline } from '@/api/query-client'
import { useAuth } from '@/auth/auth-context'
import { authPath } from '@/auth/return-path'
import { pageRoles } from '@/auth/roles'
import { useFormat } from '@/i18n/format'
import { bookingDatesError } from '@/lib/booking-schema'

/**
 * Who may press Book: `customer` books, `guest` is sent to the login page first, `staff` (and
 * admins) cannot book from their account, and `loading` waits for the stored session to be checked.
 */
export type BookingAccess = 'customer' | 'guest' | 'staff' | 'loading'

/** Whether the current user may book, see {@link BookingAccess}. */
export function useBookingAccess(): BookingAccess {
  const { status, hasRole } = useAuth()
  if (status === 'loading') return 'loading'
  if (status === 'guest') return 'guest'
  return hasRole(...pageRoles.rentals) ? 'customer' : 'staff'
}

/**
 * Books an item for the chosen dates with `POST /api/rentals`. Guests go to the login page and come
 * back to the same dates. The dates are checked with Zod first; a 409 Conflict reloads the item's
 * booked days so the calendar shows what was taken. On success the user sees a toast and their rentals.
 */
export function useBookItem(itemId: number, itemName: string) {
  const { t } = useTranslation()
  const { formatDate } = useFormat()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const create = usePostApiRentals({ mutation: { meta: errorsShownInline } })
  const [validationError, setValidationError] = useState<string>()

  const access = useBookingAccess()

  /** Reloads the booked days and quotes of this item, e.g. after someone else took the dates. */
  function refreshAvailability() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetApiItemsIdAvailabilityQueryKey(itemId) }),
      queryClient.invalidateQueries({ queryKey: getGetApiRentalsQuoteQueryKey() }),
    ])
  }

  function book(dates: { from?: string; to?: string }) {
    if (access === 'guest') {
      // The item page keeps its dates in the URL, so the user comes back to the same choice.
      void navigate(authPath(location.pathname + location.search))
      return
    }
    if (access !== 'customer' || create.isPending) return

    const invalid = bookingDatesError(t, dates)
    setValidationError(invalid)
    if (invalid || !dates.from || !dates.to) return

    create.mutate(
      { data: { itemId, from: dates.from, to: dates.to } },
      {
        onSuccess: (rental) => {
          toast.success(t('item.booking.success', { item: itemName }), {
            description: t('catalogue.dateRange', {
              from: formatDate(rental.startDate),
              to: formatDate(rental.endDate),
            }),
          })
          void queryClient.invalidateQueries({ queryKey: getGetApiRentalsMyQueryKey() })
          // Search results by date and the popularity order both change with a new booking.
          void queryClient.invalidateQueries({ queryKey: getGetApiItemsQueryKey() })
          void refreshAvailability()
          void navigate('/dashboard/rentals')
        },
        onError: (error) => {
          if (isApiError(error) && error.status === 409) void refreshAvailability()
        },
      },
    )
  }

  /** Forgets the last attempt's error, e.g. when the user picks other dates. */
  function reset() {
    setValidationError(undefined)
    create.reset()
  }

  const conflict = isApiError(create.error) && create.error.status === 409
  const error = validationError ?? (create.error ? apiErrorMessage(create.error) : undefined)

  return { access, book, reset, pending: create.isPending, error, conflict }
}
