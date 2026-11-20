import { differenceInCalendarDays, format, isValid, parseISO } from 'date-fns'
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { GetApiItemsParams } from '@/api/generated/model'

/** Sort orders accepted by `GET /api/items?sort=`, in the order the dropdown lists them. */
export const catalogueSorts = ['name', 'name_desc', 'price', 'price_desc', 'popularity'] as const
export type CatalogueSort = (typeof catalogueSorts)[number]

export const CATALOGUE_PAGE_SIZE = 12
const PRICE_LIMIT = 1_000_000
/** Longest date range the API accepts (`DateRangeQuery.MaxDays`). */
export const MAX_DAYS = 366

/** The catalogue's filters. They live in the URL query string, so a filtered page can be shared. */
export interface CatalogueFilters {
  search: string
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  /** First rental day as `yyyy-MM-dd`. */
  from?: string
  /** Last rental day as `yyyy-MM-dd`. */
  to?: string
  sort: CatalogueSort
  page: number
}

/** Query string keys: `?q=sony&category=1&min=10&max=50&from=2026-12-07&to=2026-12-13&sort=price&page=2`. */
const keys = {
  search: 'q',
  categoryId: 'category',
  minPrice: 'min',
  maxPrice: 'max',
  from: 'from',
  to: 'to',
  sort: 'sort',
  page: 'page',
} as const

function positiveInt(value: string | null): number | undefined {
  const number = Number(value)
  return value && Number.isInteger(number) && number > 0 ? number : undefined
}

function price(value: string | null): number | undefined {
  const number = Number(value)
  return value && Number.isFinite(number) && number >= 0 && number <= PRICE_LIMIT
    ? number
    : undefined
}

export function isoDate(value: string | null): string | undefined {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value)) ? value : undefined
}

/** Today in the user's time zone as `yyyy-MM-dd`, the earliest pick-up day. */
export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/** Reads the filters from a query string, dropping values the API would reject. */
export function parseCatalogueFilters(params: URLSearchParams): CatalogueFilters {
  const sort = params.get(keys.sort)
  return {
    search: params.get(keys.search) ?? '',
    categoryId: positiveInt(params.get(keys.categoryId)),
    minPrice: price(params.get(keys.minPrice)),
    maxPrice: price(params.get(keys.maxPrice)),
    from: isoDate(params.get(keys.from)),
    to: isoDate(params.get(keys.to)),
    sort: catalogueSorts.find((value) => value === sort) ?? 'name',
    page: positiveInt(params.get(keys.page)) ?? 1,
  }
}

/** Writes the filters to a query string, leaving out defaults so the URL stays short. */
function toSearchParams(filters: CatalogueFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.search) params.set(keys.search, filters.search)
  if (filters.categoryId) params.set(keys.categoryId, String(filters.categoryId))
  if (filters.minPrice !== undefined) params.set(keys.minPrice, String(filters.minPrice))
  if (filters.maxPrice !== undefined) params.set(keys.maxPrice, String(filters.maxPrice))
  if (filters.from) params.set(keys.from, filters.from)
  if (filters.to) params.set(keys.to, filters.to)
  if (filters.sort !== 'name') params.set(keys.sort, filters.sort)
  if (filters.page > 1) params.set(keys.page, String(filters.page))
  return params
}

/** True when the minimum price is above the maximum; the range is then left out of the request. */
export function isPriceRangeInvalid({ minPrice, maxPrice }: CatalogueFilters): boolean {
  return minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice
}

export type DateRangeState =
  | { kind: 'none' | 'incomplete' | 'reversed' | 'past' | 'tooLong' }
  | { kind: 'valid'; from: string; to: string; days: number }

/** Whether the chosen dates can be sent; the API answers 400 for every other case. */
export function dateRangeState(
  { from, to }: Pick<CatalogueFilters, 'from' | 'to'>,
  today = todayIso(),
): DateRangeState {
  if (!from && !to) return { kind: 'none' }
  if (!from || !to) return { kind: 'incomplete' }
  if (from > to) return { kind: 'reversed' }
  if (from < today) return { kind: 'past' }
  const days = differenceInCalendarDays(parseISO(to), parseISO(from)) + 1
  if (days > MAX_DAYS) return { kind: 'tooLong' }
  return { kind: 'valid', from, to, days }
}

/** The filters as `GET /api/items` parameters. */
export function toItemsParams(filters: CatalogueFilters): GetApiItemsParams {
  const priceInvalid = isPriceRangeInvalid(filters)
  const dates = dateRangeState(filters)
  return {
    Search: filters.search.trim() || undefined,
    CategoryId: filters.categoryId,
    MinPrice: priceInvalid ? undefined : filters.minPrice,
    MaxPrice: priceInvalid ? undefined : filters.maxPrice,
    From: dates.kind === 'valid' ? dates.from : undefined,
    To: dates.kind === 'valid' ? dates.to : undefined,
    Sort: filters.sort === 'name' ? undefined : filters.sort,
    Page: filters.page,
    PageSize: CATALOGUE_PAGE_SIZE,
  }
}

export interface UpdateOptions {
  /** Replace the history entry instead of adding one; used while typing. */
  replace?: boolean
}

/**
 * The catalogue filters from the URL and a function to change them. Any change other than
 * the page itself goes back to page 1.
 */
export function useCatalogueFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseCatalogueFilters(searchParams), [searchParams])

  const update = useCallback(
    (changes: Partial<CatalogueFilters>, options?: UpdateOptions) => {
      setSearchParams(
        (current) => {
          const next = { ...parseCatalogueFilters(current), page: 1, ...changes }
          return toSearchParams(next)
        },
        { replace: options?.replace, preventScrollReset: true },
      )
    },
    [setSearchParams],
  )

  const reset = useCallback(
    () =>
      setSearchParams((current) => {
        // Keep the sort order: it is a view preference, not a filter.
        const { sort } = parseCatalogueFilters(current)
        return toSearchParams({ search: '', sort, page: 1 })
      }),
    [setSearchParams],
  )

  const hasFilters =
    filters.search.trim() !== '' ||
    filters.categoryId !== undefined ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.from !== undefined ||
    filters.to !== undefined

  return { filters, update, reset, hasFilters }
}
