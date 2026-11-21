import { useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '@/auth/auth-context'
import {
  type AvailabilityChanged,
  createAvailabilityConnection,
  invalidateAvailability,
  retryDelay,
} from '@/realtime/availability-hub'
import { type LiveStatus, LiveStatusContext } from '@/realtime/live-status-context'

const LOST_TOAST_ID = 'live-availability-lost'

/**
 * Keeps a SignalR connection to the availability hub while someone is signed in, and reloads the
 * booked days, quotes and catalogue lists an `AvailabilityChanged` message touches, so an open item
 * page shows another customer's booking without a refresh.
 *
 * Reconnects on its own. The user is told only when an open connection is lost; a first connection
 * that fails is retried quietly. Rendered inside `AuthProvider`.
 */
export function LiveAvailabilityProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const userId = user?.id
  // What the connection for `userId` last reported. Before it reports, it is still connecting.
  const [reported, setReported] = useState<{ userId: string; status: LiveStatus }>()
  const status: LiveStatus =
    userId === undefined ? 'off' : reported?.userId === userId ? reported.status : 'connecting'

  useEffect(() => {
    if (userId === undefined) return
    const setStatus = (next: LiveStatus) => setReported({ userId, status: next })

    // A new connection for each user: the token is part of the connection.
    const connection = createAvailabilityConnection()
    let disposed = false
    let wasLive = false
    let attempts = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    connection.on('AvailabilityChanged', (change: AvailabilityChanged) => {
      void invalidateAvailability(queryClient, change)
    })
    connection.onreconnecting(() => setStatus('lost'))
    connection.onreconnected(() => {
      setStatus('live')
      // Changes made while disconnected were not sent to us.
      void invalidateAvailability(queryClient)
    })
    // Automatic reconnect never gives up, so this is the first connection dropping before it is
    // set up, or the server closing it; start over unless we are the ones stopping it.
    connection.onclose(() => {
      if (disposed) return
      setStatus(wasLive ? 'lost' : 'connecting')
      retry()
    })

    async function start() {
      try {
        await connection.start()
        if (disposed) return
        attempts = 0
        if (wasLive) void invalidateAvailability(queryClient)
        wasLive = true
        setStatus('live')
      } catch {
        if (!disposed) retry()
      }
    }

    function retry() {
      clearTimeout(timer)
      timer = setTimeout(() => void start(), retryDelay(attempts++))
    }

    void start()

    return () => {
      disposed = true
      clearTimeout(timer)
      void connection.stop()
      // The same user signing in again starts over from connecting.
      setReported(undefined)
    }
  }, [userId, queryClient])

  // One notice while the connection is lost; it goes away by itself once it is back.
  useEffect(() => {
    if (status === 'lost') {
      toast.warning(t('realtime.lost'), {
        id: LOST_TOAST_ID,
        description: t('realtime.lostDescription'),
        duration: Infinity,
      })
    } else {
      toast.dismiss(LOST_TOAST_ID)
    }
  }, [status, t])

  return <LiveStatusContext value={status}>{children}</LiveStatusContext>
}
