import { keepPreviousData } from '@tanstack/react-query'
import { Loader2, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiErrorMessage } from '@/api/error-message'
import { useGetApiCategories } from '@/api/generated/categories/categories'
import { useGetApiItems } from '@/api/generated/items/items'
import { categoryIcon } from '@/components/category-icon'
import { FormAlert } from '@/components/form-alert'
import { CatalogueIllustration } from '@/components/illustrations/catalogue-illustration'
import { ItemCard, ItemCardSkeleton, itemGridClass } from '@/components/item-card'
import { PageHeader } from '@/components/page-header'
import { Pagination } from '@/components/pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useFormat } from '@/i18n/format'
import { cn } from '@/lib/utils'
import {
  CATALOGUE_PAGE_SIZE,
  type CatalogueFilters,
  catalogueSorts,
  dateRangeState,
  isPriceRangeInvalid,
  toItemsParams,
  useCatalogueFilters,
} from '@/pages/catalogue/catalogue-filters'
import { FilterFields, SearchField } from '@/pages/catalogue/filter-panel'

const grid = cn(itemGridClass, 'md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3')

export function CataloguePage() {
  const { t } = useTranslation()
  const { filters, update, reset, hasFilters } = useCatalogueFilters()
  const [sheetOpen, setSheetOpen] = useState(false)
  const resultsRef = useRef<HTMLElement>(null)

  const categories = useGetApiCategories()
  // Keep showing the previous page while the next one loads, so the grid doesn't jump.
  const items = useGetApiItems(toItemsParams(filters), {
    query: { placeholderData: keepPreviousData },
  })

  const data = items.data
  const pageCount = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1

  // A shared or bookmarked link can point past the last page once items are removed.
  useEffect(() => {
    if (data && !items.isPlaceholderData && filters.page > pageCount) {
      update({ page: pageCount }, { replace: true })
    }
  }, [data, items.isPlaceholderData, filters.page, pageCount, update])

  function goToPage(page: number) {
    update({ page })
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    resultsRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  const slugById = new Map(categories.data?.map((category) => [category.id, category.slug]))
  const categoryName = categories.data?.find((c) => c.id === filters.categoryId)?.name
  const dates = dateRangeState(filters)
  const chosenDates = dates.kind === 'valid' ? { from: dates.from, to: dates.to } : undefined

  return (
    <>
      <PageHeader
        title={t('catalogue.title')}
        description={t('catalogue.description')}
        illustration={<CatalogueIllustration className="block h-auto w-full overflow-visible" />}
      />

      <div className="grid items-start gap-8 lg:grid-cols-[272px_minmax(0,1fr)]">
        <aside
          aria-label={t('catalogue.filters')}
          className="hidden flex-col gap-6 rounded-xl border bg-card p-5 lg:flex"
        >
          <SearchField search={filters.search} update={update} />
          <FilterFields filters={filters} update={update} categories={categories.data} />
          <Button variant="outline" size="lg" onClick={reset} disabled={!hasFilters}>
            {t('catalogue.reset')}
          </Button>
        </aside>

        <section
          ref={resultsRef}
          aria-labelledby="catalogue-results"
          className="min-w-0 scroll-mt-28"
        >
          {/* Phones and tablets: search plus a Filters button that opens a sheet. */}
          <div className="mb-5 flex items-end gap-2 lg:hidden">
            <SearchField search={filters.search} update={update} hideLabel />
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="lg" className="px-3">
                  <SlidersHorizontal aria-hidden />
                  {t('catalogue.filters')}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" closeLabel={t('layout.closeMenu')}>
                <SheetHeader>
                  <SheetTitle>{t('catalogue.filters')}</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 overflow-y-auto px-4">
                  <FilterFields filters={filters} update={update} categories={categories.data} />
                </div>
                <SheetFooter className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="lg" onClick={reset} disabled={!hasFilters}>
                    {t('catalogue.reset')}
                  </Button>
                  <Button size="lg" onClick={() => setSheetOpen(false)}>
                    {data
                      ? t('catalogue.showResults', { count: data.totalCount })
                      : t('catalogue.showResultsLoading')}
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2
                id="catalogue-results"
                aria-live="polite"
                className="flex items-center gap-2 text-lg leading-7 font-semibold"
              >
                {data ? t('catalogue.count', { count: data.totalCount }) : t('layout.loading')}
                {items.isFetching && data && (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
                )}
              </h2>
              <ActiveFilters
                filters={filters}
                categoryName={categoryName}
                update={update}
                className="mt-2"
              />
            </div>
            <SortSelect value={filters.sort} onChange={(sort) => update({ sort })} />
          </div>

          <Results
            isPending={items.isPending}
            error={items.isError && !data ? items.error : null}
            onRetry={() => void items.refetch()}
            hasFilters={hasFilters}
            onReset={reset}
            busy={items.isFetching}
            empty={data?.items.length === 0}
          >
            {data && data.items.length > 0 && (
              <>
                <ul className={grid}>
                  {data.items.map((item) => (
                    <li key={item.id}>
                      <ItemCard
                        item={item}
                        icon={categoryIcon(slugById.get(item.categoryId))}
                        dates={chosenDates}
                      />
                    </li>
                  ))}
                </ul>
                <Pagination
                  className="mt-8 border-t pt-6"
                  page={Math.min(filters.page, pageCount)}
                  pageCount={pageCount}
                  onPageChange={goToPage}
                  summary={t('catalogue.summary', {
                    from: (data.page - 1) * data.pageSize + 1,
                    to: (data.page - 1) * data.pageSize + data.items.length,
                    count: data.totalCount,
                  })}
                />
              </>
            )}
          </Results>
        </section>
      </div>
    </>
  )
}

/** Loading, error and empty states around the grid. */
function Results({
  isPending,
  error,
  onRetry,
  hasFilters,
  onReset,
  busy,
  empty,
  children,
}: {
  isPending: boolean
  error: unknown
  onRetry: () => void
  hasFilters: boolean
  onReset: () => void
  busy: boolean
  empty: boolean
  children: ReactNode
}) {
  const { t } = useTranslation()

  if (isPending) {
    return (
      <ul className={grid} aria-busy>
        {Array.from({ length: CATALOGUE_PAGE_SIZE / 2 }, (_, index) => (
          <li key={index}>
            <ItemCardSkeleton />
          </li>
        ))}
      </ul>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3">
        <FormAlert>
          {t('catalogue.error')} {apiErrorMessage(error)}
        </FormAlert>
        <Button variant="outline" size="lg" onClick={onRetry}>
          {t('catalogue.retry')}
        </Button>
      </div>
    )
  }

  if (empty) {
    return (
      <div className="flex flex-col items-center rounded-xl border bg-card px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <SearchX className="size-6" aria-hidden />
        </span>
        <h3 className="mt-4 text-lg font-semibold">
          {hasFilters ? t('catalogue.empty.title') : t('catalogue.empty.noItems')}
        </h3>
        {hasFilters && (
          <>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {t('catalogue.empty.text')}
            </p>
            <Button variant="outline" size="lg" className="mt-5" onClick={onReset}>
              {t('catalogue.reset')}
            </Button>
          </>
        )}
      </div>
    )
  }

  return <div aria-busy={busy}>{children}</div>
}

/** The filters in use as badges, each with a button that removes it. */
function ActiveFilters({
  filters,
  categoryName,
  update,
  className,
}: {
  filters: CatalogueFilters
  categoryName: string | undefined
  update: (changes: Partial<CatalogueFilters>) => void
  className?: string
}) {
  const { t } = useTranslation()
  const { formatPrice, formatDate } = useFormat()

  const chips: { key: string; label: string; remove: () => void }[] = []
  const search = filters.search.trim()
  if (search) {
    chips.push({
      key: 'search',
      label: t('catalogue.chipSearch', { search }),
      remove: () => update({ search: '' }),
    })
  }
  const dates = dateRangeState(filters)
  if (dates.kind === 'valid') {
    chips.push({
      key: 'dates',
      label: t('catalogue.dateRange', {
        from: formatDate(dates.from),
        to: formatDate(dates.to),
      }),
      remove: () => update({ from: undefined, to: undefined }),
    })
  }
  if (filters.categoryId !== undefined && categoryName) {
    chips.push({
      key: 'category',
      label: categoryName,
      remove: () => update({ categoryId: undefined }),
    })
  }
  if (!isPriceRangeInvalid(filters)) {
    const { minPrice: min, maxPrice: max } = filters
    const label =
      min !== undefined && max !== undefined
        ? t('catalogue.priceRange', { min: formatPrice(min), max: formatPrice(max) })
        : min !== undefined
          ? t('catalogue.priceFrom', { min: formatPrice(min) })
          : max !== undefined
            ? t('catalogue.priceTo', { max: formatPrice(max) })
            : null
    if (label) {
      chips.push({
        key: 'price',
        label,
        remove: () => update({ minPrice: undefined, maxPrice: undefined }),
      })
    }
  }

  if (chips.length === 0) return null

  return (
    <ul className={`flex flex-wrap gap-2 ${className ?? ''}`}>
      {chips.map((chip) => (
        <li key={chip.key}>
          <Badge tone="accent" className="py-0 pr-0.5">
            {chip.label}
            <button
              type="button"
              onClick={chip.remove}
              aria-label={t('catalogue.removeFilter', { name: chip.label })}
              className="flex size-5 items-center justify-center rounded-full outline-none hover:bg-[color-mix(in_oklch,var(--primary),var(--foreground)_25%)] focus-visible:ring-2 focus-visible:ring-primary-foreground"
            >
              <X className="size-3" aria-hidden />
            </button>
          </Badge>
        </li>
      ))}
    </ul>
  )
}

function SortSelect({
  value,
  onChange,
}: {
  value: CatalogueFilters['sort']
  onChange: (sort: CatalogueFilters['sort']) => void
}) {
  const { t } = useTranslation()

  return (
    <label className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
      {t('catalogue.sort')}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as CatalogueFilters['sort'])}
        className="h-9 min-w-48 flex-1 rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        {catalogueSorts.map((sort) => (
          <option key={sort} value={sort}>
            {t(`catalogue.sorts.${sort}`)}
          </option>
        ))}
      </select>
    </label>
  )
}
