import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { ItemSummaryDto } from '@/api/generated/model'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useFormat } from '@/i18n/format'

interface ItemCardProps {
  item: ItemSummaryDto
  /** The category's icon, shown on `muted` when the item has no photo. */
  icon: LucideIcon
  /** Dates chosen in the catalogue, passed on to the item page. */
  dates?: { from: string; to: string }
}

/** The item page's path, with the chosen dates so the booking form can start from them. */
function itemPath(id: number, dates?: { from: string; to: string }) {
  return dates ? `/catalogue/${id}?${new URLSearchParams(dates)}` : `/catalogue/${id}`
}

/** One catalogue item: photo or category icon, category, brand, name, daily price, deposit and Book. */
export function ItemCard({ item, icon: Icon, dates }: ItemCardProps) {
  const { t } = useTranslation()
  const { formatPrice } = useFormat()
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = item.imageUrl && !imageFailed
  // Null when no dates were asked about: then the item is shown as bookable.
  const booked = item.isAvailable === false
  const path = itemPath(item.id, dates)

  return (
    <article className="relative flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground transition-colors hover:border-[color-mix(in_oklch,var(--border),var(--foreground)_20%)] has-focus-visible:border-ring has-focus-visible:ring-2 has-focus-visible:ring-ring">
      <div className="relative flex aspect-3/2 items-center justify-center border-b bg-muted text-muted-foreground">
        {showImage ? (
          <img
            src={item.imageUrl!}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="size-full object-cover"
          />
        ) : (
          <Icon className="size-12" strokeWidth={1.5} aria-hidden />
        )}
        <Badge className="absolute top-3 left-3">{item.categoryName}</Badge>
        {booked && (
          <Badge className="absolute top-3 right-3">{t('catalogue.bookedForDates')}</Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-0.5 p-4">
        <p className="text-xs text-muted-foreground">{item.brand}</p>
        <h3 className="min-h-11 text-base leading-[22px] font-semibold">
          {/* The whole card is clickable through this link's ::after; Book sits above it. */}
          <Link to={path} className="outline-none after:absolute after:inset-0 after:content-['']">
            {item.name}
          </Link>
        </h3>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
          <div>
            <p className="text-xl leading-7 font-bold tracking-[-0.01em]">
              {formatPrice(item.dailyPrice)}
              <span className="text-sm font-normal tracking-normal text-muted-foreground">
                {' '}
                {t('catalogue.perDay')}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {t('catalogue.deposit', { amount: formatPrice(item.deposit) })}
            </p>
          </div>
          <Button
            asChild
            size="lg"
            variant={booked ? 'outline' : 'default'}
            className="relative z-10 px-4"
          >
            <Link to={path} tabIndex={-1} aria-hidden>
              {booked ? t('catalogue.otherDates') : t('catalogue.book')}
            </Link>
          </Button>
        </div>
      </div>
    </article>
  )
}

/** A grey placeholder in the shape of an ItemCard, shown while the catalogue loads. */
export function ItemCardSkeleton() {
  return (
    <div aria-hidden className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <div className="aspect-3/2 animate-pulse border-b bg-muted" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-3 w-16 animate-pulse rounded-sm bg-muted" />
        <div className="h-5 w-3/4 animate-pulse rounded-sm bg-muted" />
        <div className="mt-4 flex items-end justify-between">
          <div className="h-7 w-24 animate-pulse rounded-sm bg-muted" />
          <div className="h-9 w-16 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  )
}
