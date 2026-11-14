import { LayoutGrid } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/page-header'

export function CataloguePage() {
  const { t } = useTranslation()

  return (
    <PageHeader
      icon={LayoutGrid}
      title={t('catalogue.title')}
      description={t('catalogue.placeholder')}
    />
  )
}
