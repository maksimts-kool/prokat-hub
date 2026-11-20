import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  /** E.g. "Showing 1–12 of 33 items", on the left. */
  summary?: ReactNode
  className?: string
}

/** Page numbers to show: the first, the last and the neighbours of the current page, with gaps. */
function pageNumbers(page: number, pageCount: number): (number | 'gap')[] {
  const result: (number | 'gap')[] = []
  for (let i = 1; i <= pageCount; i++) {
    if (i === 1 || i === pageCount || Math.abs(i - page) <= 1) result.push(i)
    else if (result.at(-1) !== 'gap') result.push('gap')
  }
  return result
}

/** Previous / next and page numbers for a `PagedResult`. */
export function Pagination({ page, pageCount, onPageChange, summary, className }: PaginationProps) {
  const { t } = useTranslation()

  return (
    <nav
      aria-label={t('pagination.label')}
      className={cn(
        'flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-center',
        className,
      )}
    >
      {summary && <p className="text-sm text-muted-foreground">{summary}</p>}
      {pageCount > 1 && (
        <ul className="flex items-center gap-1">
          <li>
            <Button
              variant="outline"
              size="icon-lg"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label={t('pagination.previous')}
            >
              <ChevronLeft />
            </Button>
          </li>
          {pageNumbers(page, pageCount).map((number, index) =>
            number === 'gap' ? (
              <li
                key={`gap-${index}`}
                aria-hidden
                className="w-9 text-center text-muted-foreground"
              >
                …
              </li>
            ) : (
              <li key={number}>
                <Button
                  variant={number === page ? 'default' : 'ghost'}
                  size="icon-lg"
                  onClick={() => onPageChange(number)}
                  aria-current={number === page ? 'page' : undefined}
                  aria-label={t('pagination.page', { page: number })}
                  className="tabular-nums"
                >
                  {number}
                </Button>
              </li>
            ),
          )}
          <li>
            <Button
              variant="outline"
              size="icon-lg"
              disabled={page >= pageCount}
              onClick={() => onPageChange(page + 1)}
              aria-label={t('pagination.next')}
            >
              <ChevronRight />
            </Button>
          </li>
        </ul>
      )}
    </nav>
  )
}
