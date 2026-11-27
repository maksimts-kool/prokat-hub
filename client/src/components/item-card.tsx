import { CalendarX, CircleCheck, Tag, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState, type RefObject, type TransitionEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { ItemSummaryDto } from '@/api/generated/model'
import { useFormat } from '@/i18n/format'
import { discountTiers } from '@/lib/discount-tiers'
import { useReducedMotion } from '@/lib/use-reduced-motion'
import { cn } from '@/lib/utils'

/** The best longer-rental discount, shown on every card as "up to 30% off". */
const TOP_DISCOUNT = discountTiers[discountTiers.length - 1].percent

/** How long each photo stays on a card before the next one slides in. */
const PHOTO_MS = 3500

/**
 * The list an ItemCard sits in. Phones: two columns edge to edge, split by hairlines like a shop
 * app. From 640px the cells become separate rounded cards; add the column count for the page.
 */
export const itemGridClass =
  'grid grid-cols-2 border-t max-sm:-mx-4 max-sm:*:border-b max-sm:*:odd:border-r sm:gap-4 sm:border-t-0'

interface ItemCardProps {
  item: ItemSummaryDto
  /** The category's icon, shown when the item has no photo and in the category pill. */
  icon: LucideIcon
  /** Dates chosen in the catalogue, passed on to the item page. */
  dates?: { from: string; to: string }
}

/** The item page's path, with the chosen dates so the booking form can start from them. */
function itemPath(id: number, dates?: { from: string; to: string }) {
  return dates ? `/catalogue/${id}?${new URLSearchParams(dates)}` : `/catalogue/${id}`
}

/**
 * One catalogue item, shop style: a dark category pill over the photo, the name, the daily price
 * with the longer-rental discount, and the deposit (or whether the chosen dates are free).
 * The whole card is one link to the item page.
 */
export function ItemCard({ item, icon: Icon, dates }: ItemCardProps) {
  const { t } = useTranslation()
  const { formatPrice } = useFormat()
  const [hovered, setHovered] = useState(false)
  // Null when no dates were asked about.
  const booked = item.isAvailable === false
  const free = item.isAvailable === true
  const path = itemPath(item.id, dates)
  // Names usually start with the brand already ("Sony A7 IV"); add it only when they don't.
  const title = item.name.toLowerCase().startsWith(item.brand.toLowerCase())
    ? item.name
    : `${item.brand} ${item.name}`

  return (
    <article
      // A mouse over the card holds its photo still; touch has no hover.
      onPointerEnter={(event) => event.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className="group relative flex h-full flex-col bg-card p-3 text-card-foreground transition-shadow has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-inset sm:rounded-xl sm:border sm:p-4 sm:hover:shadow-lg sm:hover:shadow-foreground/5"
    >
      <span className="inline-flex max-w-full items-center gap-1 self-start rounded-md bg-foreground px-2 py-1 text-xs leading-4 font-semibold text-background sm:text-sm sm:leading-5">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">{item.categoryName}</span>
      </span>

      <CardPhotos urls={item.imageUrls} icon={Icon} dimmed={booked} paused={hovered} />

      <h3 className="mt-3 line-clamp-2 min-h-12 text-[15px] leading-6 sm:text-base">
        {/* The whole card is clickable through this link's ::after. */}
        <Link to={path} className="outline-none after:absolute after:inset-0 after:content-['']">
          {title}
        </Link>
      </h3>

      <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 tabular-nums">
        <span className="text-lg leading-7 font-bold tracking-[-0.01em] sm:text-xl">
          {formatPrice(item.dailyPrice)}
        </span>
        <span className="text-sm text-muted-foreground">{t('catalogue.perDay')}</span>
        <span className="text-sm font-semibold text-success-strong dark:text-success">
          {t('catalogue.upToOff', { percent: TOP_DISCOUNT })}
        </span>
      </p>

      <p
        className={cn(
          'mt-auto flex items-center gap-1.5 pt-2 text-xs sm:text-sm',
          booked
            ? 'text-destructive'
            : free
              ? 'text-success-strong dark:text-success'
              : 'text-foreground',
        )}
      >
        {booked ? (
          <CalendarX className="size-3.5 shrink-0" aria-hidden />
        ) : free ? (
          <CircleCheck className="size-3.5 shrink-0" aria-hidden />
        ) : (
          <Tag className="size-3.5 shrink-0 fill-current" aria-hidden />
        )}
        <span className="min-w-0 truncate">
          {booked
            ? t('catalogue.bookedForDates')
            : free
              ? t('catalogue.freeForDates')
              : t('catalogue.depositAndMore', { amount: formatPrice(item.deposit) })}
        </span>
      </p>
    </article>
  )
}

interface CardPhotosProps {
  urls: string[]
  icon: LucideIcon
  /** Greyed out, for an item taken on the chosen dates. */
  dimmed: boolean
  paused: boolean
}

/** The wait between neighbouring cards' turns, so a row turns as a wave rather than all at once. */
const WAVE_MS = 400

/**
 * The card's photos, sliding to the next one every few seconds while the card is on screen, with
 * dots for where it is. It holds still under the mouse, off screen, and for visitors who asked
 * for less motion. Photos that fail to load are left out; with none, the category icon shows.
 */
function CardPhotos({ urls, icon: Icon, dimmed, paused }: CardPhotosProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { inView, seen } = useInView(ref)
  const reducedMotion = useReducedMotion()
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set())
  const photos = urls.filter((url) => !failed.has(url))
  const count = photos.length
  // 0…count, where count is a copy of the first photo at the end of the strip: sliding onto it and
  // jumping back to 0 unseen makes the loop seamless.
  const [step, setStep] = useState(0)
  const [sliding, setSliding] = useState(true)
  const position = Math.min(step, count)
  const turning = count > 1 && inView && !paused && !reducedMotion

  useEffect(() => {
    if (!turning || !ref.current) return
    const { left, width } = ref.current.getBoundingClientRect()
    const column = width > 0 ? Math.round(left / width) : 0
    let timer = 0
    const turn = () => {
      setSliding(true)
      setStep((before) => Math.min(before + 1, count))
      timer = window.setTimeout(turn, PHOTO_MS)
    }
    timer = window.setTimeout(turn, PHOTO_MS + column * WAVE_MS)
    return () => window.clearTimeout(timer)
  }, [turning, count])

  function onSlid(event: TransitionEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || position < count) return
    setSliding(false)
    setStep(0)
  }

  function onFail(url: string) {
    setFailed((before) => new Set(before).add(url))
  }

  // Until the card has been on screen only the cover loads; the rest follow once it shows.
  const strip = count > 1 && seen ? [...photos, photos[0]] : photos.slice(0, 1)

  return (
    <div
      ref={ref}
      className="relative mt-3 aspect-4/3 overflow-hidden rounded-lg text-muted-foreground"
    >
      {count > 0 ? (
        <div
          onTransitionEnd={onSlid}
          style={{ transform: `translateX(-${position * 100}%)` }}
          className={cn(
            'flex size-full',
            sliding && 'transition-transform duration-700 ease-in-out',
            dimmed && 'opacity-50 grayscale',
          )}
        >
          {strip.map((url, index) => (
            <img
              // The copy at the end shares the cover's URL, so the key is the place in the strip.
              key={index}
              src={url}
              alt=""
              loading={index === 0 ? 'lazy' : undefined}
              onError={() => onFail(url)}
              className="size-full shrink-0 object-contain transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
            />
          ))}
        </div>
      ) : (
        <span className="flex size-full items-center justify-center bg-muted">
          <Icon className="size-12" strokeWidth={1.5} aria-hidden />
        </span>
      )}

      {count > 1 && (
        <span
          aria-hidden
          className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-background/80 px-1.5 py-1"
        >
          {photos.map((url, index) => (
            <span
              key={url}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                index === position % count ? 'w-3.5 bg-foreground' : 'w-1.5 bg-foreground/30',
              )}
            />
          ))}
        </span>
      )}
    </div>
  )
}

/** Whether the element is mostly on screen now, and whether it ever has been. */
function useInView(ref: RefObject<HTMLElement | null>) {
  const [state, setState] = useState({ inView: false, seen: false })

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) =>
        setState((before) =>
          entry.isIntersecting ? { inView: true, seen: true } : { ...before, inView: false },
        ),
      { threshold: 0.6 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return state
}

/** A grey placeholder in the shape of an ItemCard, shown while the catalogue loads. */
export function ItemCardSkeleton() {
  return (
    <div aria-hidden className="flex h-full flex-col bg-card p-3 sm:rounded-xl sm:border sm:p-4">
      <div className="h-6 w-20 animate-pulse rounded-md bg-muted" />
      <div className="mt-3 aspect-4/3 animate-pulse rounded-lg bg-muted" />
      <div className="mt-3 h-4 w-11/12 animate-pulse rounded-sm bg-muted" />
      <div className="mt-2 h-4 w-2/3 animate-pulse rounded-sm bg-muted" />
      <div className="mt-3 h-6 w-1/2 animate-pulse rounded-sm bg-muted" />
      <div className="mt-3 h-3 w-3/4 animate-pulse rounded-sm bg-muted" />
    </div>
  )
}
