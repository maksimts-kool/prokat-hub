/**
 * Longer-rental discounts: the best tier the rental length reaches applies to the whole rental.
 * These mirror the tiers the API seeds (`DemoCatalogue.DiscountTiers`). The API has no endpoint
 * for them, so they are only used to explain the discount; every price shown comes from the quote.
 */
export const discountTiers = [
  { minDays: 3, percent: 10 },
  { minDays: 7, percent: 20 },
  { minDays: 14, percent: 30 },
] as const

export interface DiscountRow {
  minDays: number
  /** Last day count of the row, or undefined for the open-ended top tier. */
  maxDays: number | undefined
  percent: number
}

/** The tiers as table rows, starting with full price: 1–2, 3–6, 7–13 and 14+ days. */
export const discountRows: DiscountRow[] = [{ minDays: 1, percent: 0 }, ...discountTiers].map(
  (tier, index, tiers) => ({
    minDays: tier.minDays,
    maxDays: tiers[index + 1] ? tiers[index + 1].minDays - 1 : undefined,
    percent: tier.percent,
  }),
)

/** Whether a rental of `days` days falls in the row. */
export function rowIncludes(row: DiscountRow, days: number): boolean {
  return days >= row.minDays && (row.maxDays === undefined || days <= row.maxDays)
}

/** The discount a rental of `days` days gets, as a percent (0 below the first tier). */
export function discountFor(days: number): number {
  return discountRows.find((row) => rowIncludes(row, days))?.percent ?? 0
}
