import { LayoutGrid } from 'lucide-react'
import { PageHeader } from '@/components/page-header'

export function CataloguePage() {
  return (
    <PageHeader
      icon={LayoutGrid}
      title="Catalogue"
      description="Search, filters and paging are built in #26."
    />
  )
}
