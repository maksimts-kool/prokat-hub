import { type LucideIcon, Search } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { CategoryDto } from '@/api/generated/model'
import { categoryIcon } from '@/components/category-icon'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDebouncedInput } from '@/hooks/use-debounced-input'
import { cn } from '@/lib/utils'
import {
  type CatalogueFilters,
  dateRangeState,
  isPriceRangeInvalid,
  todayIso,
  type UpdateOptions,
} from './catalogue-filters'

type Update = (changes: Partial<CatalogueFilters>, options?: UpdateOptions) => void

const groupLabel = 'text-sm leading-5 font-medium'

/** The search box. It updates the URL 300 ms after the last keystroke, or at once on Enter. */
export function SearchField({
  search,
  update,
  hideLabel = false,
}: {
  search: string
  update: Update
  hideLabel?: boolean
}) {
  const { t } = useTranslation()
  const id = useId()
  const { text, onChange, flush } = useDebouncedInput(search, (value) =>
    update({ search: value }, { replace: true }),
  )

  return (
    <div className="flex flex-1 flex-col gap-2">
      <Label htmlFor={id} className={cn(groupLabel, hideLabel && 'sr-only')}>
        {t('catalogue.search')}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="search"
          value={text}
          maxLength={100}
          placeholder={t('catalogue.searchPlaceholder')}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') flush()
          }}
          className="h-9 bg-background pl-9"
        />
        <Search
          className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground"
          aria-hidden
        />
      </div>
    </div>
  )
}

/** Dates, category list and price range: the filter column on desktop, a sheet on phones. */
export function FilterFields({
  filters,
  update,
  categories,
}: {
  filters: CatalogueFilters
  update: Update
  categories: CategoryDto[] | undefined
}) {
  const { t } = useTranslation()
  const total = categories?.reduce((sum, category) => sum + category.itemCount, 0)

  return (
    <>
      <DateRange filters={filters} update={update} />

      <fieldset className="flex flex-col gap-2">
        <legend className={cn(groupLabel, 'mb-2')}>{t('catalogue.category')}</legend>
        <ul className="flex flex-col gap-0.5">
          <CategoryOption
            label={t('catalogue.allCategories')}
            count={total}
            selected={filters.categoryId === undefined}
            onSelect={() => update({ categoryId: undefined })}
          />
          {categories
            ? categories.map((category) => (
                <CategoryOption
                  key={category.id}
                  label={category.name}
                  icon={categoryIcon(category.slug)}
                  count={category.itemCount}
                  selected={filters.categoryId === category.id}
                  onSelect={() => update({ categoryId: category.id })}
                />
              ))
            : Array.from({ length: 7 }, (_, index) => (
                <li key={index} aria-hidden className="h-8 animate-pulse rounded-md bg-muted" />
              ))}
        </ul>
      </fieldset>

      <PriceRange filters={filters} update={update} />
    </>
  )
}

function CategoryOption({
  label,
  icon: Icon,
  count,
  selected,
  onSelect,
}: {
  label: string
  icon?: LucideIcon
  count?: number
  selected: boolean
  onSelect: () => void
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
          selected ? 'bg-accent font-medium text-accent-foreground' : 'hover:bg-muted',
        )}
      >
        {Icon && (
          <Icon
            className={cn('size-4', selected ? 'text-accent-foreground' : 'text-muted-foreground')}
            aria-hidden
          />
        )}
        <span className="flex-1">{label}</span>
        {count !== undefined && (
          <span
            className={cn(
              'text-xs tabular-nums',
              selected ? 'text-accent-foreground' : 'text-muted-foreground',
            )}
          >
            {count}
          </span>
        )}
      </button>
    </li>
  )
}

function PriceRange({ filters, update }: { filters: CatalogueFilters; update: Update }) {
  const { t } = useTranslation()
  const errorId = useId()
  const invalid = isPriceRangeInvalid(filters)

  const toPrice = (value: string) => {
    const number = Number(value)
    return value.trim() === '' || !Number.isFinite(number) || number < 0 ? undefined : number
  }
  const min = useDebouncedInput(filters.minPrice?.toString() ?? '', (value) =>
    update({ minPrice: toPrice(value) }, { replace: true }),
  )
  const max = useDebouncedInput(filters.maxPrice?.toString() ?? '', (value) =>
    update({ maxPrice: toPrice(value) }, { replace: true }),
  )

  const inputProps = {
    type: 'number',
    inputMode: 'decimal',
    min: 0,
    max: 1_000_000,
    step: 1,
    'aria-invalid': invalid || undefined,
    'aria-describedby': invalid ? errorId : undefined,
    className: 'h-9 bg-background',
  } as const

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={cn(groupLabel, 'mb-2')}>{t('catalogue.price')}</legend>
      <div className="grid grid-cols-2 gap-2">
        <Input
          {...inputProps}
          aria-label={t('catalogue.minPriceLabel')}
          placeholder={t('catalogue.minPrice')}
          value={min.text}
          onChange={(event) => min.onChange(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && min.flush()}
        />
        <Input
          {...inputProps}
          aria-label={t('catalogue.maxPriceLabel')}
          placeholder={t('catalogue.maxPrice')}
          value={max.text}
          onChange={(event) => max.onChange(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && max.flush()}
        />
      </div>
      {invalid && (
        <p id={errorId} className="text-xs text-destructive">
          {t('catalogue.priceInvalid')}
        </p>
      )}
    </fieldset>
  )
}

/** Pick-up and return days. Items taken on any of them are marked in the grid, not hidden. */
function DateRange({ filters, update }: { filters: CatalogueFilters; update: Update }) {
  const { t } = useTranslation()
  const fromId = useId()
  const toId = useId()
  const messageId = useId()
  const today = todayIso()
  const state = dateRangeState(filters, today)
  const error =
    state.kind === 'reversed'
      ? t('catalogue.datesReversed')
      : state.kind === 'past'
        ? t('catalogue.datesPast')
        : state.kind === 'tooLong'
          ? t('catalogue.datesTooLong')
          : undefined
  const hint =
    state.kind === 'valid'
      ? t('catalogue.datesHint', { count: state.days })
      : t('catalogue.datesIncomplete')

  const inputProps = {
    type: 'date',
    'aria-invalid': error ? true : undefined,
    'aria-describedby': messageId,
    className: 'h-9 bg-background',
  } as const

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={cn(groupLabel, 'mb-2')}>{t('catalogue.dates')}</legend>
      <div className="grid gap-2">
        <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-2">
          <Label htmlFor={fromId} className="font-normal text-muted-foreground">
            {t('catalogue.pickUp')}
          </Label>
          <Input
            {...inputProps}
            id={fromId}
            min={today}
            value={filters.from ?? ''}
            onChange={(event) => {
              const from = event.target.value || undefined
              // A return day before the new pick-up day no longer makes sense.
              const to = from && filters.to && filters.to < from ? undefined : filters.to
              update({ from, to }, { replace: true })
            }}
          />
        </div>
        <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-2">
          <Label htmlFor={toId} className="font-normal text-muted-foreground">
            {t('catalogue.return')}
          </Label>
          <Input
            {...inputProps}
            id={toId}
            min={filters.from && filters.from > today ? filters.from : today}
            value={filters.to ?? ''}
            onChange={(event) => update({ to: event.target.value || undefined }, { replace: true })}
          />
        </div>
      </div>
      <p
        id={messageId}
        className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}
      >
        {error ?? hint}
      </p>
    </fieldset>
  )
}
