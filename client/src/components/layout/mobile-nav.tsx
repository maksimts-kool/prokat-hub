import { Menu } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'
import { navItems } from '@/components/layout/nav-items'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

/** Hamburger menu shown below the md breakpoint. */
export function MobileNav() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label={t('layout.openMenu')}>
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72" closeLabel={t('layout.closeMenu')}>
        <SheetHeader>
          <SheetTitle>
            <Logo />
          </SheetTitle>
        </SheetHeader>
        <nav aria-label={t('layout.mobileNav')} className="flex flex-col gap-1 px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-foreground/70',
                )
              }
            >
              <item.icon className="size-4" aria-hidden />
              {t(`nav.${item.labelKey}`)}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-2 border-t p-4">
          <p className="text-xs font-medium text-muted-foreground">{t('language.label')}</p>
          <LanguageSwitcher variant="full" />
        </div>
      </SheetContent>
    </Sheet>
  )
}
