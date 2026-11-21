import { createContext, useContext } from 'react'

/**
 * The availability hub connection:
 * - `off`: nobody is signed in (the hub only accepts signed-in users);
 * - `connecting`: the first connection is being opened, or retried after it failed;
 * - `live`: connected, so pages follow other people's bookings;
 * - `lost`: an open connection dropped and is reconnecting; data may be out of date.
 */
export type LiveStatus = 'off' | 'connecting' | 'live' | 'lost'

export const LiveStatusContext = createContext<LiveStatus>('off')

/** The state of live availability updates. `off` outside `LiveAvailabilityProvider`. */
export function useLiveStatus(): LiveStatus {
  return useContext(LiveStatusContext)
}
