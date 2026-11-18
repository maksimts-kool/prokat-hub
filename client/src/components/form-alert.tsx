import { TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

/** An error for the whole form, e.g. a wrong password: a card outlined in `destructive`. */
export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex gap-2 rounded-lg border border-destructive bg-card p-3 text-[13px] leading-[18px]"
    >
      <TriangleAlert className="mt-px size-4 shrink-0 text-destructive" aria-hidden />
      <p>{children}</p>
    </div>
  )
}
