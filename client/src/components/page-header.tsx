import { ChevronRight, House } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

export interface Crumb {
  label: string
  to: string
}

interface PageHeaderProps {
  title: string
  /** Pages between home and this one in the breadcrumb, e.g. the dashboard above My rentals. */
  trail?: Crumb[]
  /** This page's name in the breadcrumb when it differs from the title, e.g. under a greeting. */
  crumb?: string
  description?: ReactNode
  /** A band illustration on the right; hidden below the lg breakpoint. */
  illustration?: ReactNode
}

/**
 * The dark band at the top of every inner page, edge to edge: breadcrumb, title, description, a
 * page illustration. Its content lines up with the page's content column. It has
 * no buttons: the page's actions live in its content below.
 */
export function PageHeader({ title, trail, crumb, description, illustration }: PageHeaderProps) {
  return (
    <section className="full-bleed relative mb-8 overflow-hidden bg-band text-band-foreground sm:mb-12 [&:not(.page-grid>*)]:rounded-2xl">
      {/* A soft glow behind the illustration, as on the home page's band. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-24 size-[28rem] rounded-full bg-band-raised blur-3xl lg:size-[36rem]"
      />
      <div className="relative container-page grid py-8 sm:py-10 lg:min-h-80 lg:grid-cols-[minmax(0,1fr)_420px] lg:py-12 xl:grid-cols-[minmax(0,1fr)_500px]">
        <div className="relative z-10 flex min-w-0 flex-col items-start justify-center">
          <BandBreadcrumb trail={trail} current={crumb ?? title} />

          <h1 className="mt-3 max-w-full text-4xl font-extrabold tracking-[-0.03em] break-words sm:text-5xl lg:text-[56px] lg:leading-[60px]">
            {title}
          </h1>

          {description && (
            <p className="mt-3 max-w-150 text-band-muted sm:text-xl sm:leading-[30px]">
              {description}
            </p>
          )}
        </div>

        {illustration && (
          <div className="relative hidden lg:block">
            <div className="absolute right-0 -bottom-12 w-[440px] xl:w-[520px]">{illustration}</div>
          </div>
        )}
      </div>
    </section>
  )
}

/**
 * Home › trail › this page, in the band's colours. The last crumb is cut short with an ellipsis
 * when it does not fit.
 */
export function BandBreadcrumb({ trail, current }: { trail?: Crumb[]; current: string }) {
  const { t } = useTranslation()

  return (
    <nav aria-label={t('layout.breadcrumb')} className="max-w-full">
      <ol className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-band-muted sm:text-base">
        <li>
          <Link
            to="/"
            aria-label={t('nav.home')}
            className="flex rounded-sm text-band-accent outline-none hover:text-band-foreground focus-visible:ring-3 focus-visible:ring-band-accent"
          >
            <House className="size-5" aria-hidden />
          </Link>
        </li>
        {trail?.map((crumb) => (
          <Fragment key={crumb.to}>
            <li aria-hidden>
              <ChevronRight className="size-4" />
            </li>
            <li>
              <Link
                to={crumb.to}
                className="rounded-sm outline-none hover:text-band-foreground focus-visible:ring-3 focus-visible:ring-band-accent"
              >
                {crumb.label}
              </Link>
            </li>
          </Fragment>
        ))}
        <li aria-hidden>
          <ChevronRight className="size-4" />
        </li>
        <li aria-current="page" className="min-w-0 truncate">
          {current}
        </li>
      </ol>
    </nav>
  )
}
