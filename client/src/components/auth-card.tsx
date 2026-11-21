import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export interface AuthPerk {
  icon: LucideIcon
  title: string
  text: string
}

interface AuthCardProps {
  title: string
  description: string
  /** The form. */
  children: ReactNode
  /** The link to the other form, under a rule at the bottom. */
  footer: ReactNode
  /** The purple panel on the right: what an account is for. Hidden on phones. */
  aside: {
    title: string
    perks: AuthPerk[]
    note?: ReactNode
  }
}

/** The split card shared by Log in and Create an account: the form left, a `primary` panel right. */
export function AuthCard({ title, description, children, footer, aside }: AuthCardProps) {
  return (
    <div className="mx-auto grid max-w-[980px] overflow-hidden rounded-xl border bg-card text-card-foreground sm:mt-6 md:grid-cols-2">
      <section className="flex flex-col gap-5 p-6 sm:p-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>

        {children}

        <p className="border-t pt-5 text-center text-sm text-muted-foreground">{footer}</p>
      </section>

      <aside className="hidden flex-col gap-6 bg-primary p-12 text-primary-foreground md:flex">
        <h2 className="max-w-[340px] text-2xl font-semibold">{aside.title}</h2>
        <ul className="flex flex-col gap-5">
          {aside.perks.map(({ icon: Icon, title: perkTitle, text }) => (
            <li key={perkTitle} className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-foreground text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-semibold">{perkTitle}</p>
                <p className="text-sm">{text}</p>
              </div>
            </li>
          ))}
        </ul>
        {aside.note && (
          <p className="mt-auto rounded-xl bg-background p-4 text-sm text-foreground">
            {aside.note}
          </p>
        )}
      </aside>
    </div>
  )
}
