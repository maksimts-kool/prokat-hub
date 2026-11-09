import { CalendarCheck } from 'lucide-react'
import { PageHeader } from '@/components/page-header'

export function MyRentalsPage() {
  return (
    <PageHeader
      icon={CalendarCheck}
      title="My rentals"
      description="Your bookings will be listed here (#30)."
    />
  )
}
