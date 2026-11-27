import { CalendarX2, Search, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { apiErrorMessage } from '@/api/error-message'
import type { RentalDto } from '@/api/generated/model'
import { LoadingRegion, PillTabsSkeleton } from '@/components/skeletons'
import { Skeleton } from '@/components/ui/skeleton'
import { useCancelRental } from '@/components/rentals/use-cancel-rental'
import { useDateRange } from '@/components/rentals/use-date-range'
import { StatusBadge } from '@/components/status-badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useFormat } from '@/i18n/format'
import { cn } from '@/lib/utils'
import { daysLate, inGroup, type RentalGroup } from '@/lib/rentals'
import { EmptyState, LoadError, PillTabs, RentalThumb } from '@/pages/dashboard/dashboard-ui'
import { useCustomerRentals } from '@/pages/dashboard/use-dashboard-data'

type Tab = 'all' | RentalGroup
const tabs: Tab[] = ['all', 'upcoming', 'active', 'past']

function isTab(value: string | null): value is Tab {
  return tabs.includes(value as Tab)
}

function CancelButton({
  rental,
  pending,
  onConfirm,
}: {
  rental: RentalDto
  pending: boolean
  onConfirm: () => void
}) {
  const { t } = useTranslation()
  const range = useDateRange()

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="lg" className="px-3" disabled={pending}>
          {pending ? t('rentals.cancel.pending') : t('rentals.cancel.button')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('rentals.cancel.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('rentals.cancel.text', {
              item: rental.itemName,
              dates: range(rental.startDate, rental.endDate),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('rentals.cancel.keep')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-[color-mix(in_oklch,var(--destructive),var(--foreground)_14%)]"
          >
            {t('rentals.cancel.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function RentalRow({
  rental,
  today,
  pendingId,
  onCancel,
}: {
  rental: RentalDto
  today: string
  pendingId?: number
  onCancel: (rental: RentalDto) => void
}) {
  const { t } = useTranslation()
  const { formatPrice, formatDate } = useFormat()
  const range = useDateRange()
  // A line under the dates only when it adds something the row doesn't already show.
  const noteText =
    rental.status === 'Booked' && rental.startDate <= today
      ? t('rentals.note.pickUpNow')
      : rental.status === 'Returned'
        ? t('rentals.note.depositRefunded')
        : undefined
  const late = daysLate(rental, today)
  const cancelled = rental.status === 'Cancelled'

  return (
    <li
      className={cn(
        'grid grid-cols-[56px_minmax(0,1fr)] gap-x-4 gap-y-4 rounded-xl border bg-card p-4 text-card-foreground sm:p-5 md:grid-cols-[64px_minmax(0,1fr)_auto_auto] md:items-center md:gap-x-5',
        late > 0 && 'border-destructive',
      )}
    >
      <RentalThumb src={rental.itemImageUrl} className="size-14 md:size-16" />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/catalogue/${rental.itemId}`}
            className="text-base leading-6 font-semibold hover:text-primary sm:text-lg sm:leading-7"
          >
            {rental.itemName}
          </Link>
          <StatusBadge status={rental.status} />
          {rental.discountPercent > 0 && !cancelled && (
            <Badge tone="highlight">−{rental.discountPercent}%</Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {range(rental.startDate, rental.endDate)} ·{' '}
          {t('item.quote.previewDays', { count: rental.days })} ·{' '}
          {t('rentals.number', { id: rental.id })}
        </p>

        {late > 0 ? (
          <div
            role="alert"
            className="mt-3 flex gap-2 rounded-lg border border-destructive bg-card p-3 text-[13px] leading-[18px]"
          >
            <TriangleAlert className="mt-px size-4 shrink-0 text-destructive" aria-hidden />
            {/* The late fees so far are in the money column; this says why and what each day costs. */}
            <p>
              {t('rentals.note.overdue', { date: formatDate(rental.endDate), count: late })}{' '}
              {t('rentals.note.lateFeeRate', { perDay: formatPrice(rental.lateFeePerDay) })}
            </p>
          </div>
        ) : (
          noteText && <p className="mt-2 text-xs text-muted-foreground">{noteText}</p>
        )}
      </div>

      {/* From md the money and the action sit in their own columns; below, under the details. */}
      <div className="col-span-2 flex items-end justify-between gap-4 border-t pt-4 md:col-span-2 md:grid md:grid-cols-[140px_auto] md:items-center md:gap-5 md:border-0 md:pt-0">
        <div className="md:text-right">
          <p
            className={cn(
              'text-xl leading-7 font-bold tabular-nums',
              cancelled && 'text-muted-foreground line-through',
            )}
          >
            {formatPrice(rental.totalPrice)}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('rentals.deposit', { amount: formatPrice(rental.deposit) })}
          </p>
          {rental.lateFeeTotal > 0 && (
            <p className="text-xs font-medium text-destructive">
              {t('rentals.lateFee', { amount: formatPrice(rental.lateFeeTotal) })}
            </p>
          )}
        </div>

        <div className="flex justify-end md:min-w-36">
          {/* The item's name already links to its page, so only Booked rentals get a button. */}
          {rental.status === 'Booked' && (
            <CancelButton
              rental={rental}
              pending={pendingId === rental.id}
              onConfirm={() => onCancel(rental)}
            />
          )}
        </div>
      </div>
    </li>
  )
}

/** The tabs and three rental cards in the shape of {@link RentalRow}, while the list loads. */
function RentalsSkeleton() {
  return (
    <LoadingRegion>
      <PillTabsSkeleton />
      <ul className="flex flex-col gap-3">
        {['w-1/2', 'w-2/5', 'w-3/5'].map((width) => (
          <li
            key={width}
            className="grid grid-cols-[56px_minmax(0,1fr)] gap-x-4 gap-y-4 rounded-xl border bg-card p-4 sm:p-5 md:grid-cols-[64px_minmax(0,1fr)_140px] md:items-center md:gap-x-5"
          >
            <Skeleton className="size-14 rounded-lg md:size-16" />
            <div className="flex flex-col gap-2">
              <Skeleton className={`h-6 ${width}`} />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="col-span-2 flex flex-col gap-2 border-t pt-4 md:col-span-1 md:items-end md:border-0 md:pt-0">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </li>
        ))}
      </ul>
    </LoadingRegion>
  )
}

/** A customer's rentals, newest first, filtered by status group, with cancelling for Booked ones. */
export function MyRentalsPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const { query, rentals, today } = useCustomerRentals()
  const { cancel, pendingId } = useCancelRental()
  const tabParam = params.get('tab')
  const active: Tab = isTab(tabParam) ? tabParam : 'all'

  if (query.isPending) return <RentalsSkeleton />
  if (query.isError && !query.data) {
    return <LoadError message={apiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  if (rentals.length === 0) {
    return (
      <div className="rounded-xl border bg-card">
        <EmptyState
          icon={CalendarX2}
          title={t('rentals.empty.title')}
          text={t('rentals.empty.text')}
          className="py-14"
        >
          <Button asChild size="lg" className="px-4">
            <Link to="/catalogue">
              <Search aria-hidden />
              {t('home.browse')}
            </Link>
          </Button>
        </EmptyState>
      </div>
    )
  }

  const count = (tab: Tab) =>
    tab === 'all' ? rentals.length : rentals.filter((r) => inGroup(r.status, tab)).length
  const shown = active === 'all' ? rentals : rentals.filter((r) => inGroup(r.status, active))

  return (
    <div>
      <PillTabs
        label={t('rentals.tabsLabel')}
        tabs={tabs.map((tab) => ({ key: tab, label: t(`rentals.tabs.${tab}`), count: count(tab) }))}
        active={active}
        onChange={(tab) =>
          setParams(
            (prev) => {
              const next = new URLSearchParams(prev)
              if (tab === 'all') next.delete('tab')
              else next.set('tab', tab)
              return next
            },
            { replace: true },
          )
        }
        className="mb-5 w-fit"
      />

      <div role="tabpanel">
        {shown.length === 0 ? (
          <div className="rounded-xl border bg-card">
            <EmptyState icon={CalendarX2} title={t(`rentals.emptyTab.${active}`)} />
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {shown.map((rental) => (
              <RentalRow
                key={rental.id}
                rental={rental}
                today={today}
                pendingId={pendingId}
                onCancel={cancel}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
