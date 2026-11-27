import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'

export function AppLayout() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      {/* The first Tab stop: keyboard users can jump past the header links straight to the page. */}
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-lg focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:px-4 focus:py-2.5 focus:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {t('layout.skipToContent')}
      </a>
      <SiteHeader />
      <main
        id="main-content"
        // Focusable from the skip link only, so focus lands at the start of the page without a ring.
        tabIndex={-1}
        // Every page opens with a full-bleed band; the rest sits in the centred content column.
        className="page-grid w-full flex-1 pb-16 outline-none"
      >
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
