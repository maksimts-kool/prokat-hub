import { House, LayoutGrid, type LucideIcon } from 'lucide-react'
import { useAuth } from '@/auth/auth-context'
import type { Role } from '@/auth/roles'
import type { Translations } from '@/i18n/locales/en'

export interface NavItem {
  to: string
  /** Key under `nav` in the translations. */
  labelKey: keyof Translations['nav']
  icon: LucideIcon
  /** Only users with one of these roles see the link. Leave out for pages everyone can open. */
  roles?: readonly Role[]
}

/** The public pages. Signed-in pages live in the dashboard, opened from the account menu. */
export const navItems: NavItem[] = [
  { to: '/', labelKey: 'home', icon: House },
  { to: '/catalogue', labelKey: 'catalogue', icon: LayoutGrid },
]

/** The navigation links the current user may open. */
export function useNavItems(): NavItem[] {
  const { hasRole } = useAuth()
  return navItems.filter((item) => !item.roles || hasRole(...item.roles))
}
