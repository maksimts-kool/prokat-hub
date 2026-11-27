import { keepPreviousData } from '@tanstack/react-query'
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table'
import { PackageSearch, Plus, Search } from 'lucide-react'
import { useId, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { apiErrorMessage } from '@/api/error-message'
import { useGetApiCategories } from '@/api/generated/categories/categories'
import { useGetApiItems } from '@/api/generated/items/items'
import type { ItemSummaryDto } from '@/api/generated/model'
import { LoadingRegion, TableSkeleton } from '@/components/skeletons'
import { Pagination } from '@/components/pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDebouncedInput } from '@/hooks/use-debounced-input'
import { useFormat } from '@/i18n/format'
import { RowActions } from '@/pages/dashboard/catalogue/row-actions'
import { tableStyles } from '@/pages/dashboard/catalogue/table-styles'
import { EmptyState, LoadError, RentalThumb } from '@/pages/dashboard/dashboard-ui'

const PAGE_SIZE = 20

const features = tableFeatures({})
const helper = createColumnHelper<typeof features, ItemSummaryDto>()

export interface ItemsPanelProps {
  search: URLSearchParams
  update: (changes: Record<string, string | undefined>) => void
  onCreate: () => void
  onEdit: (item: ItemSummaryDto) => void
  onRetire: (item: ItemSummaryDto) => void
}

/** Every item in the catalogue, searchable and filtered by category, with edit and retire. */
export function ItemsPanel({ search, update, onCreate, onEdit, onRetire }: ItemsPanelProps) {
  const { t } = useTranslation()
  const { formatPrice } = useFormat()
  const id = useId()
  const categories = useGetApiCategories()

  const query = search.get('q') ?? ''
  const categoryParam = Number(search.get('category'))
  const categoryId =
    Number.isInteger(categoryParam) && categoryParam > 0 ? categoryParam : undefined
  const page = Math.max(1, Number(search.get('page')) || 1)
  const searchInput = useDebouncedInput(query, (value) => update({ q: value.trim() || undefined }))

  const items = useGetApiItems(
    {
      Search: query || undefined,
      CategoryId: categoryId,
      Sort: 'name',
      Page: page,
      PageSize: PAGE_SIZE,
    },
    { query: { placeholderData: keepPreviousData } },
  )

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('name', {
          header: () => t('admin.items.columns.item'),
          cell: ({ row }) => (
            <div className="flex min-w-56 items-center gap-3">
              <RentalThumb src={row.original.imageUrls[0] ?? null} className="size-10" />
              <div className="min-w-0">
                <Link
                  to={`/catalogue/${row.original.id}`}
                  className="block font-semibold hover:text-primary hover:underline"
                >
                  {row.original.name}
                </Link>
                <span className="block text-xs text-muted-foreground">
                  {row.original.brand} · #{row.original.id}
                </span>
              </div>
            </div>
          ),
        }),
        helper.accessor('categoryName', {
          header: () => t('admin.items.columns.category'),
        }),
        helper.accessor('dailyPrice', {
          header: () => <span className="block text-right">{t('admin.items.columns.daily')}</span>,
          cell: ({ getValue }) => (
            <span className="block text-right font-semibold tabular-nums">
              {formatPrice(getValue())}
            </span>
          ),
        }),
        helper.accessor('deposit', {
          header: () => (
            <span className="block text-right">{t('admin.items.columns.deposit')}</span>
          ),
          cell: ({ getValue }) => (
            <span className="block text-right tabular-nums">{formatPrice(getValue())}</span>
          ),
        }),
        helper.display({
          id: 'actions',
          header: () => <span className="sr-only">{t('admin.columns.actions')}</span>,
          cell: ({ row }) => (
            <RowActions
              editLabel={t('admin.items.editNamed', { name: row.original.name })}
              deleteLabel={t('admin.items.retireNamed', { name: row.original.name })}
              onEdit={() => onEdit(row.original)}
              onDelete={() => onRetire(row.original)}
            />
          ),
        }),
      ]),
    [t, formatPrice, onEdit, onRetire],
  )

  const rows = items.data?.items ?? []
  const table = useTable({ features, columns, data: rows, getRowId: (row) => String(row.id) })
  const filtered = !!query || categoryId !== undefined

  let content
  if (items.isPending) {
    content = (
      <LoadingRegion>
        <TableSkeleton columns={5} />
      </LoadingRegion>
    )
  } else if (items.isError && !items.data) {
    content = (
      <LoadError message={apiErrorMessage(items.error)} onRetry={() => void items.refetch()} />
    )
  } else if (rows.length === 0) {
    content = (
      <div className="rounded-xl border bg-card">
        <EmptyState
          icon={PackageSearch}
          title={t(filtered ? 'admin.items.noMatches' : 'admin.items.empty')}
          className="py-12"
        >
          {filtered ? (
            <Button
              variant="outline"
              size="lg"
              className="px-3"
              onClick={() => update({ q: undefined, category: undefined })}
            >
              {t('admin.items.clearFilters')}
            </Button>
          ) : (
            <Button size="lg" className="px-3" onClick={onCreate}>
              <Plus aria-hidden />
              {t('admin.items.add')}
            </Button>
          )}
        </EmptyState>
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

        {/* Phones: the same rows as cards. */}
        <ul className="flex flex-col gap-3 md:hidden">
          {table.getRowModel().rows.map(({ original: item }) => (
            <li key={item.id} className="flex gap-3 rounded-xl border bg-card p-4 text-sm">
              <RentalThumb src={item.imageUrls[0] ?? null} className="size-14" />
              <div className="min-w-0 flex-1">
                <Link to={`/catalogue/${item.id}`} className="font-semibold hover:underline">
                  {item.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {item.brand} · {item.categoryName}
                </p>
                <p className="mt-1 tabular-nums">
                  <span className="font-semibold">
                    {t('admin.items.perDay', { price: formatPrice(item.dailyPrice) })}
                  </span>
                  <span className="text-muted-foreground">
                    {' · '}
                    {t('admin.items.depositShort', { amount: formatPrice(item.deposit) })}
                  </span>
                </p>
              </div>
              <RowActions
                className="flex-col"
                editLabel={t('admin.items.editNamed', { name: item.name })}
                deleteLabel={t('admin.items.retireNamed', { name: item.name })}
                onEdit={() => onEdit(item)}
                onDelete={() => onRetire(item)}
              />
            </li>
          ))}
        </ul>

        {items.data && (
          <Pagination
            className="mt-5"
            page={items.data.page}
            pageCount={Math.max(1, Math.ceil(items.data.totalCount / items.data.pageSize))}
            onPageChange={(next) => update({ page: String(next) })}
            summary={t('admin.items.summary', {
              from: (items.data.page - 1) * items.data.pageSize + 1,
              to: (items.data.page - 1) * items.data.pageSize + items.data.items.length,
              count: items.data.totalCount,
            })}
          />
        )}
      </>
    )
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 rounded-xl border bg-card p-4 md:flex-row md:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor={`${id}-search`}>{t('admin.items.search')}</Label>
          <div className="relative">
            <Input
              id={`${id}-search`}
              type="search"
              value={searchInput.text}
              placeholder={t('admin.items.searchPlaceholder')}
              onChange={(event) => searchInput.onChange(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && searchInput.flush()}
              className="h-9 bg-background pl-9"
            />
            <Search
              className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground"
              aria-hidden
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 md:w-56">
          <Label htmlFor={`${id}-category`}>{t('admin.items.category')}</Label>
          <select
            id={`${id}-category`}
            value={categoryId ?? ''}
            onChange={(event) => update({ category: event.target.value || undefined })}
            className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">{t('admin.items.allCategories')}</option>
            {categories.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <Button size="lg" className="px-3" onClick={onCreate}>
          <Plus aria-hidden />
          {t('admin.items.add')}
        </Button>
      </div>

      {content}
    </div>
  )
}
