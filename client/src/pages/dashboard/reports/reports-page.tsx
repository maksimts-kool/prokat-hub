import { keepPreviousData } from '@tanstack/react-query'
import { ChartColumn } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { apiErrorMessage } from '@/api/error-message'
import type { PopularItemDto } from '@/api/generated/model'
import { useGetApiReportsPopularItems } from '@/api/generated/reports/reports'
import { LoadingRegion, PanelSkeleton } from '@/components/skeletons'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFormat } from '@/i18n/format'
import { cn } from '@/lib/utils'
import { EmptyState, LoadError, Panel, PillTabs } from '@/pages/dashboard/dashboard-ui'
import { PopularItemsChart, type ReportMetric } from '@/pages/dashboard/reports/popular-items-chart'
import {
  dateParam,
  DEFAULT_PRESET,
  isPreset,
  presetRange,
  type RangePreset,
  rangePresets,
} from '@/pages/dashboard/reports/report-range'

const topOptions = [5, 10, 20] as const
const DEFAULT_TOP = 10

const selectClass =
  'h-9 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

/** The report's settings from the URL: the range preset (or custom dates), how many items and the chart metric. */
function useReportParams() {
  const [search, setSearch] = useSearchParams()
  const rangeParam = search.get('range')
  const preset: RangePreset = isPreset(rangeParam) ? rangeParam : DEFAULT_PRESET
  const customFrom = dateParam(search.get('from'))
  const customTo = dateParam(search.get('to'))
  const range = preset === 'custom' ? { from: customFrom, to: customTo } : presetRange(preset)
  const topParam = Number(search.get('top'))
  const top = (topOptions as readonly number[]).includes(topParam) ? topParam : DEFAULT_TOP
  const metric: ReportMetric = search.get('metric') === 'revenue' ? 'revenue' : 'rentals'

  function update(changes: Record<string, string | undefined>) {
    setSearch(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(changes)) {
          if (value === undefined) next.delete(key)
          else next.set(key, value)
        }
        return next
      },
      { replace: true },
    )
  }

  return { preset, range, customFrom, customTo, top, metric, update }
}

function Filters({ params }: { params: ReturnType<typeof useReportParams> }) {
  const { t } = useTranslation()
  const id = useId()
  const { preset, range, top, update } = params
  const reversed = !!range.from && !!range.to && range.from > range.to
  const incomplete = preset === 'custom' && !range.from !== !range.to

  /** Typing a date switches to a custom range that starts from the dates shown. */
  function setDate(key: 'from' | 'to', value: string) {
    update({
      range: 'custom',
      from: range.from,
      to: range.to,
      [key]: value || undefined,
    })
  }

  let hint = t('reports.filters.hint')
  if (reversed) hint = t('reports.filters.reversed')
  else if (incomplete) hint = t('reports.filters.incomplete')

  return (
    <div className="mb-5 rounded-xl border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.6fr)] lg:items-end">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-range`}>{t('reports.filters.period')}</Label>
          <select
            id={`${id}-range`}
            value={preset}
            onChange={(event) => {
              const next = event.target.value as RangePreset
              // A custom range starts from the dates of the period it replaces.
              const dates = next === 'custom' ? range : { from: undefined, to: undefined }
              update({ range: next === DEFAULT_PRESET ? undefined : next, ...dates })
            }}
            className={selectClass}
          >
            {rangePresets.map((value) => (
              <option key={value} value={value}>
                {t(`reports.presets.${value}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-from`}>{t('reports.filters.from')}</Label>
          <Input
            id={`${id}-from`}
            type="date"
            value={range.from ?? ''}
            aria-invalid={reversed || (incomplete && !range.from) || undefined}
            onChange={(event) => setDate('from', event.target.value)}
            className="h-9 bg-background"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-to`}>{t('reports.filters.to')}</Label>
          <Input
            id={`${id}-to`}
            type="date"
            value={range.to ?? ''}
            aria-invalid={reversed || (incomplete && !range.to) || undefined}
            onChange={(event) => setDate('to', event.target.value)}
            className="h-9 bg-background"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-top`}>{t('reports.filters.top')}</Label>
          <select
            id={`${id}-top`}
            value={top}
            onChange={(event) =>
              update({
                top: Number(event.target.value) === DEFAULT_TOP ? undefined : event.target.value,
              })
            }
            className={selectClass}
          >
            {topOptions.map((value) => (
              <option key={value} value={value}>
                {t('reports.filters.topOption', { count: value })}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p
        className={cn(
          'mt-2 text-xs',
          reversed || incomplete ? 'text-destructive' : 'text-muted-foreground',
        )}
      >
        {hint}
      </p>
    </div>
  )
}

/** The report's shape while it loads: three stat tiles, the chart and the table. */
function ReportSkeleton() {
  return (
    <LoadingRegion className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((tile) => (
          <div key={tile} className="flex flex-col gap-2 rounded-xl border bg-card p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-card p-5 sm:p-6">
        <Skeleton className="mb-5 h-6 w-48" />
        <Skeleton className="mb-5 h-11 w-56 rounded-full" />
        <div className="flex flex-col gap-3">
          {['w-full', 'w-5/6', 'w-2/3', 'w-1/2', 'w-1/3'].map((width) => (
            <div key={width} className="flex items-center gap-3">
              <Skeleton className="h-3 w-28 shrink-0" />
              <Skeleton className={`h-6 rounded-md ${width}`} />
            </div>
          ))}
        </div>
      </div>
      <PanelSkeleton rows={4} />
    </LoadingRegion>
  )
}

function StatTile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl leading-9 font-semibold tracking-tight tabular-nums">{value}</p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  )
}

function ReportTable({ items }: { items: PopularItemDto[] }) {
  const { t } = useTranslation()
  const { formatPrice } = useFormat()

  return (
    <div className="-mx-5 overflow-x-auto sm:-mx-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-y bg-muted text-left text-xs text-muted-foreground">
            <th className="w-10 px-4 py-3 pl-5 font-medium sm:pl-6">#</th>
            <th className="px-4 py-3 font-medium">{t('reports.columns.item')}</th>
            <th className="px-4 py-3 text-right font-medium">{t('reports.columns.rentals')}</th>
            <th className="px-4 py-3 text-right font-medium">{t('reports.columns.days')}</th>
            <th className="px-4 py-3 pr-5 text-right font-medium sm:pr-6">
              {t('reports.columns.revenue')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item, index) => (
            <tr key={item.itemId} className="align-middle">
              <td className="px-4 py-3 pl-5 text-muted-foreground tabular-nums sm:pl-6">
                {index + 1}
              </td>
              <td className="px-4 py-3">
                <span className="flex min-w-48 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold">{item.name}</span>
                  {item.isRetired && <Badge>{t('reports.retired')}</Badge>}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {item.brand} · {item.categoryName}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums">
                {item.rentalCount}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{item.rentalDays}</td>
              <td className="px-4 py-3 pr-5 text-right tabular-nums sm:pr-6">
                <span className="block font-semibold">{formatPrice(item.revenue)}</span>
                {item.lateFees > 0 && (
                  <span className="block text-xs text-muted-foreground">
                    {t('reports.lateFeesNote', { amount: formatPrice(item.lateFees) })}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * The popular items report for admins (`GET /api/reports/popular-items`): totals for a period, the most
 * rented items as a bar chart by rentals or revenue, and the same items in a table.
 * The period, the number of items and the chart's metric live in the URL.
 */
export function ReportsPage() {
  const { t } = useTranslation()
  const { formatPrice, formatDate } = useFormat()
  const params = useReportParams()
  const { range, top, metric, update } = params

  const valid = !range.from === !range.to && !(range.from && range.to && range.from > range.to)
  const report = useGetApiReportsPopularItems(
    { From: range.from, To: range.to, Top: top },
    { query: { enabled: valid, placeholderData: keepPreviousData } },
  )

  const period =
    range.from && range.to
      ? t('catalogue.dateRange', { from: formatDate(range.from), to: formatDate(range.to) })
      : t('reports.presets.all')

  let content
  if (!valid) {
    content = null
  } else if (report.isPending) {
    content = <ReportSkeleton />
  } else if (report.isError && !report.data) {
    content = (
      <LoadError message={apiErrorMessage(report.error)} onRetry={() => void report.refetch()} />
    )
  } else if (report.data.items.length === 0) {
    content = (
      <div className="rounded-xl border bg-card">
        <EmptyState
          icon={ChartColumn}
          title={t('reports.empty')}
          text={t('reports.emptyText')}
          className="py-12"
        />
      </div>
    )
  } else {
    const { items, totalRentals, totalRevenue } = report.data
    const shownRentals = items.reduce((sum, item) => sum + item.rentalCount, 0)
    content = (
      <div className={cn('flex flex-col gap-5', report.isPlaceholderData && 'opacity-60')}>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile label={t('reports.stats.rentals')} value={String(totalRentals)} note={period} />
          <StatTile
            label={t('reports.stats.revenue')}
            value={formatPrice(totalRevenue)}
            note={t('reports.stats.revenueNote')}
          />
          <StatTile
            label={t('reports.stats.share', { count: items.length })}
            value={`${Math.round((shownRentals / Math.max(1, totalRentals)) * 100)}%`}
            note={t('reports.stats.shareNote')}
          />
        </div>

        <Panel title={t('reports.chartTitle', { count: items.length })}>
          <PillTabs
            label={t('reports.metricLabel')}
            tabs={[
              { key: 'rentals', label: t('reports.metric.rentals') },
              { key: 'revenue', label: t('reports.metric.revenue') },
            ]}
            active={metric}
            onChange={(next) => update({ metric: next === 'rentals' ? undefined : next })}
            className="mb-4 w-fit"
          />
          <PopularItemsChart items={items} metric={metric} />
        </Panel>

        <Panel title={t('reports.tableTitle')}>
          <ReportTable items={items} />
        </Panel>
      </div>
    )
  }

  return (
    <div>
      <Filters params={params} />
      {content}
    </div>
  )
}
