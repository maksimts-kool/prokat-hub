import { BASE_PATH } from '@/lib/config'
import { cn } from '@/lib/utils'

interface LogoProps {
  /** `light` has a white wordmark, for the dark band (the header). */
  variant?: 'default' | 'light'
  className?: string
}

/** Full "Prokat Hub" logo: icon plus wordmark, from public/logo.svg (or logo-light.svg). */
export function Logo({ variant = 'default', className }: LogoProps) {
  const file = variant === 'light' ? 'logo-light.svg' : 'logo.svg'
  return (
    <img src={`${BASE_PATH}/${file}`} alt="Prokat Hub" className={cn('h-9 w-auto', className)} />
  )
}
