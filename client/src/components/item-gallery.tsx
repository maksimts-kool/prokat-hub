import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useReducedMotion } from '@/lib/use-reduced-motion'
import { cn } from '@/lib/utils'

interface ItemGalleryProps {
  name: string
  imageUrls: string[]
  /** The category's icon, shown when the item has no photo that loads. */
  icon: LucideIcon
}

/**
 * The item page's photos: a large stage that swipes (or scrolls with the arrows) from photo to
 * photo, and a row of thumbnails under it. Photos are shown whole on a plain stage, never cropped.
 * Photos that fail to load are left out.
 */
export function ItemGallery({ name, imageUrls, icon: Icon }: ItemGalleryProps) {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  const trackRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set())
  const [current, setCurrent] = useState(0)
  const photos = imageUrls.filter((url) => !failed.has(url))
  const count = photos.length
  const shown = Math.min(current, Math.max(count - 1, 0))

  if (count === 0) {
    return (
      <div className="flex aspect-4/3 items-center justify-center rounded-2xl border bg-white p-6 text-muted-foreground sm:p-10">
        <span className="flex size-full items-center justify-center rounded-xl bg-muted">
          <Icon className="size-24" strokeWidth={1.25} aria-hidden />
        </span>
      </div>
    )
  }

  function goTo(index: number) {
    const track = trackRef.current
    if (!track) return
    const next = (index + count) % count
    track.scrollTo({
      left: next * track.clientWidth,
      behavior: reducedMotion ? 'instant' : 'smooth',
    })
    setCurrent(next)
  }

  /** The stage is a scroll-snap strip, so swipes and the arrows end on whole photos. */
  function onScroll() {
    const track = trackRef.current
    if (!track || track.clientWidth === 0) return
    setCurrent(Math.round(track.scrollLeft / track.clientWidth))
  }

  function onFail(url: string) {
    setFailed((before) => new Set(before).add(url))
  }

  return (
    <div role="region" aria-label={t('item.gallery.label', { name })}>
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={onScroll}
          tabIndex={count > 1 ? 0 : undefined}
          className="flex aspect-4/3 snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto overflow-y-hidden overscroll-x-contain rounded-2xl border bg-white outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((url, index) => (
            <div
              key={url}
              className="flex size-full shrink-0 snap-center items-center justify-center p-4 sm:p-8"
            >
              <img
                src={url}
                alt={count > 1 ? t('item.gallery.photo', { name, index: index + 1, count }) : name}
                onError={() => onFail(url)}
                className="size-full rounded-lg object-contain"
              />
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <StageArrow
              side="left"
              label={t('item.gallery.previous')}
              onClick={() => goTo(shown - 1)}
            />
            <StageArrow
              side="right"
              label={t('item.gallery.next')}
              onClick={() => goTo(shown + 1)}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-foreground/80 px-2.5 py-1 text-xs font-semibold text-background tabular-nums"
            >
              {shown + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
          {photos.map((url, index) => (
            <button
              key={url}
              type="button"
              aria-label={t('item.gallery.show', { index: index + 1, count })}
              aria-current={index === shown || undefined}
              onClick={() => goTo(index)}
              className={cn(
                'flex aspect-4/3 items-center justify-center overflow-hidden rounded-xl border bg-white p-1.5 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                index === shown
                  ? 'border-primary ring-1 ring-primary'
                  : 'hover:border-foreground/30',
              )}
            >
              <img src={url} alt="" className="size-full rounded-md object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function StageArrow({
  side,
  label,
  onClick,
}: {
  side: 'left' | 'right'
  label: string
  onClick: () => void
}) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight

  return (
    // A plain chevron on the stage: no circle behind it, and no press nudge, which would fight the centring.
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'absolute top-1/2 flex h-12 w-10 -translate-y-1/2 items-center justify-center rounded-md text-foreground/60 transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 max-sm:hidden',
        side === 'left' ? 'left-1' : 'right-1',
      )}
    >
      <Icon className="size-8" strokeWidth={1.75} aria-hidden />
      <span className="sr-only">{label}</span>
    </button>
  )
}
