import { useQueryClient } from '@tanstack/react-query'
import { differenceInCalendarDays } from 'date-fns'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { apiErrorMessage } from '@/api/error-message'
import { getGetApiItemsIdAvailabilityQueryKey } from '@/api/generated/items/items'
import {
  getGetApiRentalsMyQueryKey,
  getGetApiRentalsOverdueQueryKey,
  getGetApiRentalsQueryKey,
  usePatchApiRentalsIdStatus,
  usePostApiRentalsIdMarkLate,
} from '@/api/generated/rentals/rentals'
import { isApiError } from '@/api/http-client'
import { errorsShownInline } from '@/api/query-client'
import { FormAlert } from '@/components/form-alert'
import { useDateRange } from '@/components/rentals/use-date-range'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useFormat } from '@/i18n/format'
import { cn } from '@/lib/utils'
import type { DeskAction } from '@/pages/dashboard/desk/desk-actions'

/** The longest note the status history keeps (`ChangeRentalStatusRequest.note`). */
const NOTE_MAX = 500

/** Every list a status change can move a rental in or out of. */
function useRefreshAfterChange() {
  const queryClient = useQueryClient()
  return (itemId: number) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetApiRentalsQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetApiRentalsOverdueQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetApiRentalsMyQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetApiItemsIdAvailabilityQueryKey(itemId) }),
    ])
}

/**
 * Confirms one desk action and sends it: Issue and Receive with `PATCH /api/rentals/{id}/status`
 * (with an optional note for the status history), Mark late with `POST /api/rentals/{id}/mark-late`.
 * The text says what the action costs the customer before staff confirm it.
 */
export function DeskActionDialog({
  action,
  today,
  onClose,
}: {
  action: DeskAction | null
  today: string
  onClose: () => void
}) {
  return (
    <AlertDialog open={action !== null} onOpenChange={(open) => !open && onClose()}>
      {/* Keyed by rental and action, so the note and any error start empty each time. */}
      {action && (
        <DialogBody
          key={`${action.kind}-${action.rental.id}`}
          action={action}
          today={today}
          onClose={onClose}
        />
      )}
    </AlertDialog>
  )
}

function DialogBody({
  action: { kind, rental },
  today,
  onClose,
}: {
  action: DeskAction
  today: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { formatPrice, formatDate } = useFormat()
  const range = useDateRange()
  const refresh = useRefreshAfterChange()
  const changeStatus = usePatchApiRentalsIdStatus({ mutation: { meta: errorsShownInline } })
  const markLate = usePostApiRentalsIdMarkLate({ mutation: { meta: errorsShownInline } })
  const [note, setNote] = useState('')
  const noteId = useId()

  const pending = changeStatus.isPending || markLate.isPending
  const error = changeStatus.error ?? markLate.error
  const lateDays = Math.max(0, differenceInCalendarDays(today, rental.endDate))
  const lateTotal = formatPrice(lateDays * rental.lateFeePerDay)

  const text = {
    issue: {
      title: t('desk.confirm.issueTitle', { item: rental.itemName }),
      body: t('desk.confirm.issueText', {
        customer: rental.customerFullName,
        dates: range(rental.startDate, rental.endDate),
        deposit: formatPrice(rental.deposit),
      }),
      button: t('desk.actions.issue'),
    },
    receive: {
      title: t('desk.confirm.receiveTitle', { item: rental.itemName }),
      body:
        lateDays > 0
          ? t('desk.confirm.receiveLate', {
              customer: rental.customerFullName,
              count: lateDays,
              perDay: formatPrice(rental.lateFeePerDay),
              total: lateTotal,
            })
          : t('desk.confirm.receiveText', {
              customer: rental.customerFullName,
              deposit: formatPrice(rental.deposit),
            }),
      button: t('desk.actions.receive'),
    },
    markLate: {
      title: t('desk.confirm.markLateTitle', { item: rental.itemName }),
      body: t('desk.confirm.markLateText', {
        date: formatDate(rental.endDate),
        count: lateDays,
        perDay: formatPrice(rental.lateFeePerDay),
        total: lateTotal,
      }),
      button: t('desk.actions.markLate'),
    },
  }[kind]

  const success = {
    issue: t('desk.done.issued', { item: rental.itemName, customer: rental.customerFullName }),
    receive: t('desk.done.received', { item: rental.itemName }),
    markLate: t('desk.done.markedLate', { item: rental.itemName }),
  }[kind]

  const callbacks = {
    onSuccess: () => {
      toast.success(success)
      onClose()
    },
    onError: (failure: unknown) => {
      // Someone else changed it meanwhile: show the list as it is now.
      if (isApiError(failure) && failure.status === 409) void refresh(rental.itemId)
    },
    onSettled: () => refresh(rental.itemId),
  }

  function confirm() {
    if (pending) return
    if (kind === 'markLate') {
      markLate.mutate({ id: rental.id }, callbacks)
    } else {
      changeStatus.mutate(
        {
          id: rental.id,
          data: {
            status: kind === 'issue' ? 'Issued' : 'Returned',
            note: note.trim() || null,
          },
        },
        callbacks,
      )
    }
  }

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{text.title}</AlertDialogTitle>
        <AlertDialogDescription>{text.body}</AlertDialogDescription>
      </AlertDialogHeader>

      {kind !== 'markLate' && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={noteId}>{t('desk.confirm.note')}</Label>
          <textarea
            id={noteId}
            value={note}
            maxLength={NOTE_MAX}
            rows={2}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t(
              kind === 'issue'
                ? 'desk.confirm.issuePlaceholder'
                : 'desk.confirm.receivePlaceholder',
            )}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      )}

      {error && (
        <FormAlert>
          {isApiError(error) && error.status === 409
            ? t('desk.errors.conflict')
            : apiErrorMessage(error)}
        </FormAlert>
      )}

      <AlertDialogFooter>
        <AlertDialogCancel disabled={pending}>{t('desk.confirm.back')}</AlertDialogCancel>
        {/* A plain button, not AlertDialogAction: the dialog stays open until the request is done. */}
        <Button
          size="lg"
          className={cn(
            'px-4',
            kind === 'markLate' &&
              'bg-destructive text-destructive-foreground hover:bg-[color-mix(in_oklch,var(--destructive),var(--foreground)_14%)]',
          )}
          disabled={pending}
          onClick={confirm}
        >
          {pending ? t('desk.confirm.saving') : text.button}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  )
}
