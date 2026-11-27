import { keepPreviousData } from '@tanstack/react-query'
import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
} from 'date-fns'
import {
  ArrowRight,
  CalendarRange,
  CalendarX,
  CircleCheck,
  Clock,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { useId, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { DateRange } from 'react-day-picker'
import { useTranslation } from 'react-i18next'
import { Link, useParams, useSearchParams } from 'react-router'
import { apiErrorMessage } from '@/api/error-message'
import { useGetApiCategories } from '@/api/generated/categories/categories'
import {
  useGetApiItems,
  useGetApiItemsId,
  useGetApiItemsIdAvailability,
} from '@/api/generated/items/items'
import type { ItemDetailsDto } from '@/api/generated/model'
import { useGetApiRentalsQuote } from '@/api/generated/rentals/rentals'
import { isApiError } from '@/api/http-client'
import { AddToCart } from '@/components/booking/add-to-cart'
import { BookButton, BookNote, MobileBookBar } from '@/components/booking/book-action'
import { DateRangeCalendar } from '@/components/booking/date-range-calendar'
import { QuoteCard } from '@/components/booking/quote-card'
import { useBookItem } from '@/components/booking/use-book-item'
import { categoryIcon } from '@/components/category-icon'
import { FormAlert } from '@/components/form-alert'
import { ItemCard, itemGridClass } from '@/components/item-card'
import { ItemGallery } from '@/components/item-gallery'
import { ItemSpecifications } from '@/components/item-specifications'
import { BandBreadcrumb, PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useFormat } from '@/i18n/format'
import { bookingDatesError } from '@/lib/booking-schema'
import { discountRows, discountTiers, rowIncludes } from '@/lib/discount-tiers'
import { cn } from '@/lib/utils'
import { NotFoundPage } from '@/pages/not-found-page'
import { dateRangeState, isoDate, MAX_DAYS, todayIso } from '@/pages/catalogue/catalogue-filters'
import { useLiveStatus } from '@/realtime/live-status-context'

const toIso = (date: Date) => format(date, 'yyyy-MM-dd')
/** The best longer-rental discount. */
const TOP_DISCOUNT = discountTiers[discountTiers.length - 1].percent

/**
 * `/catalogue/:id`, laid out like a shop's product page: the photo on the left; on the right the
 * name, price, rental length and dates, the quote and Book; below, tabs for specifications,
 * discounts and rental terms, then more items from the same category.
 */
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
  const descriptionId = useId()
  const { formatPrice, formatDate } = useFormat()
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
  const [calendarOpen, setCalendarOpen] = useState(false)

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
    // The return day completes the choice: close the calendar and show the price.
    if (next?.from && next.to) setCalendarOpen(false)
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

  /** A rental length chip: that many days from the chosen pick-up day, or from today. */
  function chooseLength(days: number) {
    const start = range?.from ?? firstDay
    setMonth(startOfMonth(start))
    selectRange({ from: start, to: addDays(start, days - 1) })
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
  const days = complete ? differenceInCalendarDays(range!.to!, range!.from!) + 1 : undefined
  const chosenDays = days ?? previewDays
  const icon = categoryIcon(useCategorySlug(item.categoryId))
  // The longer-rental discount the chosen dates reach, for the price at the top.
  const discount = complete && !datesError ? (quote.data?.discountPercent ?? 0) : 0

  return (
    <>
      {/* The header's band carries on as a slim strip with the way back. */}
      <div className="full-bleed mb-6 bg-band text-band-foreground sm:mb-10">
        <div className="container-page py-4 sm:py-5">
          <BandBreadcrumb
            trail={[
              { label: t('nav.catalogue'), to: '/catalogue' },
              { label: item.categoryName, to: `/catalogue?category=${item.categoryId}` },
            ]}
            current={item.name}
          />
        </div>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="min-w-0 lg:sticky lg:top-28">
          <ItemGallery name={item.name} imageUrls={item.imageUrls} icon={icon} />
          {/* Wide screens: the description fills the space under the photos. */}
          <section aria-labelledby={`${descriptionId}-wide`} className="mt-8 hidden lg:block">
            <h2 id={`${descriptionId}-wide`} className="font-semibold">
              {t('item.about')}
            </h2>
            <p className="mt-2 leading-7">{item.description}</p>
          </section>
        </div>

        <div id="choose-dates" className="flex min-w-0 scroll-mt-28 flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                to={`/catalogue?category=${item.categoryId}`}
                className="inline-flex items-center gap-1 rounded-md bg-foreground px-2 py-1 text-sm leading-5 font-semibold text-background outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <IconOf icon={icon} className="size-3.5" />
                {item.categoryName}
              </Link>
              <DatesStatus free={complete && !datesError} taken={complete && clashes} />
            </div>
            <h1 className="text-3xl leading-tight font-extrabold tracking-[-0.03em] break-words sm:text-4xl">
              {item.name}
            </h1>
            <p className="text-lg text-muted-foreground">{item.brand}</p>
          </div>

          <div className="flex flex-col gap-1">
            <p className="flex flex-wrap items-baseline gap-x-2 tabular-nums">
              <span className="text-3xl leading-9 font-bold tracking-[-0.02em]">
                {formatPrice(perDay(item.dailyPrice, discount))}
              </span>
              <span className="text-muted-foreground">{t('catalogue.perDay')}</span>
              {discount > 0 && (
                <>
                  <s className="text-muted-foreground">{formatPrice(item.dailyPrice)}</s>
                  <span className="font-semibold text-success-strong dark:text-success">
                    −{discount}%
                  </span>
                </>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('item.depositLine', { amount: formatPrice(item.deposit) })}
            </p>
          </div>

          {/* Phones and tablets: under the price, since the photos sit above rather than beside. */}
          <p className="text-[15px] leading-6 sm:text-base lg:hidden">{item.description}</p>

          <div className="flex flex-col gap-6 border-t pt-6">
            <RentalLength chosenDays={days} onChoose={chooseLength} />

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">{t('item.dates.title')}</h2>
                <LiveIndicator />
              </div>
              {availability.isError && (
                <FormAlert>
                  {t('item.availabilityError')} {apiErrorMessage(availability.error)}
                </FormAlert>
              )}
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger
                  className={cn(
                    'grid w-full grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 rounded-xl border bg-background px-4 py-2.5 text-left transition-colors outline-none hover:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                    (calendarOpen || datesError) && 'border-ring',
                    datesError && 'border-destructive',
                  )}
                >
                  <CalendarRange
                    className="size-5 text-primary dark:text-accent-foreground"
                    aria-hidden
                  />
                  <span className="sr-only">{t('item.dates.open')}:</span>
                  <DateValue
                    label={t('item.dates.pickUp')}
                    value={range?.from ? formatDate(range.from) : undefined}
                  />
                  <DateValue
                    label={t('item.dates.return')}
                    value={range?.to ? formatDate(range.to) : undefined}
                    divider
                  />
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) max-w-[calc(100vw-2rem)] min-w-72 sm:max-w-md">
                  <DateRangeCalendar
                    selected={range}
                    onSelect={selectRange}
                    booked={booked}
                    firstDay={firstDay}
                    lastDay={lastDay}
                    month={month}
                    onMonthChange={setMonth}
                    onPreviewChange={setPreview}
                    className={cn('border-0 p-0', availability.isPending && 'animate-pulse')}
                  />
                  <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
                    {awaitingReturn
                      ? previewDays
                        ? t('item.quote.previewDays', { count: previewDays })
                        : t('item.quote.pickReturn')
                      : complete
                        ? t('item.dates.startOver')
                        : t('item.quote.pickDates')}
                  </p>
                </PopoverContent>
              </Popover>
            </div>
          </div>

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
          >
            {/* Phones book from the bar pinned to the bottom instead. */}
            <div className="hidden flex-col gap-2 lg:flex">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <BookButton {...bookProps} className="h-12 rounded-xl text-base" />
                <AddToCart
                  item={item}
                  access={booking.access}
                  from={from}
                  to={to}
                  blocked={bookBlocked}
                  className="h-12 rounded-xl px-4 text-base"
                />
              </div>
              <BookNote access={booking.access} />
            </div>
            {(booking.access === 'guest' || booking.access === 'staff') && (
              <div className="lg:hidden">
                <BookNote access={booking.access} />
              </div>
            )}
          </QuoteCard>
        </div>
      </div>

      <ItemTabs item={item} chosenDays={chosenDays} />

      <RelatedItems item={item} icon={icon} />

      <MobileBookBar
        {...bookProps}
        error={complete ? quoteError : undefined}
        extra={
          <AddToCart
            item={item}
            access={booking.access}
            from={from}
            to={to}
            blocked={bookBlocked}
            compact
          />
        }
      />
    </>
  )
}

/** A Lucide icon passed around as a value, e.g. the category's. */
function IconOf({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return <Icon className={className} aria-hidden />
}

/** One half of the dates field: "Pick-up" over the day, or a muted "Choose". */
function DateValue({
  label,
  value,
  divider,
}: {
  label: string
  value?: string
  divider?: boolean
}) {
  const { t } = useTranslation()
  return (
    <span className={cn('flex min-w-0 flex-col', divider && 'border-l pl-3')}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          'truncate text-[15px] leading-6 font-semibold',
          !value && 'text-muted-foreground',
        )}
      >
        {value ?? t('item.dates.choose')}
      </span>
    </span>
  )
}

/** Whether the chosen dates are free, next to the category; nothing before dates are chosen. */
function DatesStatus({ free, taken }: { free: boolean; taken: boolean }) {
  const { t } = useTranslation()
  if (!free && !taken) return null
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm leading-5 font-medium',
        free
          ? 'bg-success/10 text-success-strong dark:text-success'
          : 'bg-destructive/10 text-destructive',
      )}
    >
      {free ? (
        <CircleCheck className="size-4" aria-hidden />
      ) : (
        <CalendarX className="size-4" aria-hidden />
      )}
      {free ? t('item.status.free') : t('item.status.taken')}
    </span>
  )
}

/**
 * Rental lengths as chips, like a shop's size picker: one per discount step (1, 3, 7, 14 days)
 * with what it saves. A chip picks that many days from the chosen pick-up day, or from today.
 */
function RentalLength({
  chosenDays,
  onChoose,
}: {
  chosenDays: number | undefined
  onChoose: (days: number) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-semibold">{t('item.length.title')}</h2>
      <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap">
        {discountRows.map((row) => {
          const active = chosenDays === row.minDays
          return (
            <button
              key={row.minDays}
              type="button"
              aria-pressed={active}
              onClick={() => onChoose(row.minDays)}
              className={cn(
                'flex flex-col items-center rounded-xl border px-2 py-2 transition-colors outline-none hover:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-w-20 sm:px-3',
                active && 'border-primary bg-primary text-primary-foreground hover:border-primary',
              )}
            >
              <span className="text-sm font-semibold">
                {t('item.length.days', { count: row.minDays })}
              </span>
              <span
                className={cn(
                  'text-xs',
                  active
                    ? 'text-primary-foreground/85'
                    : row.percent > 0
                      ? 'font-semibold text-success-strong dark:text-success'
                      : 'text-muted-foreground',
                )}
              >
                {row.percent > 0 ? `−${row.percent}%` : t('item.length.full')}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

type TabId = 'specs' | 'discounts' | 'terms'

/** Specifications, discounts and rental terms as tabs under the product, like a shop's details. */
function ItemTabs({ item, chosenDays }: { item: ItemDetailsDto; chosenDays?: number }) {
  const { t } = useTranslation()
  const baseId = useId()
  const tabs: { id: TabId; label: string }[] = [
    ...(item.specifications.length > 0
      ? [
          {
            id: 'specs' as const,
            label: t('item.tabs.specs', { count: item.specifications.length }),
          },
        ]
      : []),
    { id: 'discounts', label: t('item.tabs.discounts') },
    { id: 'terms', label: t('item.tabs.terms') },
  ]
  const [active, setActive] = useState<TabId>(tabs[0].id)

  // Arrow keys move between tabs, as the WAI-ARIA tabs pattern expects.
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.findIndex((tab) => tab.id === active)
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = tabs[(index + step + tabs.length) % tabs.length]
    setActive(next.id)
    document.getElementById(`${baseId}-${next.id}-tab`)?.focus()
  }

  return (
    <section className="mt-14 sm:mt-20">
      <div
        role="tablist"
        aria-label={t('item.tabs.label')}
        onKeyDown={onKeyDown}
        className="flex gap-6 overflow-x-auto overflow-y-hidden border-b sm:gap-10"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active
          return (
            <button
              key={tab.id}
              id={`${baseId}-${tab.id}-tab`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-${tab.id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className={cn(
                '-mb-px shrink-0 border-b-2 border-transparent pb-3 text-base whitespace-nowrap text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground sm:text-lg',
                selected && 'border-foreground font-semibold text-foreground',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div
        id={`${baseId}-${active}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-${active}-tab`}
        tabIndex={0}
        className="pt-6 outline-none sm:pt-8"
      >
        {active === 'specs' && <ItemSpecifications specifications={item.specifications} />}
        {active === 'discounts' && (
          <DiscountBars dailyPrice={item.dailyPrice} chosenDays={chosenDays} />
        )}
        {active === 'terms' && <RentalTerms item={item} />}
      </div>
    </section>
  )
}

/** The rules around a rental: deposit, late returns and cancelling, as three tiles. */
function RentalTerms({ item }: { item: ItemDetailsDto }) {
  const { t } = useTranslation()
  const { formatPrice } = useFormat()
  const terms: { icon: LucideIcon; title: string; text: ReactNode }[] = [
    { icon: ShieldCheck, title: t('item.terms.deposit'), text: t('item.terms.depositText') },
    {
      icon: Clock,
      title: t('item.terms.late', { amount: formatPrice(item.lateFeePerDay) }),
      text: t('item.terms.lateText'),
    },
    { icon: CalendarX, title: t('item.terms.cancel'), text: t('item.terms.cancelText') },
  ]

  return (
    <ul className="grid gap-4 sm:grid-cols-3">
      {terms.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex gap-3 rounded-2xl border bg-card p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-primary dark:text-accent-foreground">
            <Icon className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-semibold">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Up to four other items from the same category, most rented first. */
function RelatedItems({ item, icon }: { item: ItemDetailsDto; icon: LucideIcon }) {
  const { t } = useTranslation()
  const related = useGetApiItems({ CategoryId: item.categoryId, PageSize: 5, Sort: 'popularity' })
  const others = (related.data?.items ?? []).filter((other) => other.id !== item.id).slice(0, 4)

  if (others.length === 0) return null
  return (
    <section aria-labelledby="related-title" className="mt-14 sm:mt-20">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h2
          id="related-title"
          className="text-2xl leading-8 font-bold tracking-[-0.02em] sm:text-3xl sm:leading-10"
        >
          {t('item.related.title', { category: item.categoryName })}
        </h2>
        <Link
          to={`/catalogue?category=${item.categoryId}`}
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline dark:text-accent-foreground"
        >
          {t('item.related.all')}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      <ul className={cn(itemGridClass, 'md:grid-cols-4')}>
        {others.map((other) => (
          <li key={other.id}>
            <ItemCard item={other} icon={icon} />
          </li>
        ))}
      </ul>
    </section>
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

/** The category's slug, for its icon; categories are usually cached from the catalogue. */
function useCategorySlug(categoryId: number) {
  const categories = useGetApiCategories()
  return categories.data?.find((c) => c.id === categoryId)?.slug
}

/** The price per day after a discount of `percent`. */
function perDay(dailyPrice: number, percent: number) {
  return Math.round(dailyPrice * (100 - percent)) / 100
}

/**
 * The Discounts tab: the longer-rental discounts as bars, like a ratings breakdown: the best discount large on the
 * left, one bar per rental length on the right with its price per day. The row the chosen dates
 * fall in is marked.
 */
function DiscountBars({ dailyPrice, chosenDays }: { dailyPrice: number; chosenDays?: number }) {
  const { t } = useTranslation()
  const { formatPrice } = useFormat()
  const rows = [...discountRows].reverse()

  return (
    <div>
      <p className="text-sm text-muted-foreground">{t('item.discounts.text')}</p>
      <div className="mt-6 grid items-center gap-6 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-8">
        <div className="flex flex-col items-center text-center sm:border-r sm:pr-8">
          <p className="text-5xl leading-none font-bold tracking-[-0.03em] tabular-nums">
            −{TOP_DISCOUNT}%
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('item.discounts.best', { count: discountRows[discountRows.length - 1].minDays })}
          </p>
        </div>

        <table className="w-full text-sm">
          <caption className="sr-only">{t('item.tabs.discounts')}</caption>
          <thead className="sr-only">
            <tr>
              <th scope="col">{t('item.discounts.length')}</th>
              <th scope="col">{t('item.discounts.discount')}</th>
              <th scope="col">{t('item.discounts.perDay')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const chosen = chosenDays !== undefined && rowIncludes(row, chosenDays)
              return (
                <tr key={row.minDays} className={cn(chosen && 'font-semibold')}>
                  <th
                    scope="row"
                    className="w-24 py-1.5 pr-3 text-left font-medium whitespace-nowrap"
                  >
                    {row.maxDays === undefined
                      ? t('item.discounts.atLeast', { count: row.minDays })
                      : t('item.discounts.between', { from: row.minDays, count: row.maxDays })}
                  </th>
                  <td className="py-1.5">
                    <span className="flex items-center gap-2">
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <span
                          className={cn(
                            'block h-full rounded-full',
                            row.percent === 0
                              ? 'bg-muted-foreground/40'
                              : chosen
                                ? 'bg-primary'
                                : 'bg-success',
                          )}
                          style={{ width: `${Math.max(row.percent / TOP_DISCOUNT, 0.06) * 100}%` }}
                        />
                      </span>
                      <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                        {row.percent > 0 ? `−${row.percent}%` : '0%'}
                      </span>
                    </span>
                  </td>
                  <td className="w-24 py-1.5 pl-3 text-right whitespace-nowrap tabular-nums">
                    {formatPrice(perDay(dailyPrice, row.percent))}
                    {chosen && <span className="sr-only"> ({t('item.discounts.yourDates')})</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {chosenDays !== undefined && (
        <p className="mt-4 flex items-center gap-2 border-t pt-4 text-sm text-muted-foreground">
          <span aria-hidden className="size-2 rounded-full bg-primary" />
          {t('item.discounts.chosen', { count: chosenDays })}
        </p>
      )}
    </div>
  )
}

function ItemSkeleton() {
  const { t } = useTranslation()

  return (
    <>
      <div aria-hidden className="full-bleed mb-6 bg-band sm:mb-10">
        <div className="container-page py-5">
          <div className="h-5 w-64 animate-pulse rounded-sm bg-band-raised-2" />
        </div>
      </div>
      <div aria-busy className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <span className="sr-only" role="status">
          {t('layout.loading')}
        </span>
        <div aria-hidden className="aspect-4/3 animate-pulse rounded-2xl bg-muted" />
        <div aria-hidden className="flex flex-col gap-4">
          <div className="h-7 w-28 animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-3/4 animate-pulse rounded-md bg-muted" />
          <div className="h-5 w-24 animate-pulse rounded-sm bg-muted" />
          <div className="mt-2 h-9 w-40 animate-pulse rounded-md bg-muted" />
          <div className="h-16 w-full animate-pulse rounded-md bg-muted" />
          <div className="mt-4 h-16 w-2/3 animate-pulse rounded-xl bg-muted" />
          <div className="h-14 w-full animate-pulse rounded-xl bg-muted" />
          <div className="h-48 w-full animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </>
  )
}

function ItemError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useTranslation()

  return (
    <>
      <PageHeader
        title={t('item.errorTitle')}
        trail={[{ label: t('nav.catalogue'), to: '/catalogue' }]}
      />
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
    </>
  )
}
