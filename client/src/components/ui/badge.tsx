import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs leading-4 font-semibold whitespace-nowrap [&_svg:not([class*='size-'])]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        /** Categories and plain labels. */
        neutral: 'border-border bg-background text-foreground',
        /** Selected filters. */
        accent: 'border-primary bg-primary text-primary-foreground',
        /** Discounts. */
        highlight: 'border-highlight bg-highlight text-on-highlight',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

/** A small solid pill label. Every tone is a solid fill with its own text colour. */
export function Badge({
  className,
  tone,
  ...props
}: ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props} />
}
