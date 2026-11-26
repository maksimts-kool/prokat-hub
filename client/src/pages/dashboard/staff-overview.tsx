import { CircleCheck, PackageCheck, Undo2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { apiErrorMessage } from '@/api/error-message'
import type { StaffRentalDto } from '@/api/generated/model'
import { LoadingRegion, PanelSkeleton } from '@/components/skeletons'
import { useDateRange } from '@/components/rentals/use-date-range'
import { useFormat } from '@/i18n/format'
import { daysLate } from '@/lib/rentals'
import { EmptyState, LoadError, Panel } from '@/pages/dashboard/dashboard-ui'
import { useStaffToday } from '@/pages/dashboard/use-dashboard-data'

/** Rows shown in each card; the desk lists the rest. */
const SHOW = 5

function RentalRows({
  rows,
  note,
}: {
  rows: StaffRentalDto[]
  /** The second line under the customer, e.g. when the item is due back. */
  note: (rental: StaffRentalDto) => string
}) {
  return (
    <ul className="flex flex-col divide-y">
      {rows.slice(0, SHOW).map((rental) => (
        <li key={rental.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <span className="w-14 shrink-0 text-sm font-semibold text-muted-foreground tabular-nums">
            #{rental.id}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{rental.itemName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {rental.customerFullName} · {note(rental)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}

function More({ count }: { count: number }) {
  const { t } = useTranslation()
  if (count <= SHOW) return null
  return (
    <p className="mt-3 text-xs text-muted-foreground">
      {t('dashboard.staff.more', { count: count - SHOW })}
    </p>
  )
}

/** Staff and admins: today's pickups, what is out and what is late. Their tools are in the sidebar. */
export function StaffOverview() {
  const { t } = useTranslation()
  const { formatDate, formatPrice } = useFormat()
  const range = useDateRange()
  const { today, pickups, out, overdue, pickupRows, outRows, overdueRows } = useStaffToday()

  if (pickups.isPending || out.isPending || overdue.isPending) {
    return (
      <LoadingRegion className="flex flex-col gap-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <PanelSkeleton />
          <PanelSkeleton />
        </div>
        <PanelSkeleton rows={2} />
      </LoadingRegion>
    )
  }
  const failed = [pickups, out, overdue].find((q) => q.isError && !q.data)
  if (failed) {
    return (
      <LoadError
        message={apiErrorMessage(failed.error)}
        onRetry={() => {
          void pickups.refetch()
          void out.refetch()
          void overdue.refetch()
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title={t('dashboard.staff.pickups')}>
          {pickupRows.length === 0 ? (
            <EmptyState icon={PackageCheck} title={t('dashboard.staff.noPickups')} />
          ) : (
            <>
              <RentalRows
                rows={pickupRows}
                note={(r) =>
                  r.startDate < today
                    ? t('dashboard.staff.startedOn', { date: formatDate(r.startDate) })
                    : range(r.startDate, r.endDate)
                }
              />
              <More count={pickupRows.length} />
            </>
          )}
        </Panel>

        <Panel title={t('dashboard.staff.outNow')}>
          {outRows.length === 0 ? (
            <EmptyState icon={Undo2} title={t('dashboard.staff.nothingOut')} />
          ) : (
            <>
              <RentalRows
                rows={outRows}
                note={(r) =>
                  r.endDate === today
                    ? t('dashboard.staff.dueToday')
                    : t('dashboard.staff.dueOn', { date: formatDate(r.endDate) })
                }
              />
              <More count={outRows.length} />
            </>
          )}
        </Panel>
      </div>

      <Panel title={t('dashboard.staff.overdue')}>
        {overdueRows.length === 0 ? (
          <EmptyState icon={CircleCheck} title={t('dashboard.staff.noOverdue')} />
        ) : (
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-5 pb-2 font-medium sm:px-6">{t('dashboard.staff.rental')}</th>
                  <th className="pb-2 font-medium">{t('dashboard.staff.customer')}</th>
                  <th className="pb-2 font-medium">{t('dashboard.staff.item')}</th>
                  <th className="pb-2 font-medium">{t('dashboard.staff.due')}</th>
                  <th className="pb-2 text-right font-medium">{t('dashboard.staff.late')}</th>
                  <th className="px-5 pb-2 text-right font-medium sm:px-6">
                    {t('dashboard.staff.lateFees')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {overdueRows.slice(0, SHOW * 2).map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3 font-semibold tabular-nums sm:px-6">#{r.id}</td>
                    <td className="py-3">
                      <span className="block font-medium">{r.customerFullName}</span>
                      {r.customerEmail && (
                        <span className="block text-xs text-muted-foreground">
                          {r.customerEmail}
                        </span>
                      )}
                    </td>
                    <td className="py-3 font-medium">{r.itemName}</td>
                    <td className="py-3">{formatDate(r.endDate)}</td>
                    <td className="py-3 text-right font-medium text-destructive tabular-nums">
                      {t('dashboard.staff.daysLate', { count: daysLate(r, today) })}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums sm:px-6">
                      {r.lateFeeTotal > 0 ? formatPrice(r.lateFeeTotal) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
