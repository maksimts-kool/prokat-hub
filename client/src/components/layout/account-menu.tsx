import { ChevronDown, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/auth-context'
import { primaryRole } from '@/auth/roles'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/** "Kristi Customer" → "KC"; one word gives one letter. */
function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}

/** The signed-in user's chip in the header (avatar, name, role) with a menu to log out. */
export function AccountMenu() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  if (!user) return null

  const role = primaryRole(user.roles)
  const roleLabel = role ? t(`roles.${role}`) : undefined

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('account.menu', { name: user.fullName })}
        className="flex items-center gap-2 rounded-full border bg-muted p-1 transition-colors outline-none hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_5%)] focus-visible:ring-3 focus-visible:ring-ring/50 lg:pr-3"
      >
        <span
          aria-hidden
          className="flex size-8 items-center justify-center rounded-full bg-primary text-[13px] leading-none font-semibold text-primary-foreground"
        >
          {initialsOf(user.fullName)}
        </span>
        {/* Name and role from lg up; at md the nav needs the room. */}
        <span className="hidden max-w-40 flex-col text-left lg:flex">
          <span className="truncate text-sm leading-[18px] font-medium">{user.fullName}</span>
          {roleLabel && (
            <span className="text-xs leading-[14px] text-muted-foreground">{roleLabel}</span>
          )}
        </span>
        <ChevronDown className="hidden size-4 text-muted-foreground lg:block" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5 px-2 py-1.5">
          <span className="truncate text-sm font-medium text-foreground">{user.fullName}</span>
          <span className="truncate font-normal">{user.email}</span>
          {roleLabel && <span className="font-normal">{roleLabel}</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut} className="px-2 py-1.5">
          <LogOut aria-hidden />
          {t('account.logOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
