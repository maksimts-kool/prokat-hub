import { CalendarCheck, Loader2, LogIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { RentalQuoteDto } from '@/api/generated/model'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { BookingAccess } from '@/components/booking/use-book-item'
import { useFormat } from '@/i18n/format'
import { cn } from '@/lib/utils'

interface BookButtonProps {
  access: BookingAccess
  /** The quote for the chosen dates; the button names its total. */
  quote: RentalQuoteDto | undefined
  /** True when the dates cannot be booked yet: none chosen, a clash, or a quote still loading. */
  blocked: boolean
  pending: boolean
  onBook: () => void
  className?: string
}

/** "Book for €252.00": the main action of the booking column. Guests get "Log in to book". */
export function BookButton({
  access,
  quote,
  blocked,
  pending,
  onBook,
  className,
}: BookButtonProps) {
  const { t } = useTranslation()
  const { formatPrice } = useFormat()
  const guest = access === 'guest'

  return (
    <Button
      type="button"
      size="lg"
      className={cn('w-full', className)}
      disabled={blocked || pending || access === 'staff' || access === 'loading'}
      aria-busy={pending}
      onClick={onBook}
    >
      {pending ? (
        <Loader2 className="animate-spin" aria-hidden />
      ) : guest ? (
        <LogIn aria-hidden />
      ) : (
        <CalendarCheck aria-hidden />
      )}
      {guest
        ? t('item.booking.logInToBook')
        : quote && !blocked
          ? t('item.booking.bookFor', { price: formatPrice(quote.totalPrice) })
          : t('item.booking.book')}
    </Button>
  )
}

/** Why the button leads to the login page, or why it is off, under the button. */
export function BookNote({ access }: { access: BookingAccess }) {
  const { t } = useTranslation()

  if (access !== 'guest' && access !== 'staff') return null
  return (
    <p className="text-center text-xs text-muted-foreground">
      {access === 'guest' ? t('item.booking.guestNote') : t('item.booking.staffNote')}
    </p>
  )
}

interface MobileBookBarProps extends BookButtonProps {
  /** The problem with the chosen dates, shown in place of the summary. */
  error: string | undefined
}

/** Phones: the total and the Book button pinned to the bottom while the page scrolls. */
export function MobileBookBar({ error, className, ...button }: MobileBookBarProps) {
  const { t } = useTranslation()
  const { formatPrice } = useFormat()
  const { quote, blocked } = button
  const priced = quote && !blocked

  return (
    <div
      className={cn(
        'sticky bottom-0 z-10 -mx-4 mt-8 flex items-center justify-between gap-3 border-t bg-background px-4 pt-3 pb-5 sm:-mx-6 sm:px-6 lg:hidden',
        className,
      )}
    >
      <div className="min-w-0" aria-live="polite">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : priced ? (
          <>
            <p className="text-xl leading-7 font-bold tabular-nums">
              {formatPrice(quote.totalPrice)}
            </p>
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {t('item.booking.summary', {
                count: quote.days,
                deposit: formatPrice(quote.deposit),
              })}
              {quote.discountPercent > 0 && (
                <Badge tone="highlight">−{quote.discountPercent}%</Badge>
              )}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t('item.chooseDates')}</p>
        )}
      </div>
      <BookButton {...button} className="w-auto shrink-0 px-6" quote={undefined} />
    </div>
  )
}
