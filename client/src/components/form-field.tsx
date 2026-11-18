import type { LucideIcon } from 'lucide-react'
import { type ComponentProps, useId } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FormFieldProps extends ComponentProps<'input'> {
  label: string
  /** Icon inside the input, on the left. */
  icon?: LucideIcon
  /** Replaces the hint and marks the input invalid. */
  error?: string
  hint?: string
}

/**
 * A labelled input with a hint or an error, for React Hook Form: spread `register('name')` into it.
 * The message is linked to the input with `aria-describedby` so screen readers read it.
 */
export function FormField({
  label,
  icon: Icon,
  error,
  hint,
  id,
  className,
  ...props
}: FormFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const message = error ?? hint
  const messageId = `${inputId}-message`

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={inputId} className="leading-5">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          className={cn('h-9 bg-background', Icon && 'pl-9')}
          {...props}
        />
        {Icon && (
          <Icon
            className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground"
            aria-hidden
          />
        )}
      </div>
      {message && (
        <p
          id={messageId}
          className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}
        >
          {message}
        </p>
      )}
    </div>
  )
}
