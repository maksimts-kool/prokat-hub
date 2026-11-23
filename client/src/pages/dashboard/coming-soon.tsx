import { Hammer } from 'lucide-react'
import { EmptyState } from '@/pages/dashboard/dashboard-ui'

/** A dashboard section whose tools are not built yet: says what will be here. */
export function ComingSoon({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-card">
      <EmptyState icon={Hammer} title={title} text={text} className="py-14" />
    </div>
  )
}
