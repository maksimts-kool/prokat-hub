import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Edit and delete icon buttons for a table row; the labels name the row for screen readers. */
export function RowActions({
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
  className,
}: {
  editLabel: string
  deleteLabel: string
  onEdit: () => void
  onDelete: () => void
  className?: string
}) {
  return (
    <div className={cn('flex justify-end gap-1', className)}>
      <Button variant="outline" size="icon-lg" title={editLabel} onClick={onEdit}>
        <Pencil aria-hidden />
        <span className="sr-only">{editLabel}</span>
      </Button>
      <Button
        variant="ghost"
        size="icon-lg"
        title={deleteLabel}
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 aria-hidden />
        <span className="sr-only">{deleteLabel}</span>
      </Button>
    </div>
  )
}
