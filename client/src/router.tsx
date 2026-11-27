import { createBrowserRouter, Navigate, Outlet } from 'react-router'
import { BASE_PATH } from '@/lib/config'
import { AuthProvider } from '@/auth/auth-provider'
import { pageRoles } from '@/auth/roles'
import { GuestOnly, RequireAuth } from '@/auth/route-guards'
import { CartProvider } from '@/cart/cart-provider'
import { AppLayout } from '@/components/layout/app-layout'
import { CartPage } from '@/pages/cart-page'
import { CataloguePage } from '@/pages/catalogue-page'
import { DashboardLayout } from '@/pages/dashboard/dashboard-layout'
import { CatalogueAdminPage } from '@/pages/dashboard/catalogue/catalogue-admin-page'
import type { DashboardHandle } from '@/pages/dashboard/dashboard-nav'
import { DeskPage } from '@/pages/dashboard/desk/desk-page'
import { MyRentalsPage } from '@/pages/dashboard/my-rentals-page'
import { OverviewPage } from '@/pages/dashboard/overview-page'
import { ReportsPage } from '@/pages/dashboard/reports/reports-page'
import { ErrorPage } from '@/pages/error-page'
import { HomePage } from '@/pages/home-page'
import { ItemPage } from '@/pages/item-page'
import { LoginPage } from '@/pages/login-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { RegisterPage } from '@/pages/register-page'
import { LiveAvailabilityProvider } from '@/realtime/live-availability-provider'

export const router = createBrowserRouter(
  [
    {
      // Inside the router so a 401 can navigate to the login page. Live updates need the signed-in user.
      element: (
        <AuthProvider>
          <LiveAvailabilityProvider>
            <CartProvider>
              <Outlet />
            </CartProvider>
          </LiveAvailabilityProvider>
        </AuthProvider>
      ),
      errorElement: <ErrorPage />,
      children: [
        {
          element: <AppLayout />,
          children: [
            // Open to everyone.
            { index: true, element: <HomePage /> },
            { path: 'catalogue', element: <CataloguePage /> },
            { path: 'catalogue/:id', element: <ItemPage /> },
            // Guests may fill the cart too; booking it asks them to log in.
            { path: 'cart', element: <CartPage /> },

            // Guests only: a signed-in user is sent on to where they were going.
            {
              element: <GuestOnly />,
              children: [
                { path: 'login', element: <LoginPage /> },
                { path: 'register', element: <RegisterPage /> },
              ],
            },

            // The dashboard: signed in with the right role; the same roles decide which sidebar links show.
            {
              element: <RequireAuth roles={pageRoles.dashboard} />,
              children: [
                {
                  path: 'dashboard',
                  element: <DashboardLayout />,
                  children: [
                    {
                      index: true,
                      element: <OverviewPage />,
                      handle: { section: 'overview' } satisfies DashboardHandle,
                    },
                    {
                      element: <RequireAuth roles={pageRoles.rentals} />,
                      handle: { section: 'rentals' } satisfies DashboardHandle,
                      children: [{ path: 'rentals', element: <MyRentalsPage /> }],
                    },
                    {
                      element: <RequireAuth roles={pageRoles.desk} />,
                      handle: { section: 'desk' } satisfies DashboardHandle,
                      children: [{ path: 'desk', element: <DeskPage /> }],
                    },
                    {
                      element: <RequireAuth roles={pageRoles.catalogue} />,
                      handle: { section: 'catalogue' } satisfies DashboardHandle,
                      children: [{ path: 'catalogue', element: <CatalogueAdminPage /> }],
                    },
                    {
                      element: <RequireAuth roles={pageRoles.reports} />,
                      handle: { section: 'reports' } satisfies DashboardHandle,
                      children: [{ path: 'reports', element: <ReportsPage /> }],
                    },
                  ],
                },
              ],
            },
            // The pages' old addresses, from before they moved into the dashboard.
            { path: 'rentals', element: <Navigate to="/dashboard/rentals" replace /> },
            { path: 'desk', element: <Navigate to="/dashboard/desk" replace /> },
            { path: 'reports', element: <Navigate to="/dashboard/reports" replace /> },

            { path: '*', element: <NotFoundPage /> },
          ],
        },
      ],
    },
  ],
  { basename: BASE_PATH || '/' },
)
