import { Link } from 'react-router'
import { navItems } from '@/components/layout/nav-items'
import { Logo } from '@/components/logo'

const year = new Date().getFullYear()

export function SiteFooter() {
  return (
    <footer className="mt-16">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-2">
          <Link to="/" className="inline-flex">
            <Logo />
          </Link>
          <p className="max-w-xs text-sm text-muted-foreground">
            Rent cameras, drones, laptops and more — by the day, with discounts for longer rentals.
          </p>
        </div>

        <nav aria-label="Footer" className="space-y-4">
          <h2 className="font-semibold">Useful links</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {navItems.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="transition-colors hover:text-primary">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t">
        <p className="mx-auto w-full max-w-7xl px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
          © {year} Prokat Hub
        </p>
      </div>
    </footer>
  )
}
