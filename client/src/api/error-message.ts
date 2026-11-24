import { isApiError } from '@/api/http-client'
import i18n from '@/i18n'

/** A message for a failed request in the UI language, picked by status code. */
export function apiErrorMessage(error: unknown): string {
  if (!isApiError(error)) return i18n.t('errors.unknown')

  switch (error.status) {
    case 0:
      return i18n.t('errors.network')
    case 400:
      return i18n.t('errors.validation')
    case 401:
      return i18n.t('errors.unauthorized')
    case 403:
      return i18n.t('errors.forbidden')
    case 409:
      return i18n.t('errors.conflict')
    default:
      return i18n.t('errors.unknown')
  }
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
  for (const [path, message] of Object.entries(serverErrorsByPath(error))) {
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
  const result: Record<string, string> = {}
  if (!isApiError(error) || (error.status !== 400 && error.status !== 409)) return result
  if (!error.problem?.errors) return result

  for (const [key, messages] of Object.entries(error.problem.errors)) {
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
