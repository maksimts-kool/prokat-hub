import { ClipboardList } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/page-header'

/** Rental desk for staff and admins. */
export function DeskPage() {
  const { t } = useTranslation()

  return (
    <PageHeader icon={ClipboardList} title={t('desk.title')} description={t('desk.placeholder')} />
  )
}
