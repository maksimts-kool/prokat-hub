import { useAuth } from '@/auth/auth-context'
import { pageRoles } from '@/auth/roles'
import { CustomerOverview } from '@/pages/dashboard/customer-overview'
import { StaffOverview } from '@/pages/dashboard/staff-overview'

/** The dashboard's first page: the desk's day for staff and admins, a customer's own rentals otherwise. */
export function OverviewPage() {
  const { hasRole } = useAuth()
  return hasRole(...pageRoles.desk) ? <StaffOverview /> : <CustomerOverview />
}
