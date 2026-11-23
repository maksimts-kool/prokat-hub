import { useTranslation } from 'react-i18next'
import { ComingSoon } from '@/pages/dashboard/coming-soon'

/** Rental desk for staff and admins. */
export function DeskPage() {
  const { t } = useTranslation()

  return <ComingSoon title={t('dashboard.sections.desk')} text={t('desk.placeholder')} />
}
