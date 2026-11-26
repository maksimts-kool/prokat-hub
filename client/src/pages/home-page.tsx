import {
  ArrowRight,
  CalendarCheck,
  ChevronDown,
  CircleCheck,
  Percent,
  RefreshCw,
  ShieldCheck,
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
import {
  StepScene,
  WhyScene,
  type StepKind,
  type WhyKind,
} from '@/components/illustrations/home-scenes'
import { RentalsIllustration } from '@/components/illustrations/rentals-illustration'
import { ItemCard, ItemCardSkeleton, itemGridClass } from '@/components/item-card'
import { Button } from '@/components/ui/button'
import { useFormat } from '@/i18n/format'
import { discountTiers } from '@/lib/discount-tiers'
import { todayIso } from '@/lib/rentals'
import { cn } from '@/lib/utils'
import { BookingSearch } from '@/pages/home/booking-search'

/**
 * Every item, most rented first. The API caps a page at 100 and the demo catalogue has 33 items,
 * so one request feeds the popular categories, the popular items and the starting prices.
 */
const ALL_ITEMS = { Sort: 'popularity', PageSize: 100 } as const
/** How many popular items the home page shows, and how many categories rank by popularity. */
const POPULAR_COUNT = 4
/** How many category tiles the home page shows: two rows of three. */
const CATEGORY_COUNT = 6
/** Late fee per day as a share of the daily price (`DemoCatalogue.LateFeeRate`). */
const LATE_FEE_RATE = 1.5

const sectionHeading =
  'text-2xl leading-8 font-bold tracking-[-0.02em] sm:text-[32px] sm:leading-10'
const sectionSub = 'mt-2 text-muted-foreground'
/** A full-bleed section with a tinted background. */
const tinted = 'full-bleed bg-secondary py-16 sm:py-20 dark:bg-muted/40'

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
  const popularItems = items?.slice(0, POPULAR_COUNT)
  // Categories in the order their most rented item appears; empty categories never show up.
  const popularCategoryIds = [...new Set(items?.map((item) => item.categoryId))].slice(
    0,
    POPULAR_COUNT,
  )
  const tierItem = popularItems?.[0]
  // Each category's most rented item with a photo, for its tile.
  const coverByCategory = new Map<number, string>()
  for (const item of items ?? []) {
    const [cover] = item.imageUrls
    if (cover && !coverByCategory.has(item.categoryId)) {
      coverByCategory.set(item.categoryId, cover)
    }
  }

  const shownCategories =
    items && categories.data
      ? [
          ...popularCategoryIds,
          ...categories.data
            .map((category) => category.id)
            .filter((id) => !popularCategoryIds.includes(id)),
        ]
          .map((id) => categories.data.find((category) => category.id === id))
          .filter(
            (category): category is CategoryDto => category !== undefined && category.itemCount > 0,
          )
          .slice(0, CATEGORY_COUNT)
      : undefined

  // Full-bleed sections alternate plain and tinted backgrounds, like a shop front.
  return (
    <>
      <Hero />
      <div className="flex flex-col gap-16 pt-10 sm:gap-20 sm:pt-14">
        <NextPickup />
        <Categories
          categories={shownCategories}
          minPrices={minPriceByCategory}
          cover={coverByCategory}
        />
      </div>
      <WhyUs />
      <Popular items={popularItems} isPending={allItems.isPending} slugById={slugById} />
      {tierItem && <Discounts item={tierItem} />}
      <HowItWorks />
      <GoodToKnow lateFeeItem={tierItem} />
    </>
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
      className="-mb-6 flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
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

/**
 * The full-width band that opens the site: headline, two actions and the date search. The
 * promises have their own section further down, so none repeat here.
 */
function Hero() {
  const { t } = useTranslation()

  return (
    <section
      aria-labelledby="home-title"
      className="full-bleed relative overflow-hidden bg-band text-band-foreground"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-32 size-[34rem] rounded-full bg-band-raised blur-3xl lg:size-[44rem]"
      />
      <div className="relative container-page flex flex-col gap-8 py-10 sm:py-14 lg:gap-10 lg:py-16">
        <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_260px] lg:grid-cols-[minmax(0,1fr)_440px] xl:grid-cols-[minmax(0,1fr)_520px]">
          <div className="relative z-10 flex flex-col items-start gap-5">
            <h1
              id="home-title"
              className="max-w-170 text-[36px] leading-[40px] font-extrabold tracking-[-0.03em] text-balance sm:text-[48px] sm:leading-[52px] xl:text-[60px] xl:leading-[64px]"
            >
              {t('home.title')}{' '}
              <em className="pr-[0.06em] text-band-accent">{t('home.titleAccent')}</em>
            </h1>
            <p className="max-w-130 text-band-muted sm:text-lg">{t('home.lead')}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-11 px-5 text-base">
                <Link to="/catalogue">
                  {t('home.browse')}
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-11 px-5 text-base text-foreground"
              >
                <a href="#how-it-works">{t('home.howItWorks')}</a>
              </Button>
            </div>
          </div>
          {/* From tablet width up, so the band never has an empty right half; full size from lg. */}
          <div className="relative hidden md:block">
            <HeroIllustration className="h-auto w-full overflow-visible" />
          </div>
        </div>

        <BookingSearch />
      </div>
    </section>
  )
}

/** A centred section title and subtitle, with an optional action on the right from sm up. */
function SectionHead({
  id,
  title,
  sub,
  action,
  center = false,
}: {
  id: string
  title: string
  sub: string
  action?: ReactNode
  center?: boolean
}) {
  return (
    <div
      className={
        center
          ? 'mb-10 flex flex-col items-center text-center'
          : 'mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'
      }
    >
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

/** "Rent by category": a tile per category with its top item's photo, item count and lowest price. */
function Categories({
  categories,
  minPrices,
  cover,
}: {
  categories: CategoryDto[] | undefined
  minPrices: Map<number, number>
  cover: Map<number, string>
}) {
  const { t } = useTranslation()

  return (
    <section aria-labelledby="home-categories">
      <SectionHead
        id="home-categories"
        center
        title={t('home.categories.title')}
        sub={t('home.categories.sub')}
      />
      <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {categories
          ? categories.map((category) => (
              <li key={category.id} className="flex">
                <CategoryTile
                  category={category}
                  icon={categoryIcon(category.slug)}
                  image={cover.get(category.id)}
                  minPrice={minPrices.get(category.id)}
                />
              </li>
            ))
          : Array.from({ length: CATEGORY_COUNT }, (_, index) => (
              <li
                key={index}
                aria-hidden
                className="aspect-4/5 animate-pulse rounded-2xl border bg-muted sm:aspect-auto sm:h-80"
              />
            ))}
      </ul>
      <div className="mt-8 flex justify-center">
        <Button asChild variant="outline" size="lg" className="h-11 px-5 text-base">
          <Link to="/catalogue">
            {t('home.categories.all')}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  )
}

/** One category tile: its top item's photo, name, lowest price and item count. */
function CategoryTile({
  category,
  icon: Icon,
  image,
  minPrice,
}: {
  category: CategoryDto
  icon: LucideIcon
  image: string | undefined
  minPrice: number | undefined
}) {
  const { t } = useTranslation()
  const { formatPrice } = useFormat()
  return (
    <Link
      to={`/catalogue?category=${category.id}`}
      className="group flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-card transition-shadow outline-none hover:shadow-lg hover:shadow-foreground/5 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="relative flex aspect-4/3 items-center justify-center overflow-hidden bg-muted text-muted-foreground sm:aspect-16/10">
        {image ? (
          <img src={image} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <Icon className="size-14" strokeWidth={1.25} aria-hidden />
        )}
      </span>
      <span className="flex flex-1 items-end justify-between gap-3 p-4 sm:p-5">
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-center gap-2 font-semibold break-words sm:text-lg">
            <Icon
              className="hidden size-4 shrink-0 text-primary sm:block dark:text-accent-foreground"
              aria-hidden
            />
            {category.name}
          </span>
          {minPrice !== undefined && (
            <span className="text-sm text-primary dark:text-accent-foreground">
              {t('home.categories.from', { price: formatPrice(minPrice) })}
            </span>
          )}
          <span className="mt-1 text-xs text-muted-foreground">
            {t('home.categories.items', { count: category.itemCount })}
          </span>
        </span>
        <span className="hidden size-9 shrink-0 items-center justify-center rounded-full border text-primary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground sm:flex dark:text-accent-foreground">
          <ArrowRight className="size-4" aria-hidden />
        </span>
      </span>
    </Link>
  )
}

/**
 * How each promise card is coloured: the card, its words, the round stage behind the scene and the
 * icon badge, whose ring matches the card so it looks cut out of the stage. Only theme colours.
 */
const whyTones = {
  band: {
    card: 'bg-band text-band-foreground',
    text: 'text-band-muted',
    stage: 'bg-band-raised-2',
    badge: 'bg-band-accent text-band ring-band',
  },
  primary: {
    card: 'bg-primary text-primary-foreground',
    text: 'text-primary-foreground/85',
    stage: 'bg-band',
    badge: 'bg-primary-foreground text-primary ring-primary',
  },
  highlight: {
    card: 'bg-highlight text-on-highlight',
    text: 'text-on-highlight/80',
    stage: 'bg-band',
    badge: 'bg-on-highlight text-highlight ring-highlight',
  },
  accent: {
    card: 'bg-accent text-foreground',
    text: 'text-muted-foreground',
    stage: 'bg-band',
    badge: 'bg-primary text-primary-foreground ring-accent',
  },
} as const

/**
 * Four reasons to rent here, each a promise the app keeps. The only place on the page that tells
 * them; discounts have their own band. A bento of coloured cards: wide and narrow ones swap sides
 * on the second row, each with a big round scene and its icon badge on the scene's edge.
 */
function WhyUs() {
  const { t } = useTranslation()
  const reasons: {
    icon: LucideIcon
    key: WhyKind
    tone: keyof typeof whyTones
    span: string
  }[] = [
    { icon: CircleCheck, key: 'live', tone: 'band', span: 'xl:col-span-3' },
    { icon: Zap, key: 'quote', tone: 'primary', span: 'xl:col-span-2' },
    { icon: ShieldCheck, key: 'cancel', tone: 'highlight', span: 'xl:col-span-2' },
    { icon: RefreshCw, key: 'deposit', tone: 'accent', span: 'xl:col-span-3' },
  ]

  return (
    <section aria-labelledby="home-why" className={`${tinted} mt-16 sm:mt-20`}>
      <div className="container-page">
        <SectionHead id="home-why" center title={t('home.why.title')} sub={t('home.why.sub')} />
        <ul className="grid gap-4 sm:gap-5 lg:grid-cols-2 xl:grid-cols-5">
          {reasons.map(({ icon: Icon, key, tone, span }) => {
            const colors = whyTones[tone]
            return (
              <li
                key={key}
                className={cn(
                  'flex flex-col-reverse items-start gap-6 overflow-hidden rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8',
                  colors.card,
                  span,
                )}
              >
                <div className="flex max-w-90 flex-col gap-2">
                  <h3 className="text-lg leading-7 font-semibold sm:text-xl">
                    {t(`home.why.${key}.title`)}
                  </h3>
                  <p className={colors.text}>{t(`home.why.${key}.text`)}</p>
                </div>
                <div className="relative shrink-0">
                  <div
                    className={cn('size-36 overflow-hidden rounded-full sm:size-44', colors.stage)}
                  >
                    <WhyScene kind={key} className="size-full" />
                  </div>
                  <span
                    className={cn(
                      'absolute bottom-1 -left-1 flex size-11 items-center justify-center rounded-xl ring-4',
                      colors.badge,
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
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
    <section aria-labelledby="home-popular" className="py-16 sm:py-20">
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
      <ul className={`${itemGridClass} md:grid-cols-3 lg:grid-cols-4`}>
        {items
          ? items.map((item) => (
              <li key={item.id}>
                <ItemCard item={item} icon={categoryIcon(slugById.get(item.categoryId))} />
              </li>
            ))
          : Array.from({ length: POPULAR_COUNT }, (_, index) => (
              <li key={index}>
                <ItemCardSkeleton />
              </li>
            ))}
      </ul>
    </section>
  )
}

/**
 * Each discount step, lowest first: how tall it stands and its colours. The steps climb from the
 * band's own purple through the brand purple to orange for the best one.
 */
const stepStyles = [
  { bar: 'h-[48%] bg-band-raised-2 text-band-foreground', days: 'text-band-muted' },
  { bar: 'h-[74%] bg-primary text-primary-foreground', days: 'text-primary-foreground/80' },
  { bar: 'h-full bg-highlight text-on-highlight', days: 'text-on-highlight/75' },
]

/**
 * The dark promo band: the longer-rental discounts on the left, drawn as steps that climb with the
 * rental length, and your rentals on the right in the brand purple.
 */
function Discounts({ item }: { item: ItemSummaryDto }) {
  const { t } = useTranslation()
  const { formatPrice } = useFormat()
  const { status } = useAuth()
  const top = discountTiers[discountTiers.length - 1].percent

  return (
    <section
      aria-labelledby="home-discounts"
      className="full-bleed bg-band py-14 text-band-foreground sm:py-20"
    >
      <div className="container-page grid gap-5 lg:grid-cols-[3fr_2fr]">
        <div className="relative grid gap-8 overflow-hidden rounded-2xl border border-band-line bg-band-raised p-6 sm:p-8 md:grid-cols-[minmax(0,1fr)_15rem] md:items-end lg:grid-cols-1 xl:grid-cols-[minmax(0,1fr)_16rem]">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-band-raised-2"
          />
          <div className="relative flex flex-col items-start gap-5">
            <p className="inline-flex items-center gap-2 rounded-full bg-band-raised-2 px-3 py-1 text-xs font-semibold text-band-muted">
              <Percent className="size-3.5 text-band-accent" aria-hidden />
              {t('home.discounts.eyebrow')}
            </p>
            <h2
              id="home-discounts"
              className="text-3xl leading-9 font-bold tracking-[-0.02em] sm:text-4xl sm:leading-11"
            >
              {t('home.discounts.title')}
              <span className="block text-highlight">
                {t('home.discounts.upTo', { percent: top })}
              </span>
            </h2>
            <p className="max-w-120 text-band-muted">{t('home.discounts.text')}</p>
            <Button asChild size="lg" className="mt-1 h-11 px-5 text-base">
              <Link to="/catalogue">
                {t('home.discounts.cta')}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
          <ul className="relative flex h-56 items-end gap-2.5 sm:h-64">
            {discountTiers.map(({ minDays, percent }, index) => {
              const full = item.dailyPrice * minDays
              const discounted = Math.round(full * (100 - percent)) / 100
              const style = stepStyles[index]
              return (
                <li
                  key={minDays}
                  className={cn(
                    'flex flex-1 flex-col items-center rounded-2xl px-2 pt-4 text-center',
                    style.bar,
                  )}
                >
                  <span className="text-2xl leading-8 font-extrabold tracking-[-0.02em] tabular-nums">
                    −{percent}%
                  </span>
                  <span className={cn('text-xs font-medium', style.days)}>
                    {t('home.discounts.days', { count: minDays })}
                  </span>
                  <span className="sr-only">
                    {t('home.discounts.example', { item: item.name, count: minDays })}:{' '}
                    {t('home.discounts.was')} {formatPrice(full)}, {t('home.discounts.now')}{' '}
                    {formatPrice(discounted)}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        <RentalsPromo signedIn={status === 'authenticated'} />
      </div>
    </section>
  )
}

/** The brand-purple card for My rentals, its picture on a dark inset so it keeps its contrast. */
function RentalsPromo({ signedIn }: { signedIn: boolean }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-start gap-2 overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground sm:p-8">
      <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary-foreground/80 uppercase">
        <CalendarCheck className="size-4" aria-hidden />
        {t('home.promo.rentals.eyebrow')}
      </p>
      <h3 className="text-xl leading-7 font-semibold sm:text-2xl sm:leading-8">
        {t('home.promo.rentals.title')}
      </h3>
      <p className="text-sm text-primary-foreground/85">{t('home.promo.rentals.text')}</p>
      <Link
        to={signedIn ? '/dashboard' : '/register'}
        className="mt-2 inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-primary-foreground"
      >
        {signedIn ? t('home.promo.rentals.ctaDashboard') : t('home.promo.rentals.ctaRegister')}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
      <div className="hidden w-full flex-1 items-center pt-6 lg:flex">
        <div className="w-full overflow-hidden rounded-xl bg-band">
          <RentalsIllustration className="block w-full" />
        </div>
      </div>
    </div>
  )
}

/** Four steps, each a card with a scene of that moment on top and its number on the scene. */
function HowItWorks() {
  const { t } = useTranslation()
  const steps: StepKind[] = ['search', 'book', 'pickup', 'return']

  return (
    <section id="how-it-works" aria-labelledby="home-steps" className="scroll-mt-28 pt-16 sm:pt-20">
      <SectionHead id="home-steps" center title={t('home.steps.title')} sub={t('home.steps.sub')} />
      <ol className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
        {steps.map((key, index) => (
          <li key={key} className="flex flex-col rounded-2xl border bg-card p-3">
            <div className="relative aspect-16/10 overflow-hidden rounded-xl bg-band">
              <StepScene kind={key} className="size-full" />
              <span className="absolute top-3 left-3 rounded-full bg-card px-2.5 py-1 text-xs font-bold text-foreground tabular-nums">
                0{index + 1}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 px-3 pt-5 pb-3">
              <h3 className="text-lg leading-7 font-semibold">{t(`home.steps.${key}.title`)}</h3>
              <p className="text-sm text-muted-foreground">{t(`home.steps.${key}.text`)}</p>
            </div>
          </li>
        ))}
      </ol>
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
    // Only what no other section answers: the promises are in WhyUs, the discounts in their band.
    { q: t('home.faq.accountQ'), a: t('home.faq.accountA') },
    { q: t('home.faq.cartQ'), a: t('home.faq.cartA') },
    { q: t('home.faq.lateQ'), a: t('home.faq.lateA', { example: late }) },
  ]

  return (
    <section
      aria-labelledby="home-faq"
      className="grid items-start gap-6 pt-16 sm:pt-20 lg:grid-cols-[4fr_7fr] lg:gap-10"
    >
      <div>
        <h2 id="home-faq" className={sectionHeading}>
          {t('home.faq.title')}
        </h2>
        <p className={sectionSub}>{t('home.faq.sub')}</p>
      </div>
      <div className="flex flex-col gap-3">
        {faq.map(({ q, a }, index) => (
          <details
            key={q}
            open={index === 0}
            className="group rounded-2xl border bg-card px-5 sm:px-6"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md py-5 font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
              <span>{q}</span>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-open:bg-primary group-open:text-primary-foreground">
                <ChevronDown
                  className="size-4 transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </span>
            </summary>
            <p className="max-w-155 pb-5 text-[15px] leading-6 text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
