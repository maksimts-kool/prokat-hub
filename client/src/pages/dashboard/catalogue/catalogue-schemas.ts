import type { TFunction } from 'i18next'
import { z } from 'zod'
import type { CategoryDto, ItemDetailsDto, ItemRequest } from '@/api/generated/model'
import i18n from '@/i18n'
import { formatPrice } from '@/i18n/format'

// The rules below repeat the server's validators so most mistakes show before a request is sent:
// CategoryRequestValidator, ItemRequestValidator (Validation/*.cs) and the column sizes behind them.

/** `CategoryRequest.SlugPattern`: lower-case letters and digits in groups split by single hyphens. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** `ItemRequestValidator.SpecificationKeyPattern`: a camelCase key the client translates. */
const SPEC_KEY_PATTERN = /^[a-z][a-zA-Z0-9]{0,39}$/

/** `ItemRequestValidator.MaxSpecifications`. */
export const MAX_SPECIFICATIONS = 20
/** `ItemRequestValidator.MaxImages`. */
export const MAX_IMAGES = 8

/** The slug the server makes from a name left without one: "Gaming consoles" → "gaming-consoles". */
export function toSlug(name: string): string {
  let slug = ''
  for (const c of name.trim().toLowerCase()) {
    if (/[a-z0-9]/.test(c)) slug += c
    else if (slug.length > 0 && !slug.endsWith('-')) slug += '-'
  }
  return slug.replace(/-+$/, '')
}

export function categorySchema(t: TFunction) {
  return (
    z
      .object({
        name: z
          .string()
          .trim()
          .min(1, t('admin.validation.required'))
          .min(2, t('admin.validation.min', { count: 2 }))
          .max(100, t('admin.validation.max', { count: 100 })),
        slug: z
          .string()
          .trim()
          .max(100, t('admin.validation.max', { count: 100 }))
          .refine(
            (value) => value === '' || SLUG_PATTERN.test(value),
            t('admin.categories.slugRule'),
          ),
        description: z
          .string()
          .trim()
          .max(500, t('admin.validation.max', { count: 500 })),
      })
      // CategoryService: with no slug given, one is made from the name, and "++" makes none.
      .refine((values) => values.slug !== '' || toSlug(values.name) !== '', {
        path: ['slug'],
        message: t('admin.categories.slugNeeded'),
      })
  )
}

export type CategoryFormInput = z.input<ReturnType<typeof categorySchema>>
export type CategoryFormOutput = z.output<ReturnType<typeof categorySchema>>

export function categoryDefaults(category?: CategoryDto): CategoryFormInput {
  return {
    name: category?.name ?? '',
    slug: category?.slug ?? '',
    description: category?.description ?? '',
  }
}

/**
 * A euro amount typed into a text box: a comma works as the decimal point (Estonian keyboards),
 * at most two decimals as the database keeps them, and between `min` and `max`.
 */
function money(t: TFunction, min: number, max: number) {
  const range = t('admin.validation.between', {
    min: formatPrice(min, i18n.resolvedLanguage),
    max: formatPrice(max, i18n.resolvedLanguage),
  })
  return z
    .string()
    .trim()
    .min(1, t('admin.validation.required'))
    .transform((value) => value.replace(',', '.'))
    .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), t('admin.validation.money'))
    .transform(Number)
    .pipe(z.number().min(min, range).max(max, range))
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function itemSchema(t: TFunction) {
  return z.object({
    categoryId: z.string().min(1, t('admin.items.chooseCategory')).transform(Number),
    name: z
      .string()
      .trim()
      .min(1, t('admin.validation.required'))
      .min(2, t('admin.validation.min', { count: 2 }))
      .max(150, t('admin.validation.max', { count: 150 })),
    brand: z
      .string()
      .trim()
      .min(1, t('admin.validation.required'))
      .max(80, t('admin.validation.max', { count: 80 })),
    description: z
      .string()
      .trim()
      .min(1, t('admin.validation.required'))
      .max(2000, t('admin.validation.max', { count: 2000 })),
    images: z
      .array(
        z.object({
          url: z
            .string()
            .trim()
            .min(1, t('admin.validation.required'))
            .max(500, t('admin.validation.max', { count: 500 }))
            .refine(isHttpUrl, t('admin.items.photoUrlRule')),
        }),
      )
      .max(MAX_IMAGES, t('admin.items.photosMax', { count: MAX_IMAGES })),
    dailyPrice: money(t, 0.01, 100_000),
    deposit: money(t, 0, 1_000_000),
    lateFeePerDay: money(t, 0, 100_000),
    specifications: z
      .array(
        z.object({
          key: z
            .string()
            .trim()
            .min(1, t('admin.validation.required'))
            .regex(SPEC_KEY_PATTERN, t('admin.items.specKeyRule')),
          value: z
            .string()
            .trim()
            .min(1, t('admin.validation.required'))
            .max(200, t('admin.validation.max', { count: 200 })),
        }),
      )
      .max(MAX_SPECIFICATIONS, t('admin.items.specsMax', { count: MAX_SPECIFICATIONS }))
      .superRefine((specs, ctx) => {
        // Each repeat is marked on its own key, so the admin sees which row to change.
        const seen = new Set<string>()
        specs.forEach((spec, index) => {
          if (seen.has(spec.key)) {
            ctx.addIssue({
              code: 'custom',
              path: [index, 'key'],
              message: t('admin.items.specKeyTaken'),
            })
          }
          seen.add(spec.key)
        })
      }),
  })
}

export type ItemFormInput = z.input<ReturnType<typeof itemSchema>>
export type ItemFormOutput = z.output<ReturnType<typeof itemSchema>>

export function itemDefaults(item?: ItemDetailsDto): ItemFormInput {
  return {
    categoryId: item ? String(item.categoryId) : '',
    name: item?.name ?? '',
    brand: item?.brand ?? '',
    description: item?.description ?? '',
    images: item?.imageUrls.map((url) => ({ url })) ?? [],
    dailyPrice: item ? item.dailyPrice.toFixed(2) : '',
    deposit: item ? item.deposit.toFixed(2) : '',
    lateFeePerDay: item ? item.lateFeePerDay.toFixed(2) : '',
    specifications: item?.specifications.map(({ key, value }) => ({ key, value })) ?? [],
  }
}

/** The request body for a valid form: the photo rows become the list of URLs, cover first. */
export function toItemRequest({ images, ...values }: ItemFormOutput): ItemRequest {
  return { ...values, imageUrls: images.map((image) => image.url) }
}
