import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table'
import { FolderOpen, type LucideIcon, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { apiErrorMessage } from '@/api/error-message'
import { useGetApiCategories } from '@/api/generated/categories/categories'
import type { CategoryDto } from '@/api/generated/model'
import { categoryIcon } from '@/components/category-icon'
import { PageLoader } from '@/components/page-loader'
import { Button } from '@/components/ui/button'
import { RowActions } from '@/pages/dashboard/catalogue/row-actions'
import { tableStyles } from '@/pages/dashboard/catalogue/table-styles'
import { EmptyState, LoadError } from '@/pages/dashboard/dashboard-ui'

const features = tableFeatures({})
const helper = createColumnHelper<typeof features, CategoryDto>()

function IconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
      <Icon className="size-4" aria-hidden />
    </span>
  )
}

function CategoryName({ category }: { category: CategoryDto }) {
  return (
    <div className="flex min-w-44 items-center gap-3">
      <IconTile icon={categoryIcon(category.slug)} />
      <div className="min-w-0">
        <span className="block font-semibold">{category.name}</span>
        <span className="block font-mono text-xs text-muted-foreground">{category.slug}</span>
      </div>
    </div>
  )
}

export interface CategoriesPanelProps {
  onCreate: () => void
  onEdit: (category: CategoryDto) => void
  onDelete: (category: CategoryDto) => void
}

/** Every category with its item count, with add, edit and delete. */
export function CategoriesPanel({ onCreate, onEdit, onDelete }: CategoriesPanelProps) {
  const { t } = useTranslation()
  const categories = useGetApiCategories()

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('name', {
          header: () => t('admin.categories.columns.category'),
          cell: ({ row }) => <CategoryName category={row.original} />,
        }),
        helper.accessor('description', {
          header: () => t('admin.categories.columns.description'),
          cell: ({ getValue }) => (
            <span className="line-clamp-2 max-w-md text-muted-foreground">{getValue() ?? '—'}</span>
          ),
        }),
        helper.accessor('itemCount', {
          header: () => (
            <span className="block text-right">{t('admin.categories.columns.items')}</span>
          ),
          cell: ({ getValue }) => (
            <span className="block text-right font-semibold tabular-nums">{getValue()}</span>
          ),
        }),
        helper.display({
          id: 'actions',
          header: () => <span className="sr-only">{t('admin.columns.actions')}</span>,
          cell: ({ row }) => (
            <RowActions
              editLabel={t('admin.categories.editNamed', { name: row.original.name })}
              deleteLabel={t('admin.categories.deleteNamed', { name: row.original.name })}
              onEdit={() => onEdit(row.original)}
              onDelete={() => onDelete(row.original)}
            />
          ),
        }),
      ]),
    [t, onEdit, onDelete],
  )

  const rows = categories.data ?? []
  const table = useTable({ features, columns, data: rows, getRowId: (row) => String(row.id) })

  let content
  if (categories.isPending) {
    content = <PageLoader />
  } else if (categories.isError) {
    content = (
      <LoadError
        message={apiErrorMessage(categories.error)}
        onRetry={() => void categories.refetch()}
      />
    )
  } else if (rows.length === 0) {
    content = (
      <div className="rounded-xl border bg-card">
        <EmptyState icon={FolderOpen} title={t('admin.categories.empty')} className="py-12" />
      </div>
    )
  } else {
    content = (
      <>
        <div className={tableStyles.wrapper}>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id} className={tableStyles.headRow}>
                  {group.headers.map((header) => (
                    <th key={header.id} className={tableStyles.th}>
                      {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="align-middle">
                  {row.getAllCells().map((cell) => (
                    <td key={cell.id} className={tableStyles.td}>
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="flex flex-col gap-3 md:hidden">
          {rows.map((category) => (
            <li key={category.id} className="rounded-xl border bg-card p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <CategoryName category={category} />
                <RowActions
                  editLabel={t('admin.categories.editNamed', { name: category.name })}
                  deleteLabel={t('admin.categories.deleteNamed', { name: category.name })}
                  onEdit={() => onEdit(category)}
                  onDelete={() => onDelete(category)}
                />
              </div>
              {category.description && (
                <p className="mt-2 text-muted-foreground">{category.description}</p>
              )}
              <p className="mt-2 text-xs font-medium">
                {t('admin.categories.itemCount', { count: category.itemCount })}
              </p>
            </li>
          ))}
        </ul>
      </>
    )
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{t('admin.categories.lead')}</p>
        <Button size="lg" className="shrink-0 px-3" onClick={onCreate}>
          <Plus aria-hidden />
          {t('admin.categories.add')}
        </Button>
      </div>
      {content}
    </div>
  )
}
