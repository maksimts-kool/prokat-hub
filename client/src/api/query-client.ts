import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { toastApiError } from '@/api/error-message'
import { isApiError } from '@/api/http-client'
import i18n from '@/i18n'

interface ErrorMeta extends Record<string, unknown> {
  /**
   * `false` when the component shows this request's errors itself (a form, a dialog), so no toast
   * is added on top. Without it, every failed mutation and every failed background refresh is a toast.
   */
  errorToast?: boolean
}

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: ErrorMeta
    mutationMeta: ErrorMeta
  }
}

/** Meta for a mutation whose component shows its errors itself, e.g. next to a form's fields. */
export const errorsShownInline: ErrorMeta = { errorToast: false }

/** A 401 on a signed-in request ends the session; the auth provider has its own toast for that. */
const endsSession = (error: unknown) => isApiError(error) && error.status === 401

/** Shared TanStack Query client for the app. */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.errorToast === false || endsSession(error)) return
      // A first load that fails shows its error in place of the data, with a retry. A refresh that
      // fails leaves the old data on screen, so the user is told it may be out of date.
      if (query.state.data === undefined) return
      toastApiError(error, {
        id: 'refresh-failed',
        message: i18n.t('errors.refreshFailed'),
      })
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.errorToast === false || endsSession(error)) return
      toastApiError(error)
    },
  }),
  defaultOptions: {
    queries: {
      // Catalogue and rental data change rarely enough that 30 s of reuse saves refetching on every mount.
      staleTime: 30_000,
      // Retry network errors and 5xx twice; a 4xx won't change by retrying.
      retry: (failureCount, error) =>
        failureCount < 2 && !(isApiError(error) && error.status >= 400 && error.status < 500),
    },
    mutations: {
      retry: false,
    },
  },
})
