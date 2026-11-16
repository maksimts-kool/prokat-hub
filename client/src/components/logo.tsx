import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
}

/** Full "Prokat Hub" logo: icon plus wordmark, from public/logo.svg. */
export function Logo({ className }: LogoProps) {
  return <img src="/logo.svg" alt="Prokat Hub" className={cn('h-9 w-auto', className)} />
}
