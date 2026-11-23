import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { apiErrorMessage } from '@/api/error-message'
import {
  getGetApiItemsIdAvailabilityQueryKey,
  getGetApiItemsQueryKey,
} from '@/api/generated/items/items'
import type { RentalDto } from '@/api/generated/model'
import {
  getGetApiRentalsMyQueryKey,
  usePatchApiRentalsIdStatus,
} from '@/api/generated/rentals/rentals'
import { isApiError } from '@/api/http-client'

/**
 * Cancels one of the customer's Booked rentals with `PATCH /api/rentals/{id}/status`. On success
 * the rental list, the item's booked days and the catalogue reload, since the days are free again.
 */
export function useCancelRental() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const mutation = usePatchApiRentalsIdStatus()

  function cancel(rental: RentalDto) {
    mutation.mutate(
      { id: rental.id, data: { status: 'Cancelled' } },
      {
        onSuccess: () => {
          toast.success(t('rentals.cancel.success', { item: rental.itemName }))
        },
        onError: (error) => {
          // 409: it was issued or cancelled meanwhile, so it can no longer be cancelled here.
          toast.error(
            isApiError(error) && error.status === 409
              ? t('rentals.cancel.conflict')
              : apiErrorMessage(error),
          )
        },
        onSettled: () =>
          Promise.all([
            queryClient.invalidateQueries({ queryKey: getGetApiRentalsMyQueryKey() }),
            queryClient.invalidateQueries({
              queryKey: getGetApiItemsIdAvailabilityQueryKey(rental.itemId),
            }),
            queryClient.invalidateQueries({ queryKey: getGetApiItemsQueryKey() }),
          ]),
      },
    )
  }

  return { cancel, pendingId: mutation.isPending ? mutation.variables?.id : undefined }
}
