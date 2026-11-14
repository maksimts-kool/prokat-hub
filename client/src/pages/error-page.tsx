import { useTranslation } from 'react-i18next'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { Button } from '@/components/ui/button'

/** Shown when rendering a route throws. */
export function ErrorPage() {
  const { t } = useTranslation()
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : t('error.unknown')

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">{t('error.title')}</h1>
      <p className="text-muted-foreground">{message}</p>
      <Button asChild>
        <Link to="/">{t('error.backHome')}</Link>
      </Button>
    </div>
  )
}
