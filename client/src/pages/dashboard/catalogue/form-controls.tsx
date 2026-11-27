import { type ComponentProps, type ReactNode, useId } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const control =
  'w-full min-w-0 rounded-lg border border-input bg-background px-2.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40'

/** The label above and the hint or error below a control, linked with `aria-describedby`. */
function Field({
  label,
  error,
  hint,
  className,
  children,
}: {
  label: string
  error?: string
  hint?: string
  className?: string
  children: (ids: { id: string; describedBy?: string }) => ReactNode
}) {
  const id = useId()
  const message = error ?? hint
  const messageId = `${id}-message`

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} className="leading-5">
        {label}
      </Label>
      {children({ id, describedBy: message ? messageId : undefined })}
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

interface TextareaFieldProps extends ComponentProps<'textarea'> {
  label: string
  error?: string
  hint?: string
}

/** A labelled textarea for React Hook Form, like `FormField`: spread `register('name')` into it. */
export function TextareaField({ label, error, hint, className, ...props }: TextareaFieldProps) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      {({ id, describedBy }) => (
        <textarea
          id={id}
          rows={4}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(control, 'py-2')}
          {...props}
        />
      )}
    </Field>
  )
}

interface SelectFieldProps extends ComponentProps<'select'> {
  label: string
  error?: string
  hint?: string
}

/** A labelled native select for React Hook Form; the options are its children. */
export function SelectField({ label, error, hint, className, ...props }: SelectFieldProps) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      {({ id, describedBy }) => (
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(control, 'h-9')}
          {...props}
        />
      )}
    </Field>
  )
}
