/** Query string key on `/login` and `/register` that holds the page to return to afterwards. */
export const REDIRECT_PARAM = 'redirect'

const authPages = ['/login', '/register']

/** `path` if it is a page inside this site to return to, otherwise undefined. */
function safeReturnPath(path: string | null | undefined): string | undefined {
  if (typeof path !== 'string' || !path.startsWith('/')) return undefined
  // "//host" and "/\host" are read by browsers as links to another site.
  if (path.startsWith('//') || path.startsWith('/\\')) return undefined
  // Returning to the login page itself would loop.
  const pathname = path.split(/[?#]/)[0]
  if (authPages.includes(pathname)) return undefined
  return path
}

/**
 * The login (or register) page with the page to return to in the URL, e.g.
 * `/login?redirect=%2Fcatalogue%2F1%3Ffrom%3D2026-12-07%26to%3D2026-12-13`. The home page and
 * paths that are not safe to return to are left out.
 */
export function authPath(
  from: string | undefined,
  page: '/login' | '/register' = '/login',
): string {
  // Already on the login or register page: keep the page it was going to return to.
  const [pathname, query = ''] = (from ?? '').split('?')
  if (authPages.includes(pathname)) {
    const redirect = returnPathFrom(query)
    return redirect ? authPath(redirect, page) : page
  }
  const path = safeReturnPath(from)
  if (!path || path === '/') return page
  return `${page}?${new URLSearchParams({ [REDIRECT_PARAM]: path })}`
}

/** The page to return to from the login page's query string (`location.search`), if it is safe. */
export function returnPathFrom(search: string): string | undefined {
  return safeReturnPath(new URLSearchParams(search).get(REDIRECT_PARAM))
}
