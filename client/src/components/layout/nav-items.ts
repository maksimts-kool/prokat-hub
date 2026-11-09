import { CalendarCheck, House, LayoutGrid, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Home', icon: House },
  { to: '/catalogue', label: 'Catalogue', icon: LayoutGrid },
  { to: '/rentals', label: 'My rentals', icon: CalendarCheck },
]
