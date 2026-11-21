import { createContext, useContext } from 'react'
import type { AuthResponse, UserDto } from '@/api/generated/model'
import type { Role } from '@/auth/roles'

/**
 * `loading` while a stored token is checked with `GET /api/auth/me`, then `authenticated` or `guest`.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'guest'

export interface AuthContextValue {
  status: AuthStatus
  /** The signed-in user, or `null` for guests and while loading. */
  user: UserDto | null
  /** True when the signed-in user has at least one of `roles`. Always false for guests. */
  hasRole: (...roles: Role[]) => boolean
  /** Stores the token and user from a login or register response. */
  signIn: (response: AuthResponse) => void
  /** Forgets the token and every cached response, then goes to the home page. */
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

/** The current user and the sign-in/sign-out actions. Must be used inside `AuthProvider`. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }
  return context
}
