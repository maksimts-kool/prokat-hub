import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'

/** Shown on a page the signed-in user's role may not open. */
export function ForbiddenPage() {
  const { t } = useTranslation()

  return (
    <>
      <PageHeader title={t('forbidden.title')} description={t('forbidden.description')} />
      <div>
        <Button asChild variant="outline" size="lg" className="px-4">
          <Link to="/">{t('forbidden.backHome')}</Link>
        </Button>
      </div>
    </>
  )
}
