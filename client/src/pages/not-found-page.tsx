import { House, MapPinOff, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'

/** Any address the router doesn't know, inside the site's header and footer. */
export function NotFoundPage() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  return (
    <section
      aria-labelledby="not-found-title"
      className="mx-auto flex max-w-lg flex-col items-center py-16 text-center sm:py-24"
    >
      <span className="mb-6 flex size-16 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <MapPinOff className="size-8" aria-hidden />
      </span>
      <p className="text-sm font-semibold tracking-widest text-primary tabular-nums">404</p>
      <h1 id="not-found-title" className="mt-2 text-3xl leading-9 font-semibold tracking-tight">
        {t('notFound.title')}
      </h1>
      <p className="mt-3 text-muted-foreground">{t('notFound.description')}</p>
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
  )
}
