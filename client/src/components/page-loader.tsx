import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** Spinner shown in place of a page while the signed-in user is being loaded. */
export function PageLoader() {
  const { t } = useTranslation()

  return (
    <div role="status" className="flex min-h-64 items-center justify-center text-muted-foreground">
      <Loader2 className="size-6 animate-spin" aria-hidden />
      <span className="sr-only">{t('layout.loading')}</span>
    </div>
  )
}
