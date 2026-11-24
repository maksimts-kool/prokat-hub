/** Base URL of the ASP.NET Core API, without a trailing slash. Set VITE_API_URL to change it. */
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '')

/**
 * Path the app is served under, without a trailing slash: '' at the site root, or e.g. '/prokathub' when
 * built with `--base=/prokathub/`. The router and links to files in public/ use it.
 */
export const BASE_PATH = import.meta.env.BASE_URL.replace(/\/+$/, '')

/** Builds an absolute API URL from a path such as `/api/items`. */
export function apiUrl(path: string): string {
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`
}
