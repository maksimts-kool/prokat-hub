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
 * The first server message for each of `fields` in a 400 ValidationProblemDetails response.
 * The API names fields in PascalCase (`FullName`), so they are matched without regard to case.
 */
export function serverFieldErrors<TField extends string>(
  error: unknown,
  fields: readonly TField[],
): Partial<Record<TField, string>> {
  const result: Partial<Record<TField, string>> = {}
  if (!isApiError(error) || error.status !== 400 || !error.problem?.errors) return result

  for (const [key, messages] of Object.entries(error.problem.errors)) {
    const field = fields.find((name) => name.toLowerCase() === key.toLowerCase())
    if (field && messages[0] && !result[field]) {
      result[field] = messages[0]
    }
  }
  return result
}
