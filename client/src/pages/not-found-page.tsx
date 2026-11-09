import { SearchX } from 'lucide-react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="text-center">
      <PageHeader
        icon={SearchX}
        title="Page not found"
        description="The page you are looking for does not exist."
      />
      <Button asChild variant="outline">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  )
}
