import { ChartColumn } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/page-header'

/** Reports for admins. */
export function ReportsPage() {
  const { t } = useTranslation()

  return (
    <PageHeader
      icon={ChartColumn}
      title={t('reports.title')}
      description={t('reports.placeholder')}
    />
  )
}
