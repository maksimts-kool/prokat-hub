/**
 * English UI text. This is the source of truth for translation keys: `et.ts` is typed
 * against it, so adding a key here without translating it breaks `pnpm build`.
 */
export const en = {
  nav: {
    home: 'Home',
    catalogue: 'Catalogue',
    rentals: 'My rentals',
    desk: 'Rental desk',
    reports: 'Reports',
  },
  layout: {
    mainNav: 'Main',
    mobileNav: 'Mobile',
    footerNav: 'Footer',
    breadcrumb: 'Breadcrumb',
    openMenu: 'Open menu',
    closeMenu: 'Close',
    logIn: 'Log in',
    loading: 'Loading…',
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
  /** Text shared by the login and register forms. */
  auth: {
    email: 'Email',
    emailPlaceholder: 'you@example.com',
    password: 'Password',
    sessionExpired: 'Your session has ended. Log in again to continue.',
    validation: {
      emailRequired: 'Enter your email.',
      emailInvalid: 'Enter a valid email, like name@example.com.',
      passwordRequired: 'Enter your password.',
    },
  },
  login: {
    title: 'Log in',
    description: 'Welcome back. Log in to book items and see your rentals.',
    submit: 'Log in',
    invalidCredentials: 'Wrong email or password. Check them and try again.',
    noAccount: 'New to Prokat Hub?',
    createAccount: 'Create an account',
    aside: {
      title: 'Your rentals in one place',
      book: 'Book and cancel online',
      bookText: 'Cancel any time before you pick the item up.',
      due: 'See what is due back',
      dueText: 'Return dates and any late fees on one page.',
      deposit: 'Deposits you get back',
      depositText: 'Paid at pickup, refunded when the item is returned.',
      noteTitle: 'Just looking?',
      note: 'You can browse the catalogue and check prices without an account.',
    },
  },
  register: {
    title: 'Create an account',
    description: 'It takes a minute. You need an account to book.',
    fullName: 'Full name',
    passwordRule:
      'At least 8 characters, with an uppercase letter, a lowercase letter and a digit.',
    submit: 'Create account',
    success: 'Welcome, {{name}}. Your account is ready.',
    emailTaken: 'An account with this email already exists. Log in instead.',
    haveAccount: 'Already have an account?',
    logIn: 'Log in',
    validation: {
      nameRequired: 'Enter your full name.',
      nameShort: 'The name must be at least 2 characters.',
      nameLong: 'The name can be at most 120 characters.',
      passwordLong: 'The password can be at most 100 characters.',
    },
    aside: {
      title: 'Rent by the day, pay less for longer',
      discount: 'Up to 30% off',
      discountText: '10% from 3 days, 20% from 7, 30% from 14.',
      free: 'Only what is free',
      freeText: 'Search with your dates and see only items you can book.',
      quote: 'No surprises',
      quoteText: 'The quote shows the total and the deposit before you book.',
    },
  },
  account: {
    menu: 'Account: {{name}}',
    logOut: 'Log out',
  },
  roles: {
    Admin: 'Admin',
    Staff: 'Staff',
    Customer: 'Customer',
    Service: 'Service',
  },
  rentals: {
    title: 'My rentals',
    placeholder: 'Your bookings will be listed here (#30).',
  },
  desk: {
    title: 'Rental desk',
    placeholder: 'Issuing, receiving and overdue rentals are built in #31.',
  },
  reports: {
    title: 'Reports',
    placeholder: 'The popular items report is built in #33.',
  },
  forbidden: {
    title: 'No access',
    description: 'Your account cannot open this page. Log in with another account or go back home.',
    backHome: 'Back to home',
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
