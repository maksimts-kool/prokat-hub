import { LogIn } from 'lucide-react'
import { PageHeader } from '@/components/page-header'

export function LoginPage() {
  return (
    <PageHeader
      icon={LogIn}
      title="Log in"
      description="Login and registration are built in #23."
    />
  )
}
