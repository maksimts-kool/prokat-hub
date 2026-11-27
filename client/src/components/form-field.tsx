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
  /** `lg` for the roomy login and register forms: a 48px input with 16px text. */
  inputSize?: 'default' | 'lg'
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
  inputSize = 'default',
  id,
  className,
  ...props
}: FormFieldProps) {
  const large = inputSize === 'lg'
  const generatedId = useId()
  const inputId = id ?? generatedId
  const message = error ?? hint
  const messageId = `${inputId}-message`

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={inputId} className={cn('leading-5', large && 'text-sm')}>
        {label}
      </Label>
      <div className="relative">
        <Input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          className={cn(
            'h-9 bg-background',
            Icon && 'pl-9',
            large && 'h-12 rounded-xl px-4 text-base md:text-base',
            large && Icon && 'pl-11',
          )}
          {...props}
        />
        {Icon && (
          <Icon
            className={cn(
              'pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground',
              large && 'top-3.5 left-4 size-5',
            )}
            aria-hidden
          />
        )}
      </div>
      {message && (
        <p
          id={messageId}
          className={cn(
            'text-xs',
            large && 'text-sm',
            error ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {message}
        </p>
      )}
    </div>
  )
}
