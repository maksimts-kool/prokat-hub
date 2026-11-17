/**
 * The signed-in user's access token, kept in localStorage so it survives reloads.
 * The API client reads it for every request; the auth context (#23) writes it on login and clears it on logout.
 */
const STORAGE_KEY = 'prokat-hub.access-token'

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
