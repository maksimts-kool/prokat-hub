import { ChevronRight, House, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

export interface PageHeaderStat {
  icon: LucideIcon
  value: ReactNode
  label: string
}

interface PageHeaderProps {
  title: string
  description?: ReactNode
  /** Real counts shown under the description, e.g. "33 items". */
  stats?: PageHeaderStat[]
  /** A band illustration on the right; hidden below the lg breakpoint. */
  illustration?: ReactNode
}

/**
 * The dark band at the top of an inner page: breadcrumb, title, description, a row of stats
 * and a page illustration. It has no buttons: the page's actions live in its content below.
 */
export function PageHeader({ title, description, stats, illustration }: PageHeaderProps) {
  const { t } = useTranslation()

  return (
    <section className="relative mb-6 grid overflow-hidden rounded-2xl bg-band px-5 py-8 text-band-foreground sm:mb-10 sm:px-10 sm:py-10 lg:min-h-80 lg:grid-cols-[minmax(0,1fr)_420px] lg:rounded-4xl lg:py-12 lg:pr-0 lg:pl-12 xl:grid-cols-[minmax(0,1fr)_500px]">
      <div className="relative z-10 flex flex-col items-start justify-center">
        <nav aria-label={t('layout.breadcrumb')}>
          <ol className="flex items-center gap-2.5 text-band-muted sm:text-base">
            <li>
              <Link
                to="/"
                aria-label={t('nav.home')}
                className="flex rounded-sm text-band-accent outline-none hover:text-band-foreground focus-visible:ring-3 focus-visible:ring-band-accent"
              >
                <House className="size-5" aria-hidden />
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="size-4" />
            </li>
            <li aria-current="page">{title}</li>
          </ol>
        </nav>

        <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl lg:text-[56px] lg:leading-[60px]">
          {title}
        </h1>

        {description && (
          <p className="mt-3 max-w-150 text-band-muted sm:text-xl sm:leading-[30px]">
            {description}
          </p>
        )}

        {stats && stats.length > 0 && (
          // Dividers only from xl, where the stats fit on one row; narrower, they wrap.
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-4 xl:gap-x-0">
            {stats.map(({ icon: Icon, value, label }) => (
              <li
                key={label}
                className="flex items-center gap-3 xl:px-6 xl:not-first:border-l xl:not-first:border-band-line xl:first:pl-0"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-band-raised-2 text-band-accent sm:size-11">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="flex flex-col gap-0.5">
                  <strong className="text-[22px] leading-7 font-bold tracking-[-0.02em] tabular-nums sm:text-[28px] sm:leading-8">
                    {value}
                  </strong>
                  <span className="text-sm text-band-muted">{label}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {illustration && (
        <div className="relative hidden lg:block">
          <div className="absolute right-0 -bottom-8 w-[440px] xl:w-[520px]">{illustration}</div>
        </div>
      )}
    </section>
  )
}
