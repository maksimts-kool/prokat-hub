import { CalendarCheck, House, LayoutGrid, type LucideIcon } from 'lucide-react'
import type { Translations } from '@/i18n/locales/en'

export interface NavItem {
  to: string
  /** Key under `nav` in the translations. */
  labelKey: keyof Translations['nav']
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { to: '/', labelKey: 'home', icon: House },
  { to: '/catalogue', labelKey: 'catalogue', icon: LayoutGrid },
  { to: '/rentals', labelKey: 'rentals', icon: CalendarCheck },
]
