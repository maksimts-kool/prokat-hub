import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/auth/auth-context'
import { type LoginLocationState, returnPathFrom } from '@/auth/return-path'
import { homePathFor, type Role } from '@/auth/roles'
import { PageLoader } from '@/components/page-loader'
import { ForbiddenPage } from '@/pages/forbidden-page'

interface RequireAuthProps {
  /** Roles allowed to open the child routes. Leave out to allow any signed-in user. */
  roles?: readonly Role[]
}

/**
 * Route guard for signed-in pages. Guests go to the login page and come back after logging in;
 * a signed-in user without one of `roles` sees a "no access" page.
 */
export function RequireAuth({ roles }: RequireAuthProps) {
  const { status, hasRole } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <PageLoader />
  }

  if (status === 'guest') {
    const state: LoginLocationState = {
      from: location.pathname + location.search + location.hash,
    }
    return <Navigate to="/login" replace state={state} />
  }

  if (roles && !hasRole(...roles)) {
    return <ForbiddenPage />
  }

  return <Outlet />
}

/**
 * Route guard for the login and register pages. Once the user is signed in (including right after
 * a successful login) it sends them on: to the page they came from, or to their role's start page.
 */
export function GuestOnly() {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <PageLoader />
  }

  if (user) {
    return <Navigate to={returnPathFrom(location.state) ?? homePathFor(user.roles)} replace />
  }

  return <Outlet />
}
