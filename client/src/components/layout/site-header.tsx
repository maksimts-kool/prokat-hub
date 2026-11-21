import { LogIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
import { useAuth } from '@/auth/auth-context'
import { authPath } from '@/auth/return-path'
import { AccountMenu } from '@/components/layout/account-menu'
import { MainNav } from '@/components/layout/main-nav'
import { MobileNav } from '@/components/layout/mobile-nav'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const { t } = useTranslation()
  const { status } = useAuth()
  const location = useLocation()

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
        <MobileNav />

        <Link to="/" className="shrink-0">
          <Logo className="md:h-8 lg:h-9" />
        </Link>

        <MainNav />

        <div className="ml-auto flex items-center gap-2 md:ml-4 lg:ml-6 lg:gap-3">
          {/* On small screens the switcher lives in the mobile menu. */}
          <LanguageSwitcher className="hidden md:flex" />
          {status === 'authenticated' ? (
            <AccountMenu />
          ) : (
            // While a stored session is checked, keep the space so the header doesn't jump.
            <Button
              asChild
              size="lg"
              className={cn('rounded-full px-4', status === 'loading' && 'invisible')}
            >
              {/* After logging in, come back to this page. */}
              <Link to={authPath(location.pathname + location.search)}>
                <LogIn aria-hidden />
                {t('layout.logIn')}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
