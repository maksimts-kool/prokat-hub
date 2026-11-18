/** What the login page gets in `location.state`: the page to return to afterwards. */
export interface LoginLocationState {
  from?: string
}

/** The `from` path in a location state, if it is a path inside this site. */
export function returnPathFrom(state: unknown): string | undefined {
  const from = (state as LoginLocationState | null)?.from
  // "//host" is a protocol-relative URL to another site, so only allow a single leading slash.
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')
    ? from
    : undefined
}
