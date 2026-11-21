/**
 * The signed-in user's access token, kept in localStorage so it survives reloads.
 * The API client reads it for every request; the auth context writes it on login and clears it on logout.
 */
export const ACCESS_TOKEN_STORAGE_KEY = 'prokat-hub.access-token'
const STORAGE_KEY = ACCESS_TOKEN_STORAGE_KEY

type Listener = (token: string | null) => void
const listeners = new Set<Listener>()

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    // Storage can be blocked (private mode, disabled site data); act as signed out.
    return null
  }
}

export function setAccessToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(STORAGE_KEY, token)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Nothing to persist to; the token is lost on reload.
  }
  listeners.forEach((listener) => listener(token))
}

export function clearAccessToken(): void {
  setAccessToken(null)
}

/** Calls `listener` whenever the token is set or cleared. Returns a function that unsubscribes. */
export function onAccessTokenChange(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * When the token stops being valid, in milliseconds since the epoch, read from the JWT's `exp` claim.
 * Returns `null` for a token that can't be decoded. The signature is the API's job; this is only
 * used to drop an expired token before sending it.
 */
export function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const { exp } = JSON.parse(json) as { exp?: unknown }
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}

/** True when the token can't be read or its `exp` has passed. */
export function isTokenExpired(token: string, now = Date.now()): boolean {
  const expiry = getTokenExpiry(token)
  return expiry === null || expiry <= now
}
