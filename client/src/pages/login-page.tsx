import { LogIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/page-header'

export function LoginPage() {
  const { t } = useTranslation()

  return <PageHeader icon={LogIn} title={t('login.title')} description={t('login.placeholder')} />
}
