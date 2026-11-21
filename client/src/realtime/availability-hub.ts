import {
  HubConnectionBuilder,
  LogLevel,
  type HubConnection,
  type IRetryPolicy,
} from '@microsoft/signalr'
import type { Query, QueryClient } from '@tanstack/react-query'
import {
  getGetApiItemsIdAvailabilityQueryKey,
  getGetApiItemsQueryKey,
} from '@/api/generated/items/items'
import type {
  GetApiItemsIdAvailabilityParams,
  GetApiItemsParams,
  GetApiRentalsQuoteParams,
} from '@/api/generated/model'
import { getGetApiRentalsQuoteQueryKey } from '@/api/generated/rentals/rentals'
import { getAccessToken } from '@/lib/auth-token'
import { apiUrl } from '@/lib/config'

/** The API's SignalR hub for availability updates (`AvailabilityHub.Path`). Signed-in users only. */
export const AVAILABILITY_HUB_PATH = '/ws/availability'

/**
 * Sent by the API after a rental change is saved: item `itemId` became taken or free on some days
 * from `from` to `to` (`yyyy-MM-dd`, both inclusive).
 */
export interface AvailabilityChanged {
  itemId: number
  from: string
  to: string
}

/** Waits before each reconnect attempt: quickly at first, then every 30 s for as long as it takes. */
const RETRY_DELAYS_MS = [0, 2_000, 5_000, 10_000, 30_000]

export function retryDelay(previousRetryCount: number): number {
  return RETRY_DELAYS_MS[Math.min(previousRetryCount, RETRY_DELAYS_MS.length - 1)]!
}

/** Never gives up: the default policy stops after four tries, which would leave the page stale. */
const retryForever: IRetryPolicy = {
  nextRetryDelayInMilliseconds: ({ previousRetryCount }) => retryDelay(previousRetryCount),
}

/**
 * A connection to the availability hub. WebSockets can't send an `Authorization` header, so
 * `accessTokenFactory` hands the JWT to SignalR, which sends it as `?access_token=`. It is read on
 * every (re)connect, so a reconnect uses the current token.
 */
export function createAvailabilityConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(apiUrl(AVAILABILITY_HUB_PATH), {
      accessTokenFactory: () => getAccessToken() ?? '',
    })
    .withAutomaticReconnect(retryForever)
    .configureLogging(import.meta.env.DEV ? LogLevel.Warning : LogLevel.None)
    .build()
}

const itemsKey = getGetApiItemsQueryKey()[0]
const quoteKey = getGetApiRentalsQuoteQueryKey()[0]
const availabilityKey = /^\/api\/items\/\d+\/availability$/

/** True when two inclusive `yyyy-MM-dd` ranges share a day. Missing dates count as unbounded. */
function overlaps(from: string | undefined, to: string | undefined, change: AvailabilityChanged) {
  return (from === undefined || from <= change.to) && (to === undefined || change.from <= to)
}

/**
 * Whether a cached query can show different data after `change`, or after any change when `change`
 * is left out (e.g. after reconnecting, when events may have been missed):
 *
 * - the item's booked days (`GET /api/items/{id}/availability`) for overlapping dates;
 * - quotes for the item and overlapping dates, which fail once the dates are taken;
 * - catalogue lists searched by overlapping dates (their `isAvailable` flags) or sorted by popularity.
 */
export function isAffectedByAvailabilityChange(
  query: Pick<Query, 'queryKey'>,
  change?: AvailabilityChanged,
): boolean {
  const [path, params] = query.queryKey as [unknown, Record<string, unknown> | undefined]
  if (typeof path !== 'string') return false

  if (availabilityKey.test(path)) {
    if (!change) return true
    const p = params as GetApiItemsIdAvailabilityParams | undefined
    return (
      path === getGetApiItemsIdAvailabilityQueryKey(change.itemId)[0] &&
      overlaps(p?.From, p?.To, change)
    )
  }

  if (path === quoteKey) {
    const p = params as GetApiRentalsQuoteParams | undefined
    if (!change) return true
    return p?.ItemId === change.itemId && overlaps(p.From, p.To, change)
  }

  if (path === itemsKey) {
    const p = params as GetApiItemsParams | undefined
    if (p?.Sort === 'popularity') return true
    const dated = p?.From !== undefined && p.To !== undefined
    return dated && (!change || overlaps(p.From, p.To, change))
  }

  return false
}

/** Reloads the queries `change` affects (all availability queries when it is left out). */
export function invalidateAvailability(queryClient: QueryClient, change?: AvailabilityChanged) {
  return queryClient.invalidateQueries({
    predicate: (query) => isAffectedByAvailabilityChange(query, change),
  })
}
