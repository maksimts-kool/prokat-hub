import { LogIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
import { useAuth } from '@/auth/auth-context'
import { authPath } from '@/auth/return-path'
import { AccountMenu } from '@/components/layout/account-menu'
import { CartLink } from '@/components/layout/cart-link'
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
    // The same dark band as the hero below it, so the top of every page reads as one block.
    <header className="on-band sticky top-0 z-40 bg-band">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <MobileNav />

        <Link to="/" className="shrink-0">
          <Logo variant="light" className="md:h-8 lg:h-9" />
        </Link>

        <MainNav />

        <div className="ml-auto flex items-center gap-2 md:ml-4 lg:ml-6 lg:gap-3">
          {/* On small screens the switcher lives in the mobile menu. */}
          <LanguageSwitcher className="hidden md:flex" />
          <CartLink />
          {status === 'authenticated' ? (
            <AccountMenu />
          ) : (
            // While a stored session is checked, keep the space so the header doesn't jump.
            <Button
              asChild
              size="lg"
              className={cn('rounded-full px-3 sm:px-4', status === 'loading' && 'invisible')}
            >
              {/* After logging in, come back to this page. */}
              <Link to={authPath(location.pathname + location.search)}>
                <LogIn aria-hidden />
                {/* Phones: the icon alone, so the cart fits beside it. */}
                <span className="max-sm:sr-only">{t('layout.logIn')}</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
