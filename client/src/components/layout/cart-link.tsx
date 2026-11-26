import { ShoppingCart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'
import { useAuth } from '@/auth/auth-context'
import { pageRoles } from '@/auth/roles'
import { useCart } from '@/cart/cart-context'
import { cn } from '@/lib/utils'

/**
 * The cart in the header, with how many items are in it. Guests and customers only: staff accounts
 * cannot book, so they get no cart.
 */
export function CartLink({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { status, hasRole } = useAuth()
  const { lines } = useCart()
  const count = lines.length

  if (status === 'loading' || (status === 'authenticated' && !hasRole(...pageRoles.rentals))) {
    return null
  }
  return (
    <NavLink
      to="/cart"
      aria-label={t('layout.cart', { count })}
      className={({ isActive }) =>
        cn(
          'relative flex size-10 shrink-0 items-center justify-center rounded-full border bg-muted transition-colors outline-none hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_5%)] focus-visible:ring-3 focus-visible:ring-ring/50',
          isActive && 'border-band-accent text-band-accent',
          className,
        )
      }
    >
      <ShoppingCart className="size-5" aria-hidden />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-highlight px-1 text-xs leading-none font-bold text-on-highlight tabular-nums ring-2 ring-band"
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </NavLink>
  )
}
