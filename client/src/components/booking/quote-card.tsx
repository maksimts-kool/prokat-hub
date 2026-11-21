import { Clock, Loader2, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { RentalQuoteDto } from '@/api/generated/model'
import { FormAlert } from '@/components/form-alert'
import { Badge } from '@/components/ui/badge'
import { useFormat } from '@/i18n/format'
import { discountFor } from '@/lib/discount-tiers'
import { cn } from '@/lib/utils'

interface QuoteCardProps {
  /** The quote for the chosen dates, from `GET /api/rentals/quote`. */
  quote: RentalQuoteDto | undefined
  /** Whether a pick-up day is chosen but the return day is not yet. */
  awaitingReturn: boolean
  /** The range the hovered day would make, while only the pick-up day is chosen. */
  preview?: { from: Date; to: Date; days: number }
  /** True while a quote for new dates is loading; the old one stays on screen. */
  loading: boolean
  error: string | undefined
  /** The item's deposit and late fee per day, shown under the action even before dates are picked. */
  deposit: number
  lateFeePerDay: number
  /** The booking action, below the price. */
  children?: ReactNode
  className?: string
}

/** The price for the chosen dates: days × daily price, the longer-rental discount, total and deposit. */
export function QuoteCard({
  quote,
  awaitingReturn,
  preview,
  loading,
  error,
  deposit,
  lateFeePerDay,
  children,
  className,
}: QuoteCardProps) {
  const { t } = useTranslation()
  const { formatPrice, formatDate } = useFormat()

  return (
    <aside
      aria-labelledby="quote-title"
      className={cn(
        'flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground',
        className,
      )}
    >
      <div>
        <h2 id="quote-title" className="flex items-center gap-2 text-lg leading-7 font-semibold">
          {t('item.quote.title')}
          {loading && quote && (
            <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
          )}
        </h2>
        {quote && (
          <p className="text-sm text-muted-foreground">
            {t('catalogue.dateRange', { from: formatDate(quote.from), to: formatDate(quote.to) })}
          </p>
        )}
      </div>

      {quote ? (
        // Announced when new dates change the price.
        <div aria-live="polite" aria-busy={loading} className="flex flex-col gap-4">
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">
                {t('item.quote.days', {
                  price: formatPrice(quote.dailyPrice),
                  count: quote.days,
                })}
              </dt>
              <dd className="tabular-nums">{formatPrice(quote.subtotal)}</dd>
            </div>
            {quote.discountPercent > 0 && (
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  {t('item.quote.discount')}
                  <Badge tone="highlight">−{quote.discountPercent}%</Badge>
                </dt>
                <dd className="tabular-nums">−{formatPrice(quote.discountAmount)}</dd>
              </div>
            )}
            <div className="mt-2 flex items-baseline justify-between gap-3 border-t pt-3">
              <dt className="font-semibold">{t('item.quote.total')}</dt>
              <dd className="text-2xl leading-8 font-bold tracking-[-0.01em] tabular-nums">
                {formatPrice(quote.totalPrice)}
              </dd>
            </div>
          </dl>
        </div>
      ) : loading ? (
        <QuoteSkeleton />
      ) : (
        !error && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              {awaitingReturn ? t('item.quote.pickReturn') : t('item.quote.pickDates')}
            </p>
            {preview && <PreviewNote {...preview} />}
          </div>
        )
      )}

      {/* The action right under the total, then what went wrong, then the fine print. */}
      {children}

      {error && <FormAlert>{error}</FormAlert>}

      <div className="flex flex-col gap-4">
        <Note icon={<ShieldCheck />}>
          <strong className="font-semibold text-foreground">
            {t('item.quote.deposit', { amount: formatPrice(deposit) })}
          </strong>{' '}
          {t('item.quote.depositNote')}
        </Note>
        <Note icon={<Clock />}>
          {t('item.quote.lateFee', { amount: formatPrice(lateFeePerDay) })}
        </Note>
      </div>
    </aside>
  )
}

/** What the hovered return day would give: the dates, the length and the discount it reaches. */
function PreviewNote({ from, to, days }: { from: Date; to: Date; days: number }) {
  const { t } = useTranslation()
  const { formatDate } = useFormat()
  const discount = discountFor(days)

  return (
    <p
      aria-live="polite"
      className="flex flex-wrap items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground"
    >
      <span className="font-semibold">
        {t('catalogue.dateRange', { from: formatDate(from), to: formatDate(to) })}
      </span>
      <span>{t('item.quote.previewDays', { count: days })}</span>
      {discount > 0 && <Badge tone="highlight">−{discount}%</Badge>}
    </p>
  )
}

function Note({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex gap-2 rounded-lg bg-muted p-3 text-[13px] leading-[18px] text-muted-foreground">
      <span
        className="mt-px shrink-0 text-primary dark:text-accent-foreground [&_svg]:size-4"
        aria-hidden
      >
        {icon}
      </span>
      <p>{children}</p>
    </div>
  )
}

function QuoteSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-3">
      <div className="h-5 w-full animate-pulse rounded-sm bg-muted" />
      <div className="h-5 w-3/4 animate-pulse rounded-sm bg-muted" />
      <div className="mt-2 h-8 w-full animate-pulse rounded-sm bg-muted" />
      <div className="h-14 w-full animate-pulse rounded-lg bg-muted" />
    </div>
  )
}
