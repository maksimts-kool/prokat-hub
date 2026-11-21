import { useTranslation } from 'react-i18next'
import type { ItemSpecificationDto } from '@/api/generated/model'
import { cn } from '@/lib/utils'

/** "flightTime" → "Flight time", for a key the client has no label for yet. */
function humanize(key: string) {
  const words = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/**
 * The item's technical details (processor, memory, sensor, …) as label–value rows, two columns from
 * 640px. Labels come from `item.specs.labels` by the API's camelCase key; values are shown as written.
 */
export function ItemSpecifications({ specifications }: { specifications: ItemSpecificationDto[] }) {
  const { t } = useTranslation()
  const labels: Record<string, string | undefined> = t('item.specs.labels', {
    returnObjects: true,
  })

  if (specifications.length === 0) return null

  return (
    <section aria-labelledby="specs-title">
      <h2 id="specs-title" className="text-lg leading-7 font-semibold">
        {t('item.specs.title')}
      </h2>
      {/* The 1px gaps over a `border` fill draw the lines between cells, all solid. */}
      <dl className="mt-4 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
        {specifications.map((spec, index) => (
          <div
            key={spec.key}
            className={cn(
              'flex flex-col gap-0.5 bg-card px-4 py-3',
              // An odd last cell spans both columns, so no empty cell shows the line colour.
              index === specifications.length - 1 && index % 2 === 0 && 'sm:col-span-2',
            )}
          >
            <dt className="text-xs text-muted-foreground">
              {labels[spec.key] ?? humanize(spec.key)}
            </dt>
            <dd className="text-sm font-medium">{spec.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
