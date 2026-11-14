/**
 * English UI text. This is the source of truth for translation keys: `et.ts` is typed
 * against it, so adding a key here without translating it breaks `pnpm build`.
 */
export const en = {
  nav: {
    home: 'Home',
    catalogue: 'Catalogue',
    rentals: 'My rentals',
  },
  layout: {
    mainNav: 'Main',
    mobileNav: 'Mobile',
    footerNav: 'Footer',
    breadcrumb: 'Breadcrumb',
    openMenu: 'Open menu',
    closeMenu: 'Close',
    logIn: 'Log in',
    tagline:
      'Rent cameras, drones, laptops and more — by the day, with discounts for longer rentals.',
    usefulLinks: 'Useful links',
    copyright: '© {{year}} Prokat Hub',
  },
  language: {
    label: 'Language',
  },
  home: {
    title: 'Rent cameras, drones, laptops and more',
    lead: 'Pick your dates, see the price with longer-rental discounts and book in a minute.',
    browse: 'Browse the catalogue',
    apiStatus: {
      checking: 'Checking the API at',
      online: 'API online at',
      offline: 'API offline at',
    },
    apiUnreachable: 'Cannot reach the API',
  },
  catalogue: {
    title: 'Catalogue',
    placeholder: 'Search, filters and paging are built in #26.',
  },
  login: {
    title: 'Log in',
    placeholder: 'Login and registration are built in #23.',
  },
  rentals: {
    title: 'My rentals',
    placeholder: 'Your bookings will be listed here (#30).',
  },
  notFound: {
    title: 'Page not found',
    description: 'The page you are looking for does not exist.',
    backHome: 'Back to home',
  },
  error: {
    title: 'Something went wrong',
    unknown: 'Unknown error',
    backHome: 'Back to home',
  },
  /** Client-side text for API errors. The API's own messages stay in English. */
  errors: {
    unauthorized: 'Please log in to continue.',
    forbidden: 'You do not have permission to do this.',
    conflict: 'These dates clash with another booking. Choose different dates.',
    validation: 'Some fields are not valid. Check the form and try again.',
    network: 'Cannot reach the server. Try again later.',
    unknown: 'Something went wrong. Try again.',
  },
}

/** Same shape as `en` with every text widened to `string`, so other languages must match it. */
type Messages<T> = { [K in keyof T]: T[K] extends string ? string : Messages<T[K]> }

export type Translations = Messages<typeof en>
