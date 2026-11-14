import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router'
import { navItems } from '@/components/layout/nav-items'
import { cn } from '@/lib/utils'

interface Indicator {
  left: number
  width: number
}

/** Desktop menu: a purple pill slides under the active link. */
export function MainNav() {
  const { t, i18n } = useTranslation()
  const { pathname } = useLocation()
  const navRef = useRef<HTMLElement>(null)
  const [indicator, setIndicator] = useState<Indicator | null>(null)
  // Skip the animation on the first placement so the pill doesn't slide in from the left edge.
  const [animate, setAnimate] = useState(false)

  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const measure = () => {
      const active = nav.querySelector<HTMLElement>('a[aria-current="page"]')
      setIndicator(active ? { left: active.offsetLeft, width: active.offsetWidth } : null)
    }

    measure()
    // Re-measure when the size changes, e.g. when the web font finishes loading.
    const observer = new ResizeObserver(measure)
    observer.observe(nav)
    const timer = setTimeout(() => setAnimate(true))
    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
    // The language is a dependency because translated labels change the link widths.
  }, [pathname, i18n.resolvedLanguage])

  return (
    <nav
      ref={navRef}
      aria-label={t('layout.mainNav')}
      className="relative ml-auto hidden items-center gap-1 rounded-full border bg-muted p-1 md:flex"
    >
      <span
        aria-hidden
        className={cn(
          'absolute inset-y-1 rounded-full bg-primary shadow-sm shadow-primary/30',
          animate &&
            'transition-[left,width,opacity] duration-300 ease-out motion-reduce:transition-none',
          indicator ? 'opacity-100' : 'opacity-0',
        )}
        style={indicator ?? undefined}
      />

      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            cn(
              'relative z-10 flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-300 lg:px-4',
              isActive ? 'text-primary-foreground' : 'text-foreground/70 hover:text-primary',
            )
          }
        >
          {/* Icons only from lg up, so longer Estonian labels fit at md widths. */}
          <item.icon className="hidden size-4 lg:block" aria-hidden />
          {t(`nav.${item.labelKey}`)}
        </NavLink>
      ))}
    </nav>
  )
}
