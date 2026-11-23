import { useTranslation } from 'react-i18next'
import type { RentalStatus } from '@/api/generated/model'
import { cn } from '@/lib/utils'

/** A solid fill and its on-colour per status. Each badge carries its word, so colour is never the only signal. */
const tones: Record<RentalStatus, string> = {
  Booked: 'bg-primary text-primary-foreground',
  Issued: 'bg-highlight text-on-highlight',
  Returned: 'bg-success-strong text-success-foreground',
  Overdue: 'bg-destructive text-destructive-foreground',
  Cancelled: 'bg-muted-foreground text-background',
}

/** A rental's status as a solid pill with a dot and its word. */
export function StatusBadge({ status, className }: { status: RentalStatus; className?: string }) {
  const { t } = useTranslation()

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs leading-4 font-semibold whitespace-nowrap',
        tones[status],
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {t(`rentalStatus.${status}`)}
    </span>
  )
}
