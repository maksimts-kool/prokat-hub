import { CircleCheck, Inbox, RotateCcw } from 'lucide-react'
import { useCallback, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { apiErrorMessage } from '@/api/error-message'
import { RentalStatus, type GetApiRentalsParams } from '@/api/generated/model'
import { useGetApiRentals, useGetApiRentalsOverdue } from '@/api/generated/rentals/rentals'
import { PageLoader } from '@/components/page-loader'
import { Pagination } from '@/components/pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { todayIso } from '@/lib/rentals'
import { EmptyState, LoadError, PillTabs } from '@/pages/dashboard/dashboard-ui'
import { DeskActionDialog } from '@/pages/dashboard/desk/desk-action-dialog'
import type { DeskAction } from '@/pages/dashboard/desk/desk-actions'
import { DeskTable } from '@/pages/dashboard/desk/desk-table'

const PAGE_SIZE = 20

const tabs = ['pickups', 'out', 'overdue', 'all'] as const
type Tab = (typeof tabs)[number]

function isTab(value: string | null): value is Tab {
  return tabs.includes(value as Tab)
}

function isStatus(value: string | null): value is RentalStatus {
  return Object.values(RentalStatus).includes(value as RentalStatus)
}

/** A `yyyy-MM-dd` from the URL, or nothing for a missing or malformed one. */
function dateParam(value: string | null): string | undefined {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined
}

/**
 * The list behind each tab: Booked rentals that cover today, Issued rentals not yet due, or any
 * rentals filtered by status and days. Overdue rentals come from their own endpoint.
 */
function listParams(tab: Exclude<Tab, 'overdue'>, today: string, search: URLSearchParams) {
  const page = Math.max(1, Number(search.get('page')) || 1)
  const base = { Page: page, PageSize: PAGE_SIZE }
  switch (tab) {
    case 'pickups':
      return { ...base, Status: ['Booked'], From: today, To: today } satisfies GetApiRentalsParams
    case 'out':
      // An Issued rental that ends before today is late, so it is on the Overdue tab.
      return { ...base, Status: ['Issued'], From: today } satisfies GetApiRentalsParams
    case 'all': {
      const status = search.get('status')
      return {
        ...base,
        Status: isStatus(status) ? [status] : undefined,
        From: dateParam(search.get('from')),
        To: dateParam(search.get('to')),
      } satisfies GetApiRentalsParams
    }
  }
}

/** Only the total of a list, for the tab counts. */
function useCount(params: GetApiRentalsParams) {
  return useGetApiRentals({ ...params, Page: 1, PageSize: 1 }).data?.totalCount
}

function Filters({
  search,
  update,
}: {
  search: URLSearchParams
  update: (changes: Record<string, string | undefined>) => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const status = search.get('status') ?? ''
  const from = search.get('from') ?? ''
  const to = search.get('to') ?? ''
  const reversed = from !== '' && to !== '' && from > to

  return (
    <div className="mb-5 rounded-xl border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-status`}>{t('desk.filters.status')}</Label>
          <select
            id={`${id}-status`}
            value={status}
            onChange={(event) => update({ status: event.target.value || undefined })}
            className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">{t('desk.filters.allStatuses')}</option>
            {Object.values(RentalStatus).map((value) => (
              <option key={value} value={value}>
                {t(`rentalStatus.${value}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-from`}>{t('desk.filters.from')}</Label>
          <Input
            id={`${id}-from`}
            type="date"
            value={from}
            onChange={(event) => update({ from: event.target.value || undefined })}
            className="h-9 bg-background"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-to`}>{t('desk.filters.to')}</Label>
          <Input
            id={`${id}-to`}
            type="date"
            value={to}
            aria-invalid={reversed}
            onChange={(event) => update({ to: event.target.value || undefined })}
            className="h-9 bg-background"
          />
        </div>
        <Button
          variant="outline"
          size="lg"
          className="px-3"
          disabled={!status && !from && !to}
          onClick={() => update({ status: undefined, from: undefined, to: undefined })}
        >
          <RotateCcw aria-hidden />
          {t('desk.filters.reset')}
        </Button>
      </div>
      <p
        className={
          reversed ? 'mt-2 text-xs text-destructive' : 'mt-2 text-xs text-muted-foreground'
        }
      >
        {reversed ? t('desk.filters.reversed') : t('desk.filters.hint')}
      </p>
    </div>
  )
}

/**
 * The rental desk for staff and admins: today's pickups, what is out, what is overdue and every
 * rental, with Issue, Receive and Mark late. The tab, filters and page live in the URL.
 */
export function DeskPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useSearchParams()
  const [action, setAction] = useState<DeskAction | null>(null)
  const today = todayIso()
  const tabParam = search.get('tab')
  const tab: Tab = isTab(tabParam) ? tabParam : 'pickups'

  const overdue = useGetApiRentalsOverdue()
  const listTab = tab === 'overdue' ? 'pickups' : tab
  const reversed = (() => {
    const from = search.get('from')
    const to = search.get('to')
    return tab === 'all' && !!from && !!to && from > to
  })()
  const params = listParams(listTab, today, search)
  // The Overdue tab doesn't need the paged list, and a reversed range is a 400: skip both.
  const list = useGetApiRentals(params, { query: { enabled: tab !== 'overdue' && !reversed } })
  const pickupCount = useCount(listParams('pickups', today, new URLSearchParams()))
  const outCount = useCount(listParams('out', today, new URLSearchParams()))

  const openAction = useCallback((next: DeskAction) => setAction(next), [])

  /** Changes URL params; any change but the page itself starts again at page 1. */
  function update(changes: Record<string, string | undefined>) {
    setSearch(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(changes)) {
          if (value === undefined) next.delete(key)
          else next.set(key, value)
        }
        if (!('page' in changes)) next.delete('page')
        return next
      },
      { replace: true },
    )
  }

  const query = tab === 'overdue' ? overdue : list
  const rows = tab === 'overdue' ? (overdue.data ?? []) : (list.data?.items ?? [])

  let content
  if (tab === 'all' && reversed) {
    content = null
  } else if (query.isPending) {
    content = <PageLoader />
  } else if (query.isError && !query.data) {
    content = (
      <LoadError message={apiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
    )
  } else if (rows.length === 0) {
    content = (
      <div className="rounded-xl border bg-card">
        <EmptyState
          icon={tab === 'overdue' ? CircleCheck : Inbox}
          title={t(`desk.empty.${tab}`)}
          className="py-12"
        />
      </div>
    )
  } else {
    content = (
      <>
        <DeskTable rows={rows} today={today} onAction={openAction} />
        {tab !== 'overdue' && list.data && (
          <Pagination
            className="mt-5"
            page={list.data.page}
            pageCount={Math.max(1, Math.ceil(list.data.totalCount / list.data.pageSize))}
            onPageChange={(page) => update({ page: String(page) })}
            summary={t('desk.summary', {
              from: (list.data.page - 1) * list.data.pageSize + 1,
              to: (list.data.page - 1) * list.data.pageSize + list.data.items.length,
              count: list.data.totalCount,
            })}
          />
        )}
      </>
    )
  }

  return (
    <div>
      <PillTabs
        label={t('desk.tabsLabel')}
        tabs={[
          { key: 'pickups', label: t('desk.tabs.pickups'), count: pickupCount },
          { key: 'out', label: t('desk.tabs.out'), count: outCount },
          { key: 'overdue', label: t('desk.tabs.overdue'), count: overdue.data?.length },
          { key: 'all', label: t('desk.tabs.all') },
        ]}
        active={tab}
        onChange={(next) =>
          update({
            tab: next === 'pickups' ? undefined : next,
            ...(next === 'all' ? {} : { status: undefined, from: undefined, to: undefined }),
          })
        }
        className="mb-5 w-fit"
      />

      {tab === 'all' && <Filters search={search} update={update} />}
      {tab === 'overdue' && rows.length > 0 && (
        <p className="mb-4 text-sm text-muted-foreground">{t('desk.overdueHint')}</p>
      )}

      <div role="tabpanel">{content}</div>

      <DeskActionDialog action={action} today={today} onClose={() => setAction(null)} />
    </div>
  )
}
