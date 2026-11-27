import { useQueries, useQueryClient } from '@tanstack/react-query'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  Loader2,
  LogIn,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { apiErrorMessage } from '@/api/error-message'
import { useGetApiCategories } from '@/api/generated/categories/categories'
import {
  getGetApiItemsIdAvailabilityQueryKey,
  getGetApiItemsIdAvailabilityQueryOptions,
  getGetApiItemsQueryKey,
} from '@/api/generated/items/items'
import type { RentalQuoteDto } from '@/api/generated/model'
import {
  getGetApiRentalsMyQueryKey,
  getGetApiRentalsQuoteQueryKey,
  getGetApiRentalsQuoteQueryOptions,
  postApiRentals,
} from '@/api/generated/rentals/rentals'
import { isApiError } from '@/api/http-client'
import { errorsShownInline } from '@/api/query-client'
import { authPath } from '@/auth/return-path'
import { useCart, type CartLine } from '@/cart/cart-context'
import { useBookingAccess } from '@/components/booking/use-book-item'
import { categoryIcon } from '@/components/category-icon'
import { FormAlert } from '@/components/form-alert'
import { CatalogueIllustration } from '@/components/illustrations/catalogue-illustration'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useFormat } from '@/i18n/format'
import { bookingDatesError } from '@/lib/booking-schema'
import { cn } from '@/lib/utils'

/** A cart line with what the server says about it now. */
interface LineState {
  line: CartLine
  icon: LucideIcon
  quote: RentalQuoteDto | undefined
  /** Why the line cannot be booked: past dates, taken dates, a failed quote or booking. */
  problem: string | undefined
  loading: boolean
}

/**
 * `/cart`: the items the user picked with their dates, each quoted again by the server and checked
 * against the booked days, a summary, and one button that books them all (one rental each).
 * Guests may fill the cart; booking it sends them to the login page and back.
 */
export function CartPage() {
  const { t } = useTranslation()
  const cart = useCart()
  const categories = useGetApiCategories()
  // Problems from the last "Book all", by item: they stay until the line changes or is booked.
  const [failed, setFailed] = useState<Record<number, string>>({})

  const datesErrors = cart.lines.map((line) => bookingDatesError(t, line))
  const quotes = useQueries({
    queries: cart.lines.map((line, i) =>
      getGetApiRentalsQuoteQueryOptions(
        { ItemId: line.itemId, From: line.from, To: line.to },
        { query: { enabled: !datesErrors[i], meta: errorsShownInline } },
      ),
    ),
  })
  const availability = useQueries({
    queries: cart.lines.map((line, i) =>
      getGetApiItemsIdAvailabilityQueryOptions(
        line.itemId,
        { From: line.from, To: line.to },
        { query: { enabled: !datesErrors[i], meta: errorsShownInline } },
      ),
    ),
  })

  const states: LineState[] = cart.lines.map((line, i) => {
    const quote = quotes[i]
    const booked = availability[i]?.data?.bookedRanges ?? []
    const clash = booked.some((b) => line.from <= b.endDate && b.startDate <= line.to)
    const problem =
      datesErrors[i] ??
      (clash ? t('cart.taken') : undefined) ??
      failed[line.itemId] ??
      (quote?.isError ? apiErrorMessage(quote.error) : undefined)
    const slug = categories.data?.find((c) => c.id === line.categoryId)?.slug
    return {
      line,
      icon: categoryIcon(slug),
      quote: quote?.data,
      problem,
      loading: !datesErrors[i] && (quote?.isPending || availability[i]?.isPending),
    }
  })
  const ready = states.filter((s) => !s.problem && !s.loading && s.quote)
  const total = ready.reduce((sum, s) => sum + s.quote!.totalPrice, 0)
  const deposits = ready.reduce((sum, s) => sum + s.quote!.deposit, 0)

  function remove(itemId: number) {
    cart.remove(itemId)
    setFailed((current) => {
      const next = { ...current }
      delete next[itemId]
      return next
    })
  }

  return (
    <>
      <PageHeader
        title={t('cart.title')}
        description={t('cart.description')}
        illustration={<CatalogueIllustration className="w-full" />}
      />

      {cart.lines.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
          <section aria-labelledby="cart-lines" className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="cart-lines" className="text-xl leading-7 font-bold tracking-[-0.01em]">
                {t('cart.lines', { count: cart.lines.length })}
              </h2>
              <Button type="button" variant="ghost" size="sm" onClick={cart.clear}>
                {t('cart.clear')}
              </Button>
            </div>
            <ul className="flex flex-col gap-4">
              {states.map((state) => (
                <li key={state.line.itemId}>
                  <CartLineCard state={state} onRemove={() => remove(state.line.itemId)} />
                </li>
              ))}
            </ul>
          </section>

          <Summary
            states={states}
            ready={ready}
            total={total}
            deposits={deposits}
            onFailed={(next) => setFailed(next)}
          />
        </div>
      )}
    </>
  )
}

/** One item in the cart: photo, name, dates, its price for them, and change dates or remove. */
function CartLineCard({ state, onRemove }: { state: LineState; onRemove: () => void }) {
  const { t } = useTranslation()
  const { formatPrice, formatDate } = useFormat()
  const { line, icon: Icon, quote, problem, loading } = state
  const [imageFailed, setImageFailed] = useState(false)
  const days = differenceInCalendarDays(parseISO(line.to), parseISO(line.from)) + 1
  const itemPath = `/catalogue/${line.itemId}?${new URLSearchParams({ from: line.from, to: line.to })}`

  return (
    <article
      className={cn(
        'grid grid-cols-[88px_minmax(0,1fr)] gap-4 rounded-2xl border bg-card p-4 text-card-foreground sm:grid-cols-[132px_minmax(0,1fr)_auto] sm:gap-5 sm:p-5',
        problem && 'border-destructive/50',
      )}
    >
      <Link
        to={itemPath}
        tabIndex={-1}
        aria-hidden
        className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border bg-white text-muted-foreground sm:row-span-2"
      >
        {line.imageUrl && !imageFailed ? (
          <img
            src={line.imageUrl}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
            className={cn('size-full object-contain p-2', problem && 'opacity-50 grayscale')}
          />
        ) : (
          <Icon className="size-10" strokeWidth={1.5} />
        )}
      </Link>

      <div className="flex min-w-0 flex-col items-start gap-2">
        <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-foreground px-2 py-1 text-xs leading-4 font-semibold text-background">
          <Icon className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{line.categoryName}</span>
        </span>
        <h3 className="line-clamp-2 text-base leading-6 font-semibold sm:text-lg sm:leading-7">
          <Link to={itemPath} className="hover:text-primary dark:hover:text-accent-foreground">
            {line.name}
          </Link>
        </h3>
        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {t('catalogue.dateRange', { from: formatDate(line.from), to: formatDate(line.to) })}
            {' · '}
            {t('cart.days', { count: days })}
          </span>
        </p>
      </div>

      <div className="col-span-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 tabular-nums sm:col-span-1 sm:col-start-3 sm:flex-col sm:items-end sm:justify-start">
        {loading ? (
          <span className="h-7 w-24 animate-pulse rounded-sm bg-muted" aria-hidden />
        ) : quote && !problem ? (
          <>
            <span className="text-xl leading-7 font-bold tracking-[-0.01em]">
              {formatPrice(quote.totalPrice)}
            </span>
            <span className="flex items-center gap-1.5 text-sm">
              {quote.discountPercent > 0 && (
                <>
                  <s className="text-muted-foreground">{formatPrice(quote.subtotal)}</s>
                  <span className="font-semibold text-success-strong dark:text-success">
                    {t('cart.off', { percent: quote.discountPercent })}
                  </span>
                </>
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              {t('cart.depositLine', { amount: formatPrice(quote.deposit) })}
            </span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">
            {t('cart.perDay', { price: formatPrice(line.dailyPrice) })}
          </span>
        )}
      </div>

      {problem && (
        <p
          role="alert"
          className="col-span-2 flex items-start gap-2 text-sm text-destructive sm:col-span-2 sm:col-start-2"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {problem}
        </p>
      )}

      <div className="col-span-2 flex flex-wrap gap-2 border-t pt-3 sm:col-span-2 sm:col-start-2 sm:border-t-0 sm:pt-0">
        <Button asChild variant={problem ? 'default' : 'outline'} size="sm">
          <Link to={itemPath}>
            <CalendarRange aria-hidden />
            {t('cart.changeDates')}
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 aria-hidden />
          {t('cart.remove')}
        </Button>
      </div>
    </article>
  )
}

interface SummaryProps {
  states: LineState[]
  ready: LineState[]
  total: number
  deposits: number
  onFailed: (failed: Record<number, string>) => void
}

/** The totals of the lines that can be booked and the button that books them, one rental each. */
function Summary({ states, ready, total, deposits, onFailed }: SummaryProps) {
  const { t } = useTranslation()
  const { formatPrice } = useFormat()
  const access = useBookingAccess()
  const cart = useCart()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [pending, setPending] = useState(false)

  const subtotal = ready.reduce((sum, s) => sum + s.quote!.subtotal, 0)
  const discount = ready.reduce((sum, s) => sum + s.quote!.discountAmount, 0)
  const waiting = states.some((s) => s.loading)
  const skipped = states.filter((s) => s.problem).length

  async function bookAll() {
    if (access === 'guest') {
      void navigate(authPath('/cart'))
      return
    }
    if (access !== 'customer' || pending || ready.length === 0) return

    setPending(true)
    const failed: Record<number, string> = {}
    let booked = 0
    // One at a time, so a clash on one item leaves the others booked and its message is clear.
    for (const { line } of ready) {
      try {
        await postApiRentals({ itemId: line.itemId, from: line.from, to: line.to })
        cart.remove(line.itemId)
        booked++
      } catch (error) {
        failed[line.itemId] =
          isApiError(error) && error.status === 409 ? t('cart.taken') : apiErrorMessage(error)
      }
      void queryClient.invalidateQueries({
        queryKey: getGetApiItemsIdAvailabilityQueryKey(line.itemId),
      })
    }
    setPending(false)
    onFailed(failed)
    void queryClient.invalidateQueries({ queryKey: getGetApiRentalsMyQueryKey() })
    void queryClient.invalidateQueries({ queryKey: getGetApiItemsQueryKey() })
    void queryClient.invalidateQueries({ queryKey: getGetApiRentalsQuoteQueryKey() })

    if (booked > 0) toast.success(t('cart.booked', { count: booked }))
    if (Object.keys(failed).length === 0) void navigate('/dashboard/rentals')
    else toast.error(t('cart.someFailed', { count: Object.keys(failed).length }))
  }

  return (
    <aside
      aria-labelledby="cart-summary"
      className="flex flex-col gap-5 rounded-2xl border bg-card p-5 text-card-foreground sm:p-6 lg:sticky lg:top-28"
    >
      <h2 id="cart-summary" className="text-xl leading-7 font-bold tracking-[-0.01em]">
        {t('cart.summary.title')}
      </h2>

      <dl className="flex flex-col gap-3 text-sm tabular-nums">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">
            {t('cart.summary.rental', { count: ready.length })}
          </dt>
          <dd>{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t('cart.summary.discount')}</dt>
          <dd className={cn(discount > 0 && 'font-semibold text-success-strong dark:text-success')}>
            {discount > 0 ? `−${formatPrice(discount)}` : formatPrice(0)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t pt-4">
          <dt className="text-base font-semibold">{t('cart.summary.total')}</dt>
          <dd className="text-2xl leading-8 font-bold tracking-[-0.01em]">{formatPrice(total)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl bg-muted px-3 py-2.5">
          <dt className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-primary dark:text-accent-foreground" aria-hidden />
            {t('cart.summary.deposit')}
          </dt>
          <dd className="font-semibold">{formatPrice(deposits)}</dd>
        </div>
      </dl>

      {discount > 0 && (
        <Badge tone="highlight" className="self-start">
          {t('cart.summary.saved', { amount: formatPrice(discount) })}
        </Badge>
      )}

      {skipped > 0 && <FormAlert>{t('cart.summary.skipped', { count: skipped })}</FormAlert>}

      <Button
        type="button"
        size="lg"
        className="h-12 w-full rounded-xl text-base"
        disabled={
          pending ||
          access === 'staff' ||
          access === 'loading' ||
          (access === 'customer' && (waiting || ready.length === 0))
        }
        aria-busy={pending}
        onClick={() => void bookAll()}
      >
        {pending ? (
          <Loader2 className="animate-spin" aria-hidden />
        ) : access === 'guest' ? (
          <LogIn aria-hidden />
        ) : (
          <CalendarCheck aria-hidden />
        )}
        {access === 'guest'
          ? t('item.booking.logInToBook')
          : t('cart.summary.book', { count: ready.length, price: formatPrice(total) })}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {access === 'guest'
          ? t('cart.summary.guestNote')
          : access === 'staff'
            ? t('item.booking.staffNote')
            : t('cart.summary.note')}
      </p>
    </aside>
  )
}

/** Nothing in the cart yet: a short line and the way to the catalogue. */
function EmptyCart() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-muted text-primary dark:text-accent-foreground">
        <ShoppingCart className="size-9" strokeWidth={1.5} aria-hidden />
      </span>
      <h2 className="text-2xl leading-8 font-bold tracking-[-0.02em]">{t('cart.empty.title')}</h2>
      <p className="max-w-md text-muted-foreground">{t('cart.empty.text')}</p>
      <Button asChild size="lg" className="mt-2 h-12 rounded-xl px-6 text-base">
        <Link to="/catalogue">
          {t('cart.empty.cta')}
          <ArrowRight aria-hidden />
        </Link>
      </Button>
    </div>
  )
}
