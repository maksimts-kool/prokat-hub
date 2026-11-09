import { LogIn, Package } from 'lucide-react'
import { Link, NavLink } from 'react-router'
import { MobileNav } from '@/components/layout/mobile-nav'
import { navItems } from '@/components/layout/nav-items'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <MobileNav />

        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Package className="size-5" aria-hidden />
          <span>Prokat Hub</span>
        </Link>

        <nav aria-label="Main" className="ml-6 hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto">
          <Button asChild variant="outline" size="sm">
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
