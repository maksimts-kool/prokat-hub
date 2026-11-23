import { ArrowRight, Package, RotateCw, TriangleAlert, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** A dashboard card: a titled section on `card` with a 1px border and an optional link on the right. */
export function Panel({
  title,
  action,
  className,
  children,
}: {
  title: string
  action?: { label: string; to: string }
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn('rounded-xl border bg-card p-5 text-card-foreground sm:p-6', className)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 className="text-lg leading-7 font-semibold">{title}</h2>
        {action && (
          <Link
            to={action.to}
            className="flex shrink-0 items-center gap-1 rounded-sm text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {action.label}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

/** A friendly "nothing here" with an icon disc, a line of text and an optional next step. */
export function EmptyState({
  icon: Icon,
  title,
  text,
  children,
  className,
}: {
  icon: LucideIcon
  title: string
  text?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center gap-2 px-4 py-8 text-center', className)}>
      <span className="mb-1 flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Icon className="size-6" aria-hidden />
      </span>
      <p className="font-semibold">{title}</p>
      {text && <p className="max-w-sm text-sm text-muted-foreground">{text}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}

/** A failed request: what went wrong, outlined in `destructive`, with a retry. */
export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation()

  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-xl border border-destructive bg-card p-5 sm:flex-row sm:items-center"
    >
      <TriangleAlert className="size-5 shrink-0 text-destructive" aria-hidden />
      <p className="flex-1 text-sm">{message}</p>
      <Button variant="outline" size="lg" className="px-3" onClick={onRetry}>
        <RotateCw aria-hidden />
        {t('dashboard.retry')}
      </Button>
    </div>
  )
}

/** The item's photo, or a package on `muted` when it has none or it fails to load. */
export function RentalThumb({ src, className }: { src: string | null; className?: string }) {
  const [failed, setFailed] = useState(false)

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted text-muted-foreground',
        className,
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <Package className="size-1/2" strokeWidth={1.5} aria-hidden />
      )}
    </span>
  )
}

export interface PillTab<TKey extends string> {
  key: TKey
  label: string
  count?: number
}

/**
 * Filters a list inside a page with the same pill track as the main nav. The active tab is a
 * `primary` pill and each tab can carry a count in a small chip.
 */
export function PillTabs<TKey extends string>({
  tabs,
  active,
  onChange,
  label,
  className,
}: {
  tabs: PillTab<TKey>[]
  active: TKey
  onChange: (key: TKey) => void
  label: string
  className?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'flex max-w-full gap-1 overflow-x-auto rounded-full border bg-muted p-1',
        className,
      )}
    >
      {tabs.map((tab) => {
        const selected = tab.key === active
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.key)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              selected
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground/70 hover:text-primary',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'min-w-5 rounded-full px-1.5 text-center text-xs leading-5 font-semibold tabular-nums',
                  selected ? 'bg-primary-foreground text-primary' : 'bg-background text-foreground',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
