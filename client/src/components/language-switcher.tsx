import { useTranslation } from 'react-i18next'
import { getLanguage, languages } from '@/i18n/languages'
import { cn } from '@/lib/utils'

interface LanguageSwitcherProps {
  /** `compact` shows "EN / ET" for the header; `full` shows the language names for the mobile menu. */
  variant?: 'compact' | 'full'
  className?: string
}

/** Segmented control that switches the UI language. The choice is saved in localStorage. */
export function LanguageSwitcher({ variant = 'compact', className }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation()
  const active = getLanguage(i18n.resolvedLanguage).code

  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className={cn('flex items-center gap-1 rounded-full border bg-muted p-1', className)}
    >
      {languages.map((language) => {
        const isActive = language.code === active
        return (
          <button
            key={language.code}
            type="button"
            lang={language.code}
            title={language.name}
            aria-pressed={isActive}
            onClick={() => void i18n.changeLanguage(language.code)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
              variant === 'full' && 'flex-1 text-sm',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                : 'text-foreground/70 hover:text-primary',
            )}
          >
            {variant === 'full' ? language.name : language.short}
          </button>
        )
      })}
    </div>
  )
}
