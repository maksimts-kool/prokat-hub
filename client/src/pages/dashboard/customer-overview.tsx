import { differenceInCalendarDays } from 'date-fns'
import { CalendarPlus, PackageOpen, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { apiErrorMessage } from '@/api/error-message'
import type { RentalDto } from '@/api/generated/model'
import { LoadingRegion, PanelSkeleton } from '@/components/skeletons'
import { useDateRange } from '@/components/rentals/use-date-range'
import { Button } from '@/components/ui/button'
import { useFormat } from '@/i18n/format'
import { daysLate } from '@/lib/rentals'
import { EmptyState, LoadError, Panel, RentalThumb } from '@/pages/dashboard/dashboard-ui'
import { useCustomerRentals } from '@/pages/dashboard/use-dashboard-data'

function NextPickup({ rental, today }: { rental?: RentalDto; today: string }) {
  const { t } = useTranslation()
  const { formatPrice, formatDate } = useFormat()
  const range = useDateRange()

  if (!rental) {
    return (
      <Panel title={t('dashboard.customer.nextPickup')}>
        <EmptyState
          icon={CalendarPlus}
          title={t('dashboard.customer.noUpcoming')}
          text={t('dashboard.customer.noUpcomingText')}
        >
          <Button asChild size="lg" className="px-4">
            <Link to="/catalogue">
              <Search aria-hidden />
              {t('home.browse')}
            </Link>
          </Button>
        </EmptyState>
      </Panel>
    )
  }

  const inDays = differenceInCalendarDays(rental.startDate, today)
  const when =
    inDays <= 0
      ? t('dashboard.customer.pickUpToday')
      : t('dashboard.customer.pickUpIn', { count: inDays, date: formatDate(rental.startDate) })

  return (
    <Panel title={t('dashboard.customer.nextPickup')}>
      <div className="flex gap-4">
        <RentalThumb src={rental.itemImageUrl} className="size-20" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/catalogue/${rental.itemId}`}
              className="truncate text-base font-semibold hover:text-primary"
            >
              {rental.itemName}
            </Link>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {range(rental.startDate, rental.endDate)} ·{' '}
            {t('item.quote.previewDays', { count: rental.days })}
          </p>
          <p className="mt-2 text-sm font-medium text-primary">{when}</p>
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 rounded-lg bg-muted p-4 text-sm">
        <div>
          <dt className="text-muted-foreground">{t('item.quote.total')}</dt>
          <dd className="text-xl leading-7 font-bold tabular-nums">
            {formatPrice(rental.totalPrice)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('rentals.depositLabel')}</dt>
          <dd className="text-xl leading-7 font-bold tabular-nums">
            {formatPrice(rental.deposit)}
          </dd>
        </div>
        <p className="col-span-2 text-xs text-muted-foreground">
          {t('dashboard.customer.depositNote')}
        </p>
      </dl>
    </Panel>
  )
}

function WithYou({ rentals, today }: { rentals: RentalDto[]; today: string }) {
  const { t } = useTranslation()
  const { formatDate, formatPrice } = useFormat()

  return (
    <Panel title={t('dashboard.customer.withYou')}>
      {rentals.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title={t('dashboard.customer.nothingOut')}
          text={t('dashboard.customer.nothingOutText')}
        />
      ) : (
        <ul className="flex flex-col divide-y">
          {rentals.map((rental) => {
            const late = daysLate(rental, today)
            return (
              <li key={rental.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <RentalThumb src={rental.itemImageUrl} className="size-12" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{rental.itemName}</p>
                  <p
                    className={
                      late
                        ? 'text-xs font-medium text-destructive'
                        : 'text-xs text-muted-foreground'
                    }
                  >
                    {late
                      ? rental.lateFeeTotal > 0
                        ? t('dashboard.customer.lateWithFees', {
                            count: late,
                            amount: formatPrice(rental.lateFeeTotal),
                          })
                        : t('dashboard.customer.lateBy', { count: late })
                      : rental.endDate === today
                        ? t('dashboard.customer.returnToday')
                        : t('dashboard.customer.returnBy', { date: formatDate(rental.endDate) })}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

/** A customer's overview: the next pickup and what they have now. The full list is in My rentals. */
export function CustomerOverview() {
  const { query, upcoming, withYou, today } = useCustomerRentals()

  if (query.isPending) {
    return (
      <LoadingRegion className="grid gap-6 xl:grid-cols-2">
        <PanelSkeleton rows={2} thumb />
        <PanelSkeleton rows={2} thumb />
      </LoadingRegion>
    )
  }
  if (query.isError && !query.data) {
    return <LoadError message={apiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <NextPickup rental={upcoming[0]} today={today} />
      <WithYou rentals={withYou} today={today} />
    </div>
  )
}
