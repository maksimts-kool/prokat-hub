import { ChevronRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

interface PageHeaderProps {
  title: string
  description?: ReactNode
  icon?: LucideIcon
}

/** Banner at the top of an inner page: icon, title, breadcrumb and an optional description. */
export function PageHeader({ title, description, icon: Icon }: PageHeaderProps) {
  const { t } = useTranslation()

  return (
    <section className="relative isolate mb-10 overflow-hidden rounded-2xl bg-accent px-6 py-12 text-center sm:py-16">
      {/* Soft brand-coloured shapes behind the text. */}
      <div
        aria-hidden
        className="absolute -top-16 -left-16 -z-10 size-56 rounded-full bg-primary/15 blur-2xl"
      />
      <div
        aria-hidden
        className="absolute -right-10 -bottom-20 -z-10 size-64 rounded-full bg-highlight/20 blur-2xl"
      />

      {Icon && (
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25">
          <Icon className="size-6" aria-hidden />
        </div>
      )}

      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>

      <nav aria-label={t('layout.breadcrumb')} className="mt-3">
        <ol className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link to="/" className="transition-colors hover:text-primary">
              {t('nav.home')}
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-3.5" />
          </li>
          <li aria-current="page" className="font-medium text-foreground">
            {title}
          </li>
        </ol>
      </nav>

      {description && <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{description}</p>}
    </section>
  )
}
