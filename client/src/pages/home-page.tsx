import { ArrowRight, CircleCheck, CircleX, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import i18n from '@/i18n'
import { API_URL, apiUrl } from '@/lib/config'

type ApiStatus = 'checking' | 'online' | 'offline'

export function HomePage() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<ApiStatus>('checking')

  useEffect(() => {
    // Ignore the result after unmount instead of aborting the request. Aborting cancels the
    // server's health check mid-query, and React StrictMode remounts every effect in dev,
    // so the API would log a failed "database" health check on every page load.
    let ignore = false
    fetch(apiUrl('/health'))
      .then((response) => {
        if (!ignore) setStatus(response.ok ? 'online' : 'offline')
      })
      .catch((error: unknown) => {
        if (ignore) return
        setStatus('offline')
        // The global i18n.t keeps `t` out of the deps, so a language switch doesn't re-run the check.
        toast.error(i18n.t('home.apiUnreachable'), { description: String(error) })
      })
    return () => {
      ignore = true
    }
  }, [])

  return (
    <section className="space-y-8">
      <div className="space-y-5 rounded-2xl bg-primary px-6 py-12 text-primary-foreground sm:px-12 sm:py-16">
        <h1 className="max-w-xl text-3xl font-bold tracking-tight sm:text-5xl">
          {t('home.title')}
        </h1>
        <p className="max-w-lg text-primary-foreground/80 sm:text-lg">{t('home.lead')}</p>
        <Button asChild variant="highlight" size="lg" className="px-5">
          <Link to="/catalogue">
            {t('home.browse')}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>

      <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
        {status === 'checking' && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {status === 'online' && <CircleCheck className="size-4 text-green-600" aria-hidden />}
        {status === 'offline' && <CircleX className="size-4 text-destructive" aria-hidden />}
        {t(`home.apiStatus.${status}`)} <code>{API_URL}</code>
      </p>
    </section>
  )
}
