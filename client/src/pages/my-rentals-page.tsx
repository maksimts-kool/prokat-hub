import { CalendarCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/page-header'

export function MyRentalsPage() {
  const { t } = useTranslation()

  return (
    <PageHeader
      icon={CalendarCheck}
      title={t('rentals.title')}
      description={t('rentals.placeholder')}
    />
  )
}
