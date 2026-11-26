import { House, MapPinOff, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'

/** Any address the router doesn't know, inside the site's header and footer. */
export function NotFoundPage() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  return (
    <>
      <PageHeader title={t('notFound.title')} description={t('notFound.description')} />
      <section
        aria-label={t('notFound.title')}
        className="mx-auto flex max-w-lg flex-col items-center py-8 text-center sm:py-12"
      >
        <span className="mb-6 flex size-16 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <MapPinOff className="size-8" aria-hidden />
        </span>
        <p className="text-6xl font-extrabold tracking-[-0.03em] text-primary tabular-nums dark:text-accent-foreground">
          404
        </p>
        <p className="mt-1 text-sm break-all text-muted-foreground">
          {t('notFound.path', { path: pathname })}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="px-4">
            <Link to="/">
              <House aria-hidden />
              {t('notFound.backHome')}
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="px-4">
            <Link to="/catalogue">
              <Search aria-hidden />
              {t('notFound.browse')}
            </Link>
          </Button>
        </div>
      </section>
    </>
  )
}
