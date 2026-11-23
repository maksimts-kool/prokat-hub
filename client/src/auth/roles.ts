/** Account roles, as the API puts them in `UserDto.roles` (see `Domain/Roles.cs`). */
export const Role = {
  Admin: 'Admin',
  Staff: 'Staff',
  Customer: 'Customer',
  Service: 'Service',
} as const

export type Role = (typeof Role)[keyof typeof Role]

/** Most powerful first: the first one a user has is the one shown next to their name. */
const rolesByRank: readonly Role[] = [Role.Admin, Role.Staff, Role.Customer, Role.Service]

/**
 * Who may open each signed-in page. The router guards the routes with these and the navigation
 * hides links to pages the user can't open, so both read from here. They mirror the API's policies.
 */
export const pageRoles = {
  /** The dashboard: everyone with an account page of their own. */
  dashboard: [Role.Customer, Role.Staff, Role.Admin],
  /** Own bookings: the API's `Customer` policy. */
  rentals: [Role.Customer],
  /** Issuing and receiving items: `StaffDesk`. */
  desk: [Role.Staff, Role.Admin],
  /** Reports: `Admin`. */
  reports: [Role.Admin],
} as const satisfies Record<string, readonly Role[]>

/** True when `roles` contains at least one of `allowed`. */
export function hasAnyRole(roles: readonly string[], allowed: readonly Role[]): boolean {
  return allowed.some((role) => roles.includes(role))
}

/** The role to show for a user with several, e.g. "Admin" for an admin who is also staff. */
export function primaryRole(roles: readonly string[]): Role | undefined {
  return rolesByRank.find((role) => roles.includes(role))
}

/** Where a user goes after logging in when they didn't ask for a page: staff start at their dashboard. */
export function homePathFor(roles: readonly string[]): string {
  return hasAnyRole(roles, pageRoles.desk) ? '/dashboard' : '/'
}
