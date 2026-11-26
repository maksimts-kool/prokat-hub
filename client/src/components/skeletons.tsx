import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * Wraps a page's skeleton so screen readers hear "Loading…" once, while the blocks inside stay
 * hidden from them.
 */
export function LoadingRegion({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const { t } = useTranslation()

  return (
    <div role="status" aria-busy className={className}>
      <span className="sr-only">{t('layout.loading')}</span>
      {children}
    </div>
  )
}

/** Widths that vary row to row, so a skeleton list doesn't look like a barcode. */
const widths = ['w-3/4', 'w-1/2', 'w-2/3', 'w-5/12', 'w-7/12']

/** A dashboard panel's shape: a title, then `rows` list rows with an optional thumbnail. */
export function PanelSkeleton({
  rows = 3,
  thumb = false,
  className,
}: {
  rows?: number
  thumb?: boolean
  className?: string
}) {
  return (
    <div className={cn('rounded-xl border bg-card p-5 sm:p-6', className)}>
      <Skeleton className="mb-5 h-6 w-40" />
      <ul className="flex flex-col divide-y">
        {Array.from({ length: rows }, (_, index) => (
          <li key={index} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            {thumb ? (
              <Skeleton className="size-12 shrink-0 rounded-lg" />
            ) : (
              <Skeleton className="h-4 w-12 shrink-0" />
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className={cn('h-4', widths[index % widths.length])} />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * A table on `card` from md up (muted header row, `rows` rows of `columns` cells) and stacked
 * cards below md, like the desk and catalogue tables.
 */
export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <div className="flex gap-6 border-b bg-muted px-5 py-3.5">
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton key={column} className="h-3 flex-1 bg-foreground/10" />
          ))}
        </div>
        <div className="divide-y">
          {Array.from({ length: rows }, (_, row) => (
            <div key={row} className="flex items-center gap-6 px-5 py-4">
              {Array.from({ length: columns }, (_, column) => (
                <div key={column} className="flex-1">
                  <Skeleton className={cn('h-4', widths[(row + column) % widths.length])} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {Array.from({ length: Math.min(rows, 4) }, (_, row) => (
          <li key={row} className="flex flex-col gap-2 rounded-xl border bg-card p-4">
            <Skeleton className={cn('h-5', widths[row % widths.length])} />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </li>
        ))}
      </ul>
    </>
  )
}

/** A row of pill tabs, as above the desk and My rentals lists. */
export function PillTabsSkeleton({ tabs = 4 }: { tabs?: number }) {
  return (
    <div className="mb-5 flex w-fit max-w-full gap-1 rounded-full border bg-muted p-1">
      {Array.from({ length: tabs }, (_, index) => (
        <Skeleton key={index} className="h-9 w-24 rounded-full bg-foreground/10" />
      ))}
    </div>
  )
}
