import {
  Boxes,
  CalendarCheck,
  ChartColumn,
  ClipboardList,
  LayoutDashboard,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/auth/auth-context'
import { pageRoles, type Role } from '@/auth/roles'
import type { Translations } from '@/i18n/locales/en'

/** The dashboard's sections. A route's `handle` names its section, so the band knows its title. */
export type DashboardSection = keyof Translations['dashboard']['sections']

export interface DashboardHandle {
  section: DashboardSection
}

export interface DashboardNavItem {
  to: string
  section: DashboardSection
  icon: LucideIcon
  /** Only users with one of these roles see the link; the router guards the route with the same roles. */
  roles?: readonly Role[]
}

export const dashboardNavItems: DashboardNavItem[] = [
  { to: '/dashboard', section: 'overview', icon: LayoutDashboard },
  { to: '/dashboard/rentals', section: 'rentals', icon: CalendarCheck, roles: pageRoles.rentals },
  { to: '/dashboard/desk', section: 'desk', icon: ClipboardList, roles: pageRoles.desk },
  { to: '/dashboard/catalogue', section: 'catalogue', icon: Boxes, roles: pageRoles.catalogue },
  { to: '/dashboard/reports', section: 'reports', icon: ChartColumn, roles: pageRoles.reports },
]

/** The dashboard links the current user may open. */
export function useDashboardNavItems(): DashboardNavItem[] {
  const { hasRole } = useAuth()
  return dashboardNavItems.filter((item) => !item.roles || hasRole(...item.roles))
}
