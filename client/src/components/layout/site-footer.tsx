import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useGetApiCategories } from '@/api/generated/categories/categories'
import { useAuth } from '@/auth/auth-context'
import { useNavItems } from '@/components/layout/nav-items'
import { Logo } from '@/components/logo'

const year = new Date().getFullYear()

const linkClass =
  'rounded-sm text-band-muted outline-none transition-colors hover:text-band-foreground focus-visible:ring-3 focus-visible:ring-band-accent'

/** The dark full-width footer: brand and tagline, site links, categories and account links. */
export function SiteFooter() {
  const { t } = useTranslation()
  const navItems = useNavItems()
  const { status } = useAuth()
  // Usually cached already: the home page and the catalogue load them too.
  const categories = useGetApiCategories()

  return (
    <footer className="bg-band text-band-foreground">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Link
            to="/"
            className="inline-flex rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-band-accent"
          >
            <Logo variant="light" className="h-9" />
          </Link>
          <p className="max-w-xs text-sm text-band-muted">{t('layout.tagline')}</p>
        </div>

        <nav aria-label={t('layout.footerNav')} className="space-y-4">
          <h2 className="text-sm font-semibold tracking-wider uppercase">
            {t('layout.usefulLinks')}
          </h2>
          <ul className="space-y-2.5 text-sm">
            {navItems.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className={linkClass}>
                  {t(`nav.${item.labelKey}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {categories.data && categories.data.length > 0 && (
          <nav aria-label={t('layout.footerCategories')} className="space-y-4">
            <h2 className="text-sm font-semibold tracking-wider uppercase">
              {t('layout.footerCategories')}
            </h2>
            <ul className="space-y-2.5 text-sm">
              {categories.data.map((category) => (
                <li key={category.id}>
                  <Link to={`/catalogue?category=${category.id}`} className={linkClass}>
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <nav aria-label={t('layout.footerAccount')} className="space-y-4">
          <h2 className="text-sm font-semibold tracking-wider uppercase">
            {t('layout.footerAccount')}
          </h2>
          <ul className="space-y-2.5 text-sm">
            {status === 'authenticated' ? (
              <li>
                <Link to="/dashboard" className={linkClass}>
                  {t('account.dashboard')}
                </Link>
              </li>
            ) : (
              <>
                <li>
                  <Link to="/login" className={linkClass}>
                    {t('layout.logIn')}
                  </Link>
                </li>
                <li>
                  <Link to="/register" className={linkClass}>
                    {t('register.title')}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>

      <div className="border-t border-band-line">
        <p className="container-page py-6 text-center text-xs text-band-muted">
          {t('layout.copyright', { year })}
        </p>
      </div>
    </footer>
  )
}
