import { useTranslation } from 'react-i18next'
import { ComingSoon } from '@/pages/dashboard/coming-soon'

/** Reports for admins. */
export function ReportsPage() {
  const { t } = useTranslation()

  return <ComingSoon title={t('dashboard.sections.reports')} text={t('reports.placeholder')} />
}
