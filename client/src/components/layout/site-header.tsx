import { LogIn } from 'lucide-react'
import { Link } from 'react-router'
import { MainNav } from '@/components/layout/main-nav'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
        <MobileNav />

        <Link to="/">
          <Logo />
        </Link>

        <MainNav />

        <div className="ml-auto md:ml-10">
          <Button asChild size="lg" className="rounded-full px-4">
            <Link to="/login">
              <LogIn aria-hidden />
              Log in
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
