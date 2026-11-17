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

async function readBody(response: Response): Promise<unknown> {
  // 204 and other empty responses have no body to parse.
  const text = await response.text()
  if (!text) {
    return undefined
  }

  const contentType = response.headers.get('content-type') ?? ''
  return contentType.includes('json') ? JSON.parse(text) : text
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

  const body = await readBody(response)
  if (!response.ok) {
    const problem = typeof body === 'object' && body !== null ? (body as ProblemDetails) : undefined
    throw new ApiError(response.status, problem, `Request failed with status ${response.status}.`)
  }

  return body as T
}

/** Error type of the generated hooks: an {@link ApiError} whose `problem` has the endpoint's error schema. */
export type ErrorType<TProblem> = ApiError & { readonly problem: TProblem | undefined }

/** Request body type the generated hooks use. */
export type BodyType<Body> = Body
