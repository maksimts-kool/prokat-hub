import { useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useGetApiAuthMe, getGetApiAuthMeQueryKey } from '@/api/generated/auth/auth'
import type { AuthResponse } from '@/api/generated/model'
import { isApiError, onUnauthorized } from '@/api/http-client'
import { AuthContext, type AuthContextValue, type AuthStatus } from '@/auth/auth-context'
import { authPath } from '@/auth/return-path'
import { hasAnyRole, type Role } from '@/auth/roles'
import i18n from '@/i18n'
import {
  ACCESS_TOKEN_STORAGE_KEY,
  clearAccessToken,
  getAccessToken,
  getTokenExpiry,
  isTokenExpired,
  onAccessTokenChange,
  setAccessToken,
} from '@/lib/auth-token'

/** The stored token, unless it has already expired. */
function readValidToken(): string | null {
  const token = getAccessToken()
  return token && !isTokenExpired(token) ? token : null
}

function currentPath(): string {
  return window.location.pathname + window.location.search + window.location.hash
}

/**
 * Holds the signed-in user. Rendered inside the router, because a 401 navigates to the login page.
 *
 * The token lives in localStorage (`lib/auth-token.ts`); the user comes from the login or register
 * response and, after a reload, from `GET /api/auth/me`.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [token, setToken] = useState(readValidToken)

  // Follow the stored token: sign-in, sign-out and a 401 all change it.
  useEffect(() => onAccessTokenChange(setToken), [])

  // Another tab signed in or out: forget this tab's data and follow it.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== ACCESS_TOKEN_STORAGE_KEY) return
      queryClient.clear()
      setToken(readValidToken())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [queryClient])

  // Drop an expired token left from an earlier visit, so it isn't sent with requests.
  useEffect(() => {
    if (!token && getAccessToken()) clearAccessToken()
  }, [token])

  const me = useGetApiAuthMe({
    query: {
      enabled: token !== null,
      // The user only changes by signing in or out, and both reset this query.
      staleTime: Infinity,
      gcTime: Infinity,
    },
  })

  // The token is useless if its account is gone (404) or the API refuses it.
  useEffect(() => {
    if (isApiError(me.error) && [401, 403, 404].includes(me.error.status)) {
      clearAccessToken()
    }
  }, [me.error])

  const user = token ? (me.data ?? null) : null
  const status: AuthStatus = !token
    ? 'guest'
    : me.data
      ? 'authenticated'
      : me.isError
        ? 'guest'
        : 'loading'

  // The 401 handler needs to know whether someone was signed in, without re-subscribing on every change.
  const signedIn = useRef(false)
  useEffect(() => {
    signedIn.current = status === 'authenticated'
  }, [status])

  const endSession = useCallback(() => {
    clearAccessToken()
    // Nothing fetched with the old token may be shown to whoever signs in next.
    queryClient.clear()
  }, [queryClient])

  // A request with the token got 401: the session has ended, so log in again and come back here.
  useEffect(
    () =>
      onUnauthorized(() => {
        const hadSession = signedIn.current
        endSession()
        // A token that fails on the first check after a reload just leaves the visitor a guest.
        if (!hadSession) return
        toast.error(i18n.t('errors.unauthorized'), { id: 'session-ended' })
        void navigate(authPath(currentPath()), { replace: true })
      }),
    [endSession, navigate],
  )

  // Sign out when the token expires. On a protected page the route guard then sends the user to log in.
  useEffect(() => {
    const expiry = token ? getTokenExpiry(token) : null
    if (expiry === null) return
    const timer = setTimeout(
      () => {
        endSession()
        toast.info(i18n.t('auth.sessionExpired'), { id: 'session-ended' })
      },
      Math.max(0, expiry - Date.now()),
    )
    return () => clearTimeout(timer)
  }, [token, endSession])

  const signIn = useCallback(
    (response: AuthResponse) => {
      queryClient.clear()
      queryClient.setQueryData(getGetApiAuthMeQueryKey(), response.user)
      setAccessToken(response.accessToken)
    },
    [queryClient],
  )

  const signOut = useCallback(() => {
    endSession()
    void navigate('/', { replace: true })
  }, [endSession, navigate])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      hasRole: (...roles: Role[]) => user !== null && hasAnyRole(user.roles, roles),
      signIn,
      signOut,
    }),
    [status, user, signIn, signOut],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
