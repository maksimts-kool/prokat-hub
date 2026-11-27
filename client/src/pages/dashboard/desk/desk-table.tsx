import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table'
import { Clock, PackageCheck, Undo2 } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { StaffRentalDto } from '@/api/generated/model'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { useFormat } from '@/i18n/format'
import { cn } from '@/lib/utils'
import { daysLate } from '@/lib/rentals'
import { type DeskAction, deskActions } from '@/pages/dashboard/desk/desk-actions'

const features = tableFeatures({})
const helper = createColumnHelper<typeof features, StaffRentalDto>()

/**
 * Text for the dates column, stable for a language and a day so the table's columns are too:
 * `range` leaves out this year so the table fits a tablet, `when` says when it starts or is due.
 */
function useDeskText(today: string) {
  const { t } = useTranslation()
  const { formatDate } = useFormat()

  return useMemo(() => {
    const year = today.slice(0, 4)
    const range = (from: string, to: string) => {
      const pattern = from.startsWith(year) && to.startsWith(year) ? 'd MMM' : 'PP'
      return from === to
        ? formatDate(from, pattern)
        : t('catalogue.dateRange', { from: formatDate(from, pattern), to: formatDate(to, pattern) })
    }

    const when = (rental: StaffRentalDto): { text: string; late: boolean } | undefined => {
      const late = daysLate(rental, today)
      if (late > 0) return { text: t('desk.when.late', { count: late }), late: true }
      if (rental.status === 'Booked') {
        if (rental.startDate === today) return { text: t('desk.when.startsToday'), late: false }
        if (rental.startDate > today)
          return {
            text: t('desk.when.startsOn', { date: formatDate(rental.startDate) }),
            late: false,
          }
        if (rental.endDate < today) return { text: t('desk.when.missed'), late: true }
      }
      if (rental.status === 'Issued' && rental.endDate === today)
        return { text: t('desk.when.dueToday'), late: false }
      return undefined
    }

    return { range, when }
  }, [t, formatDate, today])
}

function ActionButtons({
  rental,
  today,
  onAction,
  className,
}: {
  rental: StaffRentalDto
  today: string
  onAction: (action: DeskAction) => void
  className?: string
}) {
  const { t } = useTranslation()
  const actions = deskActions(rental, today)
  if (actions.length === 0) return null

  return (
    <div className={cn('flex flex-wrap justify-end gap-2', className)}>
      {actions.includes('issue') && (
        <Button size="lg" className="px-3" onClick={() => onAction({ kind: 'issue', rental })}>
          <PackageCheck aria-hidden />
          {t('desk.actions.issue')}
        </Button>
      )}
      {actions.includes('receive') && (
        <Button
          variant="outline"
          size="lg"
          className="px-3"
          onClick={() => onAction({ kind: 'receive', rental })}
        >
          <Undo2 aria-hidden />
          {t('desk.actions.receive')}
        </Button>
      )}
      {actions.includes('markLate') && (
        <Button
          size="lg"
          className="bg-destructive px-3 text-destructive-foreground hover:bg-[color-mix(in_oklch,var(--destructive),var(--foreground)_14%)]"
          onClick={() => onAction({ kind: 'markLate', rental })}
        >
          <Clock aria-hidden />
          {t('desk.actions.markLate')}
        </Button>
      )}
    </div>
  )
}

/**
 * The desk's rentals: a TanStack Table from md up (tablets and desktops) and one card per rental
 * on phones, both from the same row model. `onAction` opens the confirmation for a button.
 */
export function DeskTable({
  rows,
  today,
  onAction,
}: {
  rows: StaffRentalDto[]
  today: string
  onAction: (action: DeskAction) => void
}) {
  const { t } = useTranslation()
  const { formatPrice } = useFormat()
  const { range, when } = useDeskText(today)

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('itemName', {
          header: () => t('desk.columns.rental'),
          cell: ({ row }) => (
            <>
              <span className="block min-w-36 font-semibold">{row.original.itemName}</span>
              <span className="block text-xs text-muted-foreground tabular-nums">
                #{row.original.id}
              </span>
            </>
          ),
        }),
        helper.accessor('customerFullName', {
          header: () => t('desk.columns.customer'),
          cell: ({ row }) => (
            <>
              <span className="block font-medium">{row.original.customerFullName}</span>
              {row.original.customerEmail && (
                <span className="hidden max-w-48 truncate text-xs text-muted-foreground xl:block">
                  {row.original.customerEmail}
                </span>
              )}
            </>
          ),
        }),
        helper.accessor('startDate', {
          header: () => t('desk.columns.dates'),
          cell: ({ row }) => {
            const note = when(row.original)
            return (
              <>
                <span className="block whitespace-nowrap">
                  {range(row.original.startDate, row.original.endDate)}
                </span>
                {note && (
                  <span
                    className={cn(
                      'block text-xs',
                      note.late ? 'font-medium text-destructive' : 'text-muted-foreground',
                    )}
                  >
                    {note.text}
                  </span>
                )}
              </>
            )
          },
        }),
        helper.accessor('status', {
          header: () => t('desk.columns.status'),
          cell: ({ getValue }) => <StatusBadge status={getValue()} />,
        }),
        helper.accessor('totalPrice', {
          header: () => <span className="block text-right">{t('desk.columns.amount')}</span>,
          cell: ({ row }) => (
            <span className="block text-right tabular-nums">
              <span className="block font-semibold">{formatPrice(row.original.totalPrice)}</span>
              {row.original.lateFeeTotal > 0 && (
                <span className="block text-xs font-medium text-destructive">
                  {t('desk.lateFees', { amount: formatPrice(row.original.lateFeeTotal) })}
                </span>
              )}
            </span>
          ),
        }),
        helper.display({
          id: 'actions',
          header: () => <span className="sr-only">{t('desk.columns.actions')}</span>,
          cell: ({ row }) => (
            <ActionButtons rental={row.original} today={today} onAction={onAction} />
          ),
        }),
      ]),
    [t, formatPrice, range, when, today, onAction],
  )

  const table = useTable({ features, columns, data: rows, getRowId: (row) => String(row.id) })

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr
                key={group.id}
                className="border-b bg-muted text-left text-xs text-muted-foreground"
              >
                {group.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-medium first:pl-5 last:pr-5">
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="align-middle">
                {row.getAllCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 first:pl-5 last:pr-5">
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phones: the same rows as cards. */}
      <ul className="flex flex-col gap-3 md:hidden">
        {table.getRowModel().rows.map(({ original: rental }) => {
          const note = when(rental)
          return (
            <li key={rental.id} className="rounded-xl border bg-card p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{rental.itemName}</p>
                  <p className="text-xs text-muted-foreground">
                    #{rental.id} · {rental.customerFullName}
                  </p>
                </div>
                <StatusBadge status={rental.status} />
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p>{range(rental.startDate, rental.endDate)}</p>
                  {note && (
                    <p
                      className={cn(
                        'text-xs',
                        note.late ? 'font-medium text-destructive' : 'text-muted-foreground',
                      )}
                    >
                      {note.text}
                    </p>
                  )}
                </div>
                <div className="text-right tabular-nums">
                  <p className="font-semibold">{formatPrice(rental.totalPrice)}</p>
                  {rental.lateFeeTotal > 0 && (
                    <p className="text-xs font-medium text-destructive">
                      {t('desk.lateFees', { amount: formatPrice(rental.lateFeeTotal) })}
                    </p>
                  )}
                </div>
              </div>
              <ActionButtons
                rental={rental}
                today={today}
                onAction={onAction}
                className="mt-3 border-t pt-3"
              />
            </li>
          )
        })}
      </ul>
    </>
  )
}
