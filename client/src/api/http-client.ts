import { getAccessToken } from '@/lib/auth-token'
import { apiUrl } from '@/lib/config'

/** RFC 9457 problem details, as the API returns them for every error. */
export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  /** Field name → messages, on 400 validation errors. */
  errors?: Record<string, string[]>
  /** ASP.NET Core adds the request's trace id to every problem. */
  traceId?: string
}

const text = (value: unknown) => (typeof value === 'string' && value ? value : undefined)

/**
 * Reads a response body as {@link ProblemDetails}, keeping only fields of the expected type, so a
 * proxy's HTML error page or an odd body never reaches the UI as a problem. Returns `undefined`
 * when the body is not a JSON object.
 */
export function parseProblemDetails(body: unknown): ProblemDetails | undefined {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return undefined
  const raw = body as Record<string, unknown>

  let errors: Record<string, string[]> | undefined
  if (typeof raw.errors === 'object' && raw.errors !== null && !Array.isArray(raw.errors)) {
    errors = {}
    for (const [field, messages] of Object.entries(raw.errors)) {
      const list = (Array.isArray(messages) ? messages : [messages]).filter(
        (message): message is string => typeof message === 'string' && message.length > 0,
      )
      if (list.length > 0) errors[field] = list
    }
  }

  return {
    type: text(raw.type),
    title: text(raw.title),
    status: typeof raw.status === 'number' ? raw.status : undefined,
    detail: text(raw.detail),
    instance: text(raw.instance),
    errors,
    traceId: text(raw.traceId),
  }
}

/** A request that got a non-2xx response, or no response at all (`status` 0). */
export class ApiError extends Error {
  readonly status: number
  readonly problem: ProblemDetails | undefined

  constructor(status: number, problem: ProblemDetails | undefined, fallbackMessage: string) {
    super(problem?.detail ?? problem?.title ?? fallbackMessage)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

const unauthorizedListeners = new Set<() => void>()

/**
 * Calls `listener` when a request sent with the user's token gets 401 Unauthorized.
 * The auth context uses it to end the session and send the user to the login page.
 * Returns a function that unsubscribes.
 */
export function onUnauthorized(listener: () => void): () => void {
  unauthorizedListeners.add(listener)
  return () => unauthorizedListeners.delete(listener)
}

async function readBody(response: Response): Promise<unknown> {
  // 204 and other empty responses have no body to parse.
  const text = await response.text()
  if (!text) {
    return undefined
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('json')) return text
  try {
    return JSON.parse(text)
  } catch (error) {
    // An error body that says JSON but isn't (e.g. from a proxy) still becomes an ApiError.
    if (response.ok) throw error
    return text
  }
}

/**
 * Fetch wrapper used by every generated hook (see `orval.config.ts`). It prefixes the API base URL,
 * adds `Authorization: Bearer <token>` when the user is signed in, parses JSON, and throws {@link ApiError}
 * for failed requests so TanStack Query treats them as errors.
 */
export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  const token = getAccessToken()
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(apiUrl(url), { ...options, headers })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new ApiError(0, undefined, 'The server could not be reached.')
  }

  // A 401 on a request that carried a token means the session is gone (expired or revoked).
  // A 401 without one is an answer to that request, e.g. a wrong password on login.
  if (response.status === 401 && headers.has('Authorization')) {
    unauthorizedListeners.forEach((listener) => listener())
  }

  const body = await readBody(response)
  if (!response.ok) {
    throw new ApiError(
      response.status,
      parseProblemDetails(body),
      `Request failed with status ${response.status}.`,
    )
  }

  return body as T
}

/** Error type of the generated hooks: an {@link ApiError} whose `problem` has the endpoint's error schema. */
export type ErrorType<TProblem> = ApiError & { readonly problem: TProblem | undefined }

/** Request body type the generated hooks use. */
export type BodyType<Body> = Body
