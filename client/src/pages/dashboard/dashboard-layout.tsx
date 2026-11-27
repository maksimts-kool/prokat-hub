import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useMatches } from 'react-router'
import { useAuth } from '@/auth/auth-context'
import { pageRoles } from '@/auth/roles'
import { RentalsIllustration } from '@/components/illustrations/rentals-illustration'
import { PageHeader } from '@/components/page-header'
import { cn } from '@/lib/utils'
import {
  type DashboardHandle,
  type DashboardSection,
  useDashboardNavItems,
} from '@/pages/dashboard/dashboard-nav'

/** The section of the deepest route that names one; the overview when none does. */
function useSection(): DashboardSection {
  const matches = useMatches()
  for (let i = matches.length - 1; i >= 0; i--) {
    const handle = matches[i]?.handle as DashboardHandle | undefined
    if (handle?.section) return handle.section
  }
  return 'overview'
}

/** The band above every section: its title and one line on what is there. No numbers: the section shows them. */
function Band({
  section,
  title,
  staff,
}: {
  section: DashboardSection
  title: string
  staff: boolean
}) {
  const { t } = useTranslation()
  const overview = section === 'overview'
  const description = overview
    ? t(staff ? 'dashboard.staffLead' : 'dashboard.customerLead')
    : t(`dashboard.descriptions.${section}`)

  return (
    <PageHeader
      title={title}
      trail={overview ? undefined : [{ label: t('dashboard.title'), to: '/dashboard' }]}
      crumb={overview ? t('dashboard.title') : undefined}
      description={description}
      illustration={<RentalsIllustration className="w-full" />}
    />
  )
}

/** The signed-in user's own area: a band with the section's title, a sidebar of sections and the section. */
export function DashboardLayout() {
  const { t } = useTranslation()
  const { user, hasRole } = useAuth()
  const navItems = useDashboardNavItems()
  const section = useSection()
  if (!user) return null

  const firstName = user.fullName.trim().split(/\s+/)[0] ?? user.fullName
  const title =
    section === 'overview'
      ? t('dashboard.greeting', { name: firstName })
      : t(`dashboard.sections.${section}`)

  return (
    // A fragment: the band is a full-bleed child of the page grid.
    <>
      <Band section={section} title={title} staff={hasRole(...pageRoles.desk)} />

      <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
        <aside className="min-w-0 lg:sticky lg:top-24">
          {/* A pill track on phones and tablets, a list from lg up. */}
          <nav
            aria-label={t('dashboard.nav')}
            className="flex gap-1 overflow-x-auto rounded-full border bg-muted p-1 lg:flex-col lg:rounded-xl lg:bg-card lg:p-2"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.section === 'overview'}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-2.5 rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:px-4 lg:rounded-lg lg:px-3 lg:py-2.5',
                    isActive
                      ? 'bg-primary text-primary-foreground lg:bg-accent lg:text-accent-foreground'
                      : 'text-foreground/70 hover:text-primary lg:hover:bg-muted lg:hover:text-foreground',
                  )
                }
              >
                {/* Icons from sm up, so the three Estonian labels fit on a phone. */}
                <item.icon className="hidden size-4 sm:block" aria-hidden />
                {t(`dashboard.sections.${item.section}`)}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </>
  )
}
