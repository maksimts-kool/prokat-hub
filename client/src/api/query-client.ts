import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/api/http-client'

/** Shared TanStack Query client for the app. */
export const queryClient = new QueryClient({
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
