import { useTranslation } from 'react-i18next'
import type { ItemSpecificationDto } from '@/api/generated/model'
import { cn } from '@/lib/utils'

/** "flightTime" → "Flight time", for a key the client has no label for yet. */
function humanize(key: string) {
  const words = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/**
 * The item's technical details (processor, memory, sensor, …) for the Specifications tab: a label
 * column and a value column, one row per detail, two rows side by side from 1024px. Labels come from
 * `item.specs.labels` by the API's camelCase key; values are shown as written.
 */
export function ItemSpecifications({ specifications }: { specifications: ItemSpecificationDto[] }) {
  const { t } = useTranslation()
  const labels: Record<string, string | undefined> = t('item.specs.labels', {
    returnObjects: true,
  })

  if (specifications.length === 0) return null

  return (
    <dl className="grid lg:grid-cols-2 lg:gap-x-12">
      {specifications.map((spec, index) => (
        <div
          key={spec.key}
          className={cn(
            'grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 border-t py-3.5 text-[15px] leading-6',
            // The first row of each column sits right under the tabs, without a rule.
            index === 0 && 'border-t-0 pt-0',
            index === 1 && 'lg:border-t-0 lg:pt-0',
          )}
        >
          <dt className="text-muted-foreground">{labels[spec.key] ?? humanize(spec.key)}</dt>
          <dd className="font-medium break-words">{spec.value}</dd>
        </div>
      ))}
    </dl>
  )
}
