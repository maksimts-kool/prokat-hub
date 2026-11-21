import { keepPreviousData } from '@tanstack/react-query'
import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
} from 'date-fns'
import { ChevronRight, type LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { useTranslation } from 'react-i18next'
import { Link, useParams, useSearchParams } from 'react-router'
import { apiErrorMessage } from '@/api/error-message'
import { useGetApiCategories } from '@/api/generated/categories/categories'
import { useGetApiItemsId, useGetApiItemsIdAvailability } from '@/api/generated/items/items'
import type { ItemDetailsDto } from '@/api/generated/model'
import { useGetApiRentalsQuote } from '@/api/generated/rentals/rentals'
import { isApiError } from '@/api/http-client'
import { BookButton, BookNote, MobileBookBar } from '@/components/booking/book-action'
import { DateRangeCalendar } from '@/components/booking/date-range-calendar'
import { QuoteCard } from '@/components/booking/quote-card'
import { useBookItem } from '@/components/booking/use-book-item'
import { categoryIcon } from '@/components/category-icon'
import { ItemSpecifications } from '@/components/item-specifications'
import { FormAlert } from '@/components/form-alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useFormat } from '@/i18n/format'
import { bookingDatesError } from '@/lib/booking-schema'
import { discountRows, rowIncludes } from '@/lib/discount-tiers'
import { cn } from '@/lib/utils'
import { NotFoundPage } from '@/pages/not-found-page'
import { dateRangeState, isoDate, MAX_DAYS, todayIso } from '@/pages/catalogue/catalogue-filters'
import { useLiveStatus } from '@/realtime/live-status-context'

const toIso = (date: Date) => format(date, 'yyyy-MM-dd')

/** `/catalogue/:id`: the item, its booked days on a calendar and a live quote for the chosen dates. */
export function ItemPage() {
  const { id } = useParams()
  const itemId = Number(id)
  const validId = Number.isInteger(itemId) && itemId > 0
  const item = useGetApiItemsId(itemId, { query: { enabled: validId } })

  if (!validId || (isApiError(item.error) && item.error.status === 404)) {
    return <NotFoundPage />
  }
  if (item.isPending) return <ItemSkeleton />
  if (item.isError) return <ItemError error={item.error} onRetry={() => void item.refetch()} />

  return <ItemDetails item={item.data} />
}

function ItemDetails({ item }: { item: ItemDetailsDto }) {
  const { t } = useTranslation()
  const { formatPrice } = useFormat()
  const [searchParams, setSearchParams] = useSearchParams()

  // Bookable days: from today for as long a range as the API accepts.
  const [firstDay] = useState(() => startOfDay(new Date()))
  const lastDay = addDays(firstDay, MAX_DAYS - 1)

  // The catalogue passes its dates on as `?from=…&to=…`; keep them if they can still be booked.
  const [range, setRange] = useState<DateRange | undefined>(() => {
    const dates = { from: isoDate(searchParams.get('from')), to: isoDate(searchParams.get('to')) }
    const state = dateRangeState(dates, todayIso())
    return state.kind === 'valid'
      ? { from: parseISO(state.from), to: parseISO(state.to) }
      : undefined
  })
  const [month, setMonth] = useState(() => startOfMonth(range?.from ?? firstDay))
  // The range the hovered day would make once a pick-up day is chosen, shown before the second click.
  const [preview, setPreview] = useState<{ from: Date; to: Date }>()

  // One request covers every day the calendar can show, so a range across months is checked too.
  const availability = useGetApiItemsIdAvailability(item.id, {
    From: toIso(firstDay),
    To: toIso(lastDay),
  })
  const booked = useMemo<DateRange[]>(
    () =>
      availability.data?.bookedRanges.map((r) => ({
        from: parseISO(r.startDate),
        to: parseISO(r.endDate),
      })) ?? [],
    [availability.data],
  )

  const from = range?.from ? toIso(range.from) : undefined
  const to = range?.to ? toIso(range.to) : undefined
  const complete = from !== undefined && to !== undefined
  const quote = useGetApiRentalsQuote(
    { ItemId: item.id, From: from ?? '', To: to ?? '' },
    { query: { enabled: complete, placeholderData: keepPreviousData } },
  )
  // Dates from a link may already be taken; the calendar itself never lets a range cover booked days.
  const clashes =
    complete &&
    (availability.data?.bookedRanges ?? []).some((b) => from <= b.endDate && b.startDate <= to)

  const booking = useBookItem(item.id, item.name)

  function selectRange(next: DateRange | undefined) {
    setRange(next)
    booking.reset()
    // Complete ranges go to the URL, so the page can be shared and reloaded with them.
    setSearchParams(
      (params) => {
        params.delete('from')
        params.delete('to')
        if (next?.from && next.to) {
          params.set('from', toIso(next.from))
          params.set('to', toIso(next.to))
        }
        return params
      },
      { replace: true, preventScrollReset: true },
    )
  }

  // Problems with the dates themselves: the Zod rules (no past days, end not before start, not too
  // long), then a clash. A 409 from Book reloads the booked days, so both report the same clash.
  const datesError = !complete
    ? undefined
    : (bookingDatesError(t, { from, to }) ??
      (clashes || booking.conflict
        ? t('errors.conflict')
        : quote.isError
          ? apiErrorMessage(quote.error)
          : undefined))
  // Other failed bookings (e.g. no connection) keep the dates bookable, so Book can be retried.
  const quoteError = datesError ?? booking.error
  // Book needs a fresh quote for the chosen dates: not while it loads, fails or the dates clash.
  const bookBlocked =
    !complete || datesError !== undefined || !quote.data || quote.isPlaceholderData
  const bookProps = {
    access: booking.access,
    quote: complete ? quote.data : undefined,
    blocked: bookBlocked,
    pending: booking.pending,
    onBook: () => booking.book({ from, to }),
  }
  const awaitingReturn = range?.from !== undefined && !complete
  const previewDays =
    awaitingReturn && preview ? differenceInCalendarDays(preview.to, preview.from) + 1 : undefined
  const chosenDays = complete ? quote.data?.days : previewDays
  const icon = categoryIcon(useCategorySlug(item.categoryId))

  return (
    <>
      <nav aria-label={t('layout.breadcrumb')}>
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link to="/" className="hover:text-foreground">
              {t('nav.home')}
            </Link>
          </li>
          <Chevron />
          <li>
            <Link to="/catalogue" className="hover:text-foreground">
              {t('nav.catalogue')}
            </Link>
          </li>
          <Chevron />
          <li>
            <Link to={`/catalogue?category=${item.categoryId}`} className="hover:text-foreground">
              {item.categoryName}
            </Link>
          </li>
          <Chevron />
          <li aria-current="page" className="font-medium text-foreground">
            {item.name}
          </li>
        </ol>
      </nav>

      {/* Phones: details, then dates and quote, then discounts. Wide: booking column on the right. */}
      <div className="mt-6 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[auto_1fr]">
        <div className="min-w-0">
          <ItemImage item={item} icon={icon} />

          <p className="mt-6 text-xs text-muted-foreground">{item.brand}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.025em] sm:text-4xl">{item.name}</h1>
          <p className="mt-3 max-w-160 text-muted-foreground sm:text-lg">{item.description}</p>

          <p className="mt-4 text-2xl leading-8 font-bold tabular-nums">
            {formatPrice(item.dailyPrice)}{' '}
            <span className="text-base font-normal text-muted-foreground">
              {t('catalogue.perDay')}
            </span>
          </p>

          {/* Deposit and late fee are in the booking column, next to the price they go with. */}
          <div className="mt-8">
            <ItemSpecifications specifications={item.specifications} />
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg leading-7 font-semibold">{t('item.chooseDates')}</h2>
            <LiveIndicator />
          </div>
          {availability.isError && (
            <FormAlert>
              {t('item.availabilityError')} {apiErrorMessage(availability.error)}
            </FormAlert>
          )}
          <DateRangeCalendar
            selected={range}
            onSelect={selectRange}
            booked={booked}
            firstDay={firstDay}
            lastDay={lastDay}
            month={month}
            onMonthChange={setMonth}
            onPreviewChange={setPreview}
            className={cn(availability.isPending && 'animate-pulse')}
          />
          <QuoteCard
            quote={complete ? quote.data : undefined}
            awaitingReturn={awaitingReturn}
            preview={
              awaitingReturn && preview && previewDays
                ? { from: preview.from, to: preview.to, days: previewDays }
                : undefined
            }
            loading={complete && quote.isFetching}
            error={quoteError}
            deposit={item.deposit}
            lateFeePerDay={item.lateFeePerDay}
          >
            {/* Phones book from the bar pinned to the bottom instead. */}
            <div className="hidden flex-col gap-2 lg:flex">
              <BookButton {...bookProps} />
              <BookNote access={booking.access} />
            </div>
            {(booking.access === 'guest' || booking.access === 'staff') && (
              <div className="lg:hidden">
                <BookNote access={booking.access} />
              </div>
            )}
          </QuoteCard>
        </div>

        <div className="min-w-0 lg:col-start-1">
          <DiscountTable dailyPrice={item.dailyPrice} chosenDays={chosenDays} />
        </div>
      </div>

      <MobileBookBar {...bookProps} error={complete ? quoteError : undefined} />
    </>
  )
}

/**
 * "Live availability" with a green dot while booked days follow other people's bookings; a muted
 * "Reconnecting" while the connection is lost. Nothing for guests, who get no live updates.
 */
function LiveIndicator() {
  const { t } = useTranslation()
  const status = useLiveStatus()
  if (status !== 'live' && status !== 'lost') return null

  const live = status === 'live'
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground" role="status">
      <span
        aria-hidden
        className={cn('size-2 rounded-full', live ? 'bg-green-600' : 'bg-muted-foreground')}
      />
      {live ? t('item.live') : t('item.liveLost')}
    </span>
  )
}

function Chevron() {
  return (
    <li aria-hidden>
      <ChevronRight className="size-3.5" />
    </li>
  )
}

/** The category's slug, for its icon; categories are usually cached from the catalogue. */
function useCategorySlug(categoryId: number) {
  const categories = useGetApiCategories()
  return categories.data?.find((c) => c.id === categoryId)?.slug
}

function ItemImage({ item, icon: Icon }: { item: ItemDetailsDto; icon: LucideIcon }) {
  const [failed, setFailed] = useState(false)

  return (
    <div className="relative flex aspect-16/10 items-center justify-center overflow-hidden rounded-2xl border bg-muted text-muted-foreground">
      {item.imageUrl && !failed ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <Icon className="size-24" strokeWidth={1.25} aria-hidden />
      )}
      <Badge className="absolute top-4 left-4">{item.categoryName}</Badge>
    </div>
  )
}

/** The longer-rental discounts with the per-day price at each, marking the row the chosen dates fall in. */
function DiscountTable({ dailyPrice, chosenDays }: { dailyPrice: number; chosenDays?: number }) {
  const { t } = useTranslation()
  const { formatPrice } = useFormat()

  return (
    <section aria-labelledby="discounts-title">
      <h2 id="discounts-title" className="text-lg leading-7 font-semibold">
        {t('item.discounts.title')}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('item.discounts.text')}</p>
      <div className="mt-4 overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">{t('item.discounts.length')}</th>
              <th className="px-4 py-3 font-medium">{t('item.discounts.discount')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('item.discounts.perDay')}</th>
            </tr>
          </thead>
          <tbody>
            {discountRows.map((row) => {
              const chosen = chosenDays !== undefined && rowIncludes(row, chosenDays)
              return (
                <tr key={row.minDays} className={cn('not-last:border-b', chosen && 'bg-accent')}>
                  <td className="px-4 py-3 font-medium">
                    {row.maxDays === undefined
                      ? t('item.discounts.atLeast', { count: row.minDays })
                      : t('item.discounts.between', { from: row.minDays, count: row.maxDays })}
                    {chosen && (
                      <span className="ml-2 text-xs font-normal text-accent-foreground">
                        {t('item.discounts.yourDates')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.percent > 0 ? (
                      <Badge tone="highlight">−{row.percent}%</Badge>
                    ) : (
                      <span className="text-muted-foreground">{t('item.discounts.fullPrice')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {formatPrice(Math.round(dailyPrice * (100 - row.percent)) / 100)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ItemSkeleton() {
  const { t } = useTranslation()

  return (
    <div aria-busy className="grid items-start gap-10 pt-11 lg:grid-cols-[minmax(0,1fr)_400px]">
      <span className="sr-only" role="status">
        {t('layout.loading')}
      </span>
      <div aria-hidden className="flex flex-col gap-3">
        <div className="aspect-16/10 animate-pulse rounded-2xl bg-muted" />
        <div className="mt-3 h-3 w-16 animate-pulse rounded-sm bg-muted" />
        <div className="h-9 w-2/3 animate-pulse rounded-sm bg-muted" />
        <div className="h-5 w-full animate-pulse rounded-sm bg-muted" />
      </div>
      <div aria-hidden className="flex flex-col gap-4">
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  )
}

function ItemError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-start gap-3">
      <FormAlert>
        {t('item.error')} {apiErrorMessage(error)}
      </FormAlert>
      <div className="flex gap-2">
        <Button variant="outline" size="lg" onClick={onRetry}>
          {t('catalogue.retry')}
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link to="/catalogue">{t('item.backToCatalogue')}</Link>
        </Button>
      </div>
    </div>
  )
}
