import { toast } from 'sonner'
import { isApiError, type ProblemDetails } from '@/api/http-client'
import i18n from '@/i18n'

/** A failed request reduced to what the UI needs, whatever was thrown. */
export interface Problem {
  /** HTTP status; 0 when the server could not be reached or the error is not from a request. */
  status: number
  /** The server's own explanation (`detail`, else `title`). The API writes it in English. */
  serverMessage: string | undefined
  /** Field messages from a 400 or 409 response, keyed by React Hook Form path (`specifications.1.key`). */
  fieldErrors: Record<string, string>
  /** The request's trace id, to find it in the server logs. */
  traceId: string | undefined
  /** The full problem details as the server sent them. */
  details: ProblemDetails | undefined
}

/**
 * The one place that reads an error thrown by `apiFetch` (or anything else): every other helper
 * here, the inline form errors and the global toasts build on it.
 */
export function parseProblem(error: unknown): Problem {
  if (!isApiError(error)) {
    return {
      status: 0,
      serverMessage: undefined,
      fieldErrors: {},
      traceId: undefined,
      details: undefined,
    }
  }

  const details = error.problem
  return {
    status: error.status,
    serverMessage: details?.detail ?? details?.title,
    fieldErrors: error.status === 400 || error.status === 409 ? fieldPaths(details?.errors) : {},
    traceId: details?.traceId,
    details,
  }
}

/** `Specifications[1].Key` → `specifications.1.key`; only the first message of a field is kept. */
function fieldPaths(errors: Record<string, string[]> | undefined): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, messages] of Object.entries(errors ?? {})) {
    const path = key
      .replace(/\[(\d+)\]/g, '.$1')
      .split('.')
      .filter(Boolean)
      .map((part) => part.charAt(0).toLowerCase() + part.slice(1))
      .join('.')
    if (path && messages[0] && !result[path]) result[path] = messages[0]
  }
  return result
}

/** A message for a failed request in the UI language, picked by status code. */
export function apiErrorMessage(error: unknown): string {
  if (!isApiError(error)) return i18n.t('errors.unknown')

  const { status } = parseProblem(error)
  switch (status) {
    case 0:
      return i18n.t('errors.network')
    case 400:
      return i18n.t('errors.validation')
    case 401:
      return i18n.t('errors.unauthorized')
    case 403:
      return i18n.t('errors.forbidden')
    case 404:
      return i18n.t('errors.notFound')
    case 409:
      return i18n.t('errors.conflict')
    case 429:
      return i18n.t('errors.tooManyRequests')
    default:
      return status >= 500 ? i18n.t('errors.server') : i18n.t('errors.unknown')
  }
}

/**
 * Shows a failed request as an error toast: the message in the UI language, with the server's own
 * explanation under it while the UI is in English (the API's messages are English only).
 * Toasts with the same `id` replace each other instead of stacking.
 */
export function toastApiError(error: unknown, options: { message?: string; id?: string } = {}) {
  const { serverMessage } = parseProblem(error)
  const message = options.message ?? apiErrorMessage(error)
  const description =
    serverMessage && serverMessage !== message && i18n.resolvedLanguage === 'en'
      ? serverMessage
      : undefined
  toast.error(message, { id: options.id, description })
}

/**
 * The first server message for each of `fields` in a 400 ValidationProblemDetails response, or a
 * 409 about one field (such as a category name in use), which lists its message the same way.
 * The API names fields in PascalCase (`FullName`), so they are matched without regard to case.
 */
export function serverFieldErrors<TField extends string>(
  error: unknown,
  fields: readonly TField[],
): Partial<Record<TField, string>> {
  const result: Partial<Record<TField, string>> = {}
  for (const [path, message] of Object.entries(parseProblem(error).fieldErrors)) {
    const field = fields.find((name) => name.toLowerCase() === path.toLowerCase())
    if (field && !result[field]) result[field] = message
  }
  return result
}

/**
 * Every field message of a 400 or 409 response, keyed by its React Hook Form path:
 * `Specifications[1].Key` becomes `specifications.1.key`. Only the first message of a field is kept.
 */
export function serverErrorsByPath(error: unknown): Record<string, string> {
  return parseProblem(error).fieldErrors
}
