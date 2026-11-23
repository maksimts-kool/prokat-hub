import { ChevronDown, LayoutDashboard, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useAuth } from '@/auth/auth-context'
import { pageRoles, primaryRole } from '@/auth/roles'
import { initialsOf } from '@/lib/initials'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/** The signed-in user's chip in the header (avatar, name, role) with a menu: the dashboard and log out. */
export function AccountMenu() {
  const { t } = useTranslation()
  const { user, signOut, hasRole } = useAuth()
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
        {hasRole(...pageRoles.dashboard) && (
          <>
            <DropdownMenuItem asChild className="px-2 py-1.5">
              <Link to="/dashboard">
                <LayoutDashboard aria-hidden />
                {t('account.dashboard')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onSelect={signOut} className="px-2 py-1.5">
          <LogOut aria-hidden />
          {t('account.logOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
