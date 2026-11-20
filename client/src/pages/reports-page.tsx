import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/page-header'

/** Reports for admins. */
export function ReportsPage() {
  const { t } = useTranslation()

  return <PageHeader title={t('reports.title')} description={t('reports.placeholder')} />
}
