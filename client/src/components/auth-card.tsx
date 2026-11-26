import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { RentalsIllustration } from '@/components/illustrations/rentals-illustration'
import { PageHeader } from '@/components/page-header'

export interface AuthPerk {
  icon: LucideIcon
  title: string
  text: string
}

interface AuthCardProps {
  title: string
  description: string
  /** The form column's own heading and line under it, e.g. "Welcome back". */
  formTitle: string
  formText: string
  /** The form. */
  children: ReactNode
  /** The link to the other form, under a rule at the bottom. */
  footer: ReactNode
  /** The purple panel on the right: what an account is for. Under the form on phones. */
  aside: {
    title: string
    perks: AuthPerk[]
    note?: ReactNode
  }
}

/**
 * The split card shared by Log in and Create an account, under the page's full-width band: a roomy
 * form left, a dark panel right in the header's band colours. The band holds the page's h1, so the card's titles are h2s.
 */
export function AuthCard({
  title,
  description,
  formTitle,
  formText,
  children,
  footer,
  aside,
}: AuthCardProps) {
  return (
    <>
      <PageHeader
        title={title}
        description={description}
        illustration={<RentalsIllustration className="w-full" />}
      />
      <div className="relative z-10 mx-auto grid w-full max-w-[1120px] overflow-hidden rounded-3xl border bg-card text-card-foreground shadow-2xl shadow-foreground/5 lg:-mt-24 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <section className="flex flex-col justify-center gap-8 px-5 py-8 sm:px-12 sm:py-14 lg:min-h-[600px] lg:px-16">
          <div>
            <h2 className="text-3xl leading-9 font-bold tracking-[-0.02em] sm:text-4xl sm:leading-11">
              {formTitle}
            </h2>
            <p className="mt-2 text-muted-foreground sm:text-lg">{formText}</p>
          </div>

          {children}

          <p className="border-t pt-6 text-center text-muted-foreground">{footer}</p>
        </section>

        <aside className="relative flex flex-col gap-8 overflow-hidden bg-band px-5 py-8 text-band-foreground sm:px-12 sm:py-14 lg:px-14">
          {/* The same soft violet glow as the band above. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-20 -right-20 size-72 rounded-full bg-band-accent/20 blur-3xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-28 -left-16 size-72 rounded-full bg-primary/25 blur-3xl"
          />
          <h2 className="relative max-w-[360px] text-2xl leading-8 font-bold tracking-[-0.02em] sm:text-3xl sm:leading-10">
            {aside.title}
          </h2>
          <ul className="relative flex flex-col gap-6">
            {aside.perks.map(({ icon: Icon, title: perkTitle, text }) => (
              <li key={perkTitle} className="flex gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-band-line bg-band-raised text-band-accent">
                  <Icon className="size-6" aria-hidden />
                </span>
                <div>
                  <p className="text-lg leading-7 font-semibold">{perkTitle}</p>
                  <p className="text-band-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
          {aside.note && (
            <p className="relative mt-auto rounded-2xl border border-band-line bg-band-raised p-5 text-band-foreground">
              {aside.note}
            </p>
          )}
        </aside>
      </div>
    </>
  )
}
