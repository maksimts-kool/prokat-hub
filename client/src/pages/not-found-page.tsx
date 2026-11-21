import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div>
      <PageHeader title={t('notFound.title')} description={t('notFound.description')} />
      <Button asChild variant="outline">
        <Link to="/">{t('notFound.backHome')}</Link>
      </Button>
    </div>
  )
}
