import { createBrowserRouter, Outlet } from 'react-router'
import { AuthProvider } from '@/auth/auth-provider'
import { pageRoles } from '@/auth/roles'
import { GuestOnly, RequireAuth } from '@/auth/route-guards'
import { AppLayout } from '@/components/layout/app-layout'
import { CataloguePage } from '@/pages/catalogue-page'
import { DeskPage } from '@/pages/desk-page'
import { ErrorPage } from '@/pages/error-page'
import { HomePage } from '@/pages/home-page'
import { ItemPage } from '@/pages/item-page'
import { LoginPage } from '@/pages/login-page'
import { MyRentalsPage } from '@/pages/my-rentals-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { RegisterPage } from '@/pages/register-page'
import { ReportsPage } from '@/pages/reports-page'

export const router = createBrowserRouter([
  {
    // Inside the router so a 401 can navigate to the login page.
    element: (
      <AuthProvider>
        <Outlet />
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

          // Guests only: a signed-in user is sent on to where they were going.
          {
            element: <GuestOnly />,
            children: [
              { path: 'login', element: <LoginPage /> },
              { path: 'register', element: <RegisterPage /> },
            ],
          },

          // Signed in with the right role; the same roles decide which nav links show.
          {
            element: <RequireAuth roles={pageRoles.rentals} />,
            children: [{ path: 'rentals', element: <MyRentalsPage /> }],
          },
          {
            element: <RequireAuth roles={pageRoles.desk} />,
            children: [{ path: 'desk', element: <DeskPage /> }],
          },
          {
            element: <RequireAuth roles={pageRoles.reports} />,
            children: [{ path: 'reports', element: <ReportsPage /> }],
          },

          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
