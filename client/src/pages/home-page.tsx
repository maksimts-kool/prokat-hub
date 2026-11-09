import { ArrowRight, CircleCheck, CircleX, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { API_URL, apiUrl } from '@/lib/config'

type ApiStatus = 'checking' | 'online' | 'offline'

export function HomePage() {
  const [status, setStatus] = useState<ApiStatus>('checking')

  useEffect(() => {
    const controller = new AbortController()
    fetch(apiUrl('/health'), { signal: controller.signal })
      .then((response) => setStatus(response.ok ? 'online' : 'offline'))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setStatus('offline')
        toast.error('Cannot reach the API', { description: String(error) })
      })
    return () => controller.abort()
  }, [])

  return (
    <section className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Rent cameras, drones, laptops and more
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Pick your dates, see the price with longer-rental discounts and book in a minute.
        </p>
        <Button asChild size="lg">
          <Link to="/catalogue">
            Browse the catalogue
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>

      <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
        {status === 'checking' && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {status === 'online' && <CircleCheck className="size-4 text-green-600" aria-hidden />}
        {status === 'offline' && <CircleX className="size-4 text-destructive" aria-hidden />}
        API {status} at <code>{API_URL}</code>
      </p>
    </section>
  )
}
