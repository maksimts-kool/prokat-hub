import { cn } from '@/lib/utils'

/** A pulsing `muted` block that holds the place of content still loading. */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn('animate-pulse rounded-sm bg-muted', className)}
      {...props}
    />
  )
}

export { Skeleton }
