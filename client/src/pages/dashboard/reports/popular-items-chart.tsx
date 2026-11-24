import { useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PopularItemDto } from '@/api/generated/model'
import { useFormat } from '@/i18n/format'

export type ReportMetric = 'rentals' | 'revenue'

const ROW_HEIGHT = 36
const AXIS_HEIGHT = 32

function metricValue(item: PopularItemDto, metric: ReportMetric) {
  return metric === 'rentals' ? item.rentalCount : item.revenue
}

/** Phones get a narrower name column, so the bars keep most of the width. */
const wideQuery = '(min-width: 640px)'

function useWide() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(wideQuery)
      query.addEventListener('change', onChange)
      return () => query.removeEventListener('change', onChange)
    },
    () => window.matchMedia(wideQuery).matches,
  )
}

/** "Canon RF 70-200mm f/2.8 L IS USM" → "Canon RF 70-200mm f/2…", to fit `max` letters. */
function shorten(name: string, max: number) {
  return name.length > max ? `${name.slice(0, max - 1).trimEnd()}…` : name
}

/** An item name on one line, cut to fit, with the full name as its tooltip. Recharts would wrap it. */
function ItemTick({
  x,
  y,
  payload,
  max = 26,
}: {
  x?: number | string
  y?: number | string
  payload?: { value: string }
  max?: number
}) {
  const name = payload?.value ?? ''
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fontSize={12} fill="var(--foreground)">
      <title>{name}</title>
      {shorten(name, max)}
    </text>
  )
}

function ChartTooltip({ item }: { item: PopularItemDto }) {
  const { t } = useTranslation()
  const { formatPrice } = useFormat()

  return (
    <div className="min-w-48 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1.5 text-sm font-semibold">{item.name}</p>
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 tabular-nums">
        <dt className="text-muted-foreground">{t('reports.columns.rentals')}</dt>
        <dd className="text-right font-medium">{item.rentalCount}</dd>
        <dt className="text-muted-foreground">{t('reports.columns.days')}</dt>
        <dd className="text-right font-medium">{item.rentalDays}</dd>
        <dt className="text-muted-foreground">{t('reports.columns.revenue')}</dt>
        <dd className="text-right font-medium">{formatPrice(item.revenue)}</dd>
        {item.lateFees > 0 && (
          <>
            <dt className="text-muted-foreground">{t('reports.lateFeesPart')}</dt>
            <dd className="text-right">{formatPrice(item.lateFees)}</dd>
          </>
        )}
      </dl>
    </div>
  )
}

/**
 * The ranking as horizontal bars, one per item, longest first: rental counts or revenue in one
 * colour (`primary`), with the item's numbers in a tooltip on hover. The table below has every value.
 */
export function PopularItemsChart({
  items,
  metric,
}: {
  items: PopularItemDto[]
  metric: ReportMetric
}) {
  const { t, i18n } = useTranslation()
  const wide = useWide()
  const data = [...items].sort((a, b) => metricValue(b, metric) - metricValue(a, metric))
  const euros = new Intl.NumberFormat(i18n.resolvedLanguage, {
    style: 'currency',
    currency: 'EUR',
    notation: 'compact',
    maximumFractionDigits: 1,
  })

  return (
    <figure
      aria-label={t(metric === 'rentals' ? 'reports.chartRentals' : 'reports.chartRevenue')}
      style={{ height: data.length * ROW_HEIGHT + AXIS_HEIGHT }}
      className="w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid horizontal={false} stroke="var(--border)" />
          <XAxis
            type="number"
            dataKey={metric === 'rentals' ? 'rentalCount' : 'revenue'}
            allowDecimals={metric === 'revenue'}
            domain={[0, 'dataMax']}
            tickFormatter={(value: number) =>
              metric === 'revenue' ? euros.format(value) : String(value)
            }
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            height={AXIS_HEIGHT}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={wide ? 176 : 124}
            tick={<ItemTick max={wide ? 26 : 14} />}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            interval={0}
          />
          <Tooltip
            cursor={{ fill: 'var(--muted)' }}
            isAnimationActive={false}
            content={({ active, payload }) => {
              const item = payload?.[0]?.payload as PopularItemDto | undefined
              return active && item ? <ChartTooltip item={item} /> : null
            }}
          />
          <Bar
            dataKey={metric === 'rentals' ? 'rentalCount' : 'revenue'}
            fill="var(--primary)"
            barSize={16}
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  )
}
