import {
  ArrowRight,
  CalendarCheck,
  ChevronDown,
  CircleCheck,
  Package,
  Percent,
  RefreshCw,
  Search,
  ShieldCheck,
  Undo2,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useGetApiCategories } from '@/api/generated/categories/categories'
import { useGetApiItems } from '@/api/generated/items/items'
import type { CategoryDto, ItemSummaryDto } from '@/api/generated/model'
import { useGetApiRentalsMy } from '@/api/generated/rentals/rentals'
import { useAuth } from '@/auth/auth-context'
import { Role } from '@/auth/roles'
import { categoryIcon } from '@/components/category-icon'
import { HeroIllustration } from '@/components/illustrations/hero-illustration'
import { ItemCard, ItemCardSkeleton } from '@/components/item-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useFormat } from '@/i18n/format'
import { discountTiers } from '@/lib/discount-tiers'
import { todayIso } from '@/lib/rentals'
import { BookingSearch } from '@/pages/home/booking-search'

/**
 * Every item, most rented first. The API caps a page at 100 and the demo catalogue has 33 items,
 * so one request feeds the popular categories, the popular items and the starting prices.
 */
const ALL_ITEMS = { Sort: 'popularity', PageSize: 100 } as const
/** How many categories and items the home page shows. */
const POPULAR_COUNT = 4
/** Late fee per day as a share of the daily price (`DemoCatalogue.LateFeeRate`). */
const LATE_FEE_RATE = 1.5

const sectionHeading = 'text-2xl leading-8 font-semibold'
const sectionSub = 'mt-1 text-sm text-muted-foreground'

export function HomePage() {
  const categories = useGetApiCategories()
  const allItems = useGetApiItems(ALL_ITEMS)

  const items = allItems.data?.items
  const slugById = new Map(categories.data?.map((category) => [category.id, category.slug]))
  const minPriceByCategory = new Map<number, number>()
  for (const item of items ?? []) {
    const current = minPriceByCategory.get(item.categoryId)
    if (current === undefined || item.dailyPrice < current) {
      minPriceByCategory.set(item.categoryId, item.dailyPrice)
    }
  }
  const lowestPrice = items?.length ? Math.min(...items.map((item) => item.dailyPrice)) : undefined
  const popularItems = items?.slice(0, POPULAR_COUNT)
  // Categories in the order their most rented item appears; empty categories never show up.
  const popularCategoryIds = [...new Set(items?.map((item) => item.categoryId))].slice(
    0,
    POPULAR_COUNT,
  )
  const popularCategories =
    items && categories.data
      ? popularCategoryIds
          .map((id) => categories.data.find((category) => category.id === id))
          .filter((category) => category !== undefined)
      : undefined
  const tierItem = popularItems?.[0]

  return (
    <div className="flex flex-col gap-12">
      <NextPickup />
      <Hero
        itemCount={categories.data?.reduce((sum, category) => sum + category.itemCount, 0)}
        lowestPrice={lowestPrice}
      />
      <Categories categories={popularCategories} minPrices={minPriceByCategory} />
      <Popular items={popularItems} isPending={allItems.isPending} slugById={slugById} />
      <HowItWorks />
      {tierItem && <Discounts item={tierItem} />}
      <GoodToKnow lateFeeItem={tierItem} />
    </div>
  )
}

/** A signed-in customer's next booked pickup, the first thing they need on coming back. */
function NextPickup() {
  const { t } = useTranslation()
  const { formatDate } = useFormat()
  const { status, hasRole } = useAuth()
  const isCustomer = status === 'authenticated' && hasRole(Role.Customer)
  const rentals = useGetApiRentalsMy({ query: { enabled: isCustomer } })

  if (!isCustomer || !rentals.data) return null
  const today = todayIso()
  const next = rentals.data
    .filter((rental) => rental.status === 'Booked' && rental.startDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0]
  if (!next) return null

  return (
    <section
      aria-label={t('home.nextPickup.label')}
      className="-mb-6 flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
    >
      <p className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <CalendarCheck className="size-5" aria-hidden />
        </span>
        <span>
          <span className="block text-sm text-muted-foreground">{t('home.nextPickup.label')}</span>
          <span className="font-semibold">
            {t('home.nextPickup.text', {
              item: next.itemName,
              from: formatDate(next.startDate),
              to: formatDate(next.endDate),
            })}
          </span>
        </span>
      </p>
      <Button asChild variant="outline" size="lg" className="self-start px-4 sm:self-auto">
        <Link to="/dashboard/rentals">{t('home.nextPickup.open')}</Link>
      </Button>
    </section>
  )
}

function Hero({ itemCount, lowestPrice }: { itemCount?: number; lowestPrice?: number }) {
  const { t } = useTranslation()
  const { formatPrice } = useFormat()
  const trust: { icon: LucideIcon; label: string }[] = [
    { icon: CircleCheck, label: t('home.trust.live') },
    { icon: CalendarCheck, label: t('home.trust.noDouble') },
    { icon: ShieldCheck, label: t('home.trust.cancel') },
    { icon: RefreshCw, label: t('home.trust.deposit') },
  ]

  return (
    <section
      aria-labelledby="home-title"
      className="flex flex-col gap-6 overflow-hidden rounded-2xl bg-band p-6 text-band-foreground sm:gap-8 sm:p-8 lg:gap-10 lg:rounded-4xl lg:p-10"
    >
      <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_240px] lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_500px]">
        <div className="relative z-10 flex flex-col items-start gap-4">
          {itemCount !== undefined && lowestPrice !== undefined && (
            <p className="inline-flex items-center gap-2 text-sm font-medium text-band-muted">
              <Zap className="size-4 text-band-accent" aria-hidden />
              {t('home.eyebrow', { count: itemCount, price: formatPrice(lowestPrice) })}
            </p>
          )}
          <h1
            id="home-title"
            className="max-w-170 text-[34px] leading-[38px] font-extrabold tracking-[-0.03em] text-balance sm:text-[44px] sm:leading-[48px] xl:text-5xl xl:leading-[52px]"
          >
            {t('home.title')}{' '}
            <em className="pr-[0.06em] text-band-accent">{t('home.titleAccent')}</em>
          </h1>
          <p className="max-w-130 text-band-muted sm:text-lg">{t('home.lead')}</p>
        </div>
        {/* From tablet width up, so the band never has an empty right half; full size from lg. */}
        {/* Out of the flow, so it never pushes the search down; it reaches into the band's padding
            and may sit behind the top of the search bar. */}
        <div className="relative hidden self-stretch md:block">
          <HeroIllustration className="absolute -top-8 -right-8 h-auto w-[300px] overflow-visible lg:-top-10 lg:-right-10 lg:w-[420px] xl:w-[440px]" />
        </div>
      </div>

      <BookingSearch />

      {/* Quiet reassurance under the search: small icons, muted text, no boxes or rules. */}
      <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-band-muted lg:justify-center">
        {trust.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-2">
            <Icon className="size-4 shrink-0 text-band-accent" aria-hidden />
            {label}
          </li>
        ))}
      </ul>
    </section>
  )
}

function SectionHead({
  id,
  title,
  sub,
  action,
}: {
  id: string
  title: string
  sub: string
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div>
        <h2 id={id} className={sectionHeading}>
          {title}
        </h2>
        <p className={sectionSub}>{sub}</p>
      </div>
      {action}
    </div>
  )
}

function Categories({
  categories,
  minPrices,
}: {
  categories: CategoryDto[] | undefined
  minPrices: Map<number, number>
}) {
  const { t } = useTranslation()
  const { formatPrice } = useFormat()

  return (
    <section aria-labelledby="home-categories">
      <SectionHead
        id="home-categories"
        title={t('home.categories.title')}
        sub={t('home.categories.sub')}
        action={
          <Button asChild variant="link" className="h-auto self-start p-0 text-sm sm:self-auto">
            <Link to="/catalogue">
              {t('home.categories.all')}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        }
      />
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {categories
          ? categories.map((category) => {
              const Icon = categoryIcon(category.slug)
              const minPrice = minPrices.get(category.id)
              return (
                <li key={category.id} className="flex">
                  <Link
                    to={`/catalogue?category=${category.id}`}
                    className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-xl border bg-card p-4 transition-colors outline-none hover:border-primary focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="font-semibold break-words">{category.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {t('home.categories.items', { count: category.itemCount })}
                    </span>
                    {minPrice !== undefined && (
                      <span className="mt-2 text-[13px] leading-[18px] font-semibold text-primary dark:text-accent-foreground">
                        {t('home.categories.from', { price: formatPrice(minPrice) })}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })
          : Array.from({ length: POPULAR_COUNT }, (_, index) => (
              <li
                key={index}
                aria-hidden
                className="h-38 animate-pulse rounded-xl border bg-muted"
              />
            ))}
      </ul>
    </section>
  )
}

function Popular({
  items,
  isPending,
  slugById,
}: {
  items: ItemSummaryDto[] | undefined
  isPending: boolean
  slugById: Map<number, string>
}) {
  const { t } = useTranslation()
  if (!isPending && !items?.length) return null

  return (
    <section aria-labelledby="home-popular">
      <SectionHead
        id="home-popular"
        title={t('home.popular.title')}
        sub={t('home.popular.sub')}
        action={
          <Button asChild variant="outline" size="lg" className="self-start px-4 sm:self-auto">
            <Link to="/catalogue?sort=popularity">
              {t('home.popular.all')}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        }
      />
      <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {items
          ? items.map((item) => (
              <li key={item.id} className="flex flex-col *:flex-1">
                <ItemCard item={item} icon={categoryIcon(slugById.get(item.categoryId))} />
              </li>
            ))
          : Array.from({ length: 4 }, (_, index) => (
              <li key={index}>
                <ItemCardSkeleton />
              </li>
            ))}
      </ul>
    </section>
  )
}

function HowItWorks() {
  const { t } = useTranslation()
  const steps: { icon: LucideIcon; key: 'search' | 'book' | 'pickup' | 'return' }[] = [
    { icon: Search, key: 'search' },
    { icon: CalendarCheck, key: 'book' },
    { icon: Package, key: 'pickup' },
    { icon: Undo2, key: 'return' },
  ]

  return (
    <section id="how-it-works" aria-labelledby="home-steps" className="scroll-mt-28">
      <SectionHead id="home-steps" title={t('home.steps.title')} sub={t('home.steps.sub')} />
      <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map(({ icon: Icon, key }, index) => (
          <li key={key} className="flex flex-col gap-1 rounded-xl border bg-card p-5">
            <span className="mb-3 flex items-center justify-between text-muted-foreground">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <Icon className="size-5" aria-hidden />
            </span>
            <h3 className="font-semibold">{t(`home.steps.${key}.title`)}</h3>
            <p className="text-sm text-muted-foreground">{t(`home.steps.${key}.text`)}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Discounts({ item }: { item: ItemSummaryDto }) {
  const { t } = useTranslation()
  const { formatPrice } = useFormat()
  const pick = 7

  return (
    <section
      aria-labelledby="home-discounts"
      className="grid items-center gap-8 rounded-2xl bg-accent p-5 sm:p-8 lg:grid-cols-[4fr_7fr] lg:gap-10 lg:p-10"
    >
      <div className="flex flex-col items-start gap-4">
        <h2 id="home-discounts" className={sectionHeading}>
          {t('home.discounts.title')}
        </h2>
        <p className="text-foreground">{t('home.discounts.text')}</p>
        <Button asChild size="lg" className="h-11 px-5 text-base">
          <Link to="/catalogue">
            {t('home.discounts.cta')}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
      <ul className="grid gap-4 sm:grid-cols-3">
        {discountTiers.map(({ minDays, percent }) => {
          const full = item.dailyPrice * minDays
          const discounted = Math.round(full * (100 - percent)) / 100
          return (
            <li
              key={minDays}
              className={`flex flex-col items-start gap-2 rounded-xl bg-card p-5 ${
                minDays === pick ? 'border-2 border-primary' : 'border'
              }`}
            >
              <Badge tone="highlight">
                <Percent aria-hidden />−{percent}%
              </Badge>
              <p className="mt-2 text-3xl font-bold tracking-[-0.025em]">
                {t('home.discounts.days', { count: minDays })}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('home.discounts.example', { item: item.name, count: minDays })}
              </p>
              <p className="text-lg font-bold tabular-nums">
                <s className="text-sm font-normal text-muted-foreground">
                  <span className="sr-only">{t('home.discounts.was')} </span>
                  {formatPrice(full)}
                </s>{' '}
                <span className="sr-only">{t('home.discounts.now')} </span>
                {formatPrice(discounted)}
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function GoodToKnow({ lateFeeItem }: { lateFeeItem?: ItemSummaryDto }) {
  const { t } = useTranslation()
  const { formatPrice } = useFormat()
  const late = lateFeeItem
    ? t('home.faq.lateExample', {
        price: formatPrice(lateFeeItem.dailyPrice * LATE_FEE_RATE),
        item: lateFeeItem.name,
      })
    : ''
  const faq = [
    { q: t('home.faq.depositQ'), a: t('home.faq.depositA') },
    { q: t('home.faq.cancelQ'), a: t('home.faq.cancelA') },
    { q: t('home.faq.lateQ'), a: t('home.faq.lateA', { example: late }) },
    { q: t('home.faq.discountQ'), a: t('home.faq.discountA') },
    { q: t('home.faq.doubleQ'), a: t('home.faq.doubleA') },
  ]

  return (
    <section
      aria-labelledby="home-faq"
      className="grid items-start gap-5 lg:grid-cols-[4fr_7fr] lg:gap-10"
    >
      <div>
        <h2 id="home-faq" className={sectionHeading}>
          {t('home.faq.title')}
        </h2>
        <p className={sectionSub}>{t('home.faq.sub')}</p>
      </div>
      <div className="rounded-xl border bg-card px-4 sm:px-6">
        {faq.map(({ q, a }, index) => (
          <details key={q} open={index === 0} className="group border-b last:border-b-0">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md py-5 font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
              <span>{q}</span>
              <ChevronDown
                className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="max-w-155 pb-5 text-[15px] leading-6 text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
