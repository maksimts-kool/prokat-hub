import { BASE_PATH } from '@/lib/config'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
}

/** Full "Prokat Hub" logo: icon plus wordmark, from public/logo.svg. */
export function Logo({ className }: LogoProps) {
  return (
    <img src={`${BASE_PATH}/logo.svg`} alt="Prokat Hub" className={cn('h-9 w-auto', className)} />
  )
}
