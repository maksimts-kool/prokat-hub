import { areIntervalsOverlapping, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { type DateRange, DayPicker, labelDayButton, type Matcher } from 'react-day-picker'
import { enGB, et } from 'react-day-picker/locale'
import { useTranslation } from 'react-i18next'
import { buttonVariants } from '@/components/ui/button'
import { getLanguage } from '@/i18n/languages'
import { cn } from '@/lib/utils'

const locales = { en: enGB, et }

/** Diagonal stripes for booked days, drawn with solid colours only. */
const hatch = 'bg-[repeating-linear-gradient(135deg,var(--muted)_0_5px,var(--border)_5px_7px)]'

interface DateRangeCalendarProps {
  selected: DateRange | undefined
  onSelect: (range: DateRange | undefined) => void
  /** Days taken by other rentals: struck through and not selectable. */
  booked: DateRange[]
  /** First selectable day (today). */
  firstDay: Date
  /** Last selectable day. */
  lastDay: Date
  month: Date
  onMonthChange: (month: Date) => void
  /**
   * Called with the range the pointer (or keyboard focus) would make while only a pick-up day is
   * chosen, or undefined when there is none or it would cover a booked day.
   */
  onPreviewChange?: (range: { from: Date; to: Date } | undefined) => void
  className?: string
}

/**
 * The range a click on `day` would complete, given a chosen pick-up day: either direction works.
 * Undefined when it would cover a booked day, since such a click starts over instead.
 */
function previewRange(start: Date | undefined, day: Date | undefined, booked: DateRange[]) {
  if (!start || !day || isSameDay(start, day)) return undefined
  const range = day < start ? { from: day, to: start } : { from: start, to: day }
  const clashes = booked.some(
    (b) =>
      b.from &&
      b.to &&
      areIntervalsOverlapping(
        { start: range.from, end: range.to },
        { start: b.from, end: b.to },
        { inclusive: true },
      ),
  )
  return clashes ? undefined : range
}

/**
 * The month view for choosing rental dates (React DayPicker in range mode). Weeks start on Monday;
 * booked days are hatched, struck through and disabled; past days are dimmed; the chosen range is
 * `primary` at the ends and `accent` between. A range that would cover a booked day starts over.
 */
export function DateRangeCalendar({
  selected,
  onSelect,
  booked,
  firstDay,
  lastDay,
  month,
  onMonthChange,
  onPreviewChange,
  className,
}: DateRangeCalendarProps) {
  const { t, i18n } = useTranslation()
  // The day under the pointer or keyboard focus, for previewing the range before the second click.
  const [hovered, setHovered] = useState<Date>()
  const start = selected?.from && !selected.to ? selected.from : undefined
  const preview = previewRange(start, hovered, booked)

  function hover(day: Date | undefined, disabledDay = false) {
    const next = disabledDay ? undefined : day
    setHovered(next)
    onPreviewChange?.(previewRange(start, next, booked))
  }
  const locale = locales[getLanguage(i18n.resolvedLanguage).code]
  // The locale's own day label (e.g. "Täna, …, valitud"); a label may also be a plain string.
  const localeLabel = locale.labels?.labelDayButton
  const dayLabel = typeof localeLabel === 'function' ? localeLabel : labelDayButton
  const disabled: Matcher[] = [{ before: firstDay }, { after: lastDay }, ...booked]
  const navButton = cn(
    buttonVariants({ variant: 'outline', size: 'icon-sm' }),
    'disabled:pointer-events-none disabled:opacity-50',
  )

  return (
    <div
      className={cn('rounded-xl border bg-card p-4 text-card-foreground', className)}
      onMouseLeave={() => hover(undefined)}
    >
      <DayPicker
        mode="range"
        selected={selected}
        onSelect={(range) => {
          // The pointer still rests on the day just clicked; its preview is stale now.
          setHovered(undefined)
          onPreviewChange?.(undefined)
          onSelect(range)
        }}
        onDayMouseEnter={(day, modifiers) => hover(day, modifiers.disabled)}
        onDayFocus={(day, modifiers) => hover(day, modifiers.disabled)}
        resetOnSelect
        excludeDisabled
        disabled={disabled}
        modifiers={{
          booked,
          past: { before: firstDay },
          // A lone pick-up day is only `selected`, not `range_start`, so it gets its own modifier.
          pickup: start ?? false,
          // Days between the pick-up day and the hovered day, and the end the click would set.
          preview_middle: preview ? { after: preview.from, before: preview.to } : false,
          preview_edge: preview
            ? isSameDay(preview.from, start!)
              ? preview.to
              : preview.from
            : false,
        }}
        month={month}
        onMonthChange={onMonthChange}
        startMonth={firstDay}
        endMonth={lastDay}
        weekStartsOn={1}
        locale={locale}
        labels={{
          // Screen readers hear why a day cannot be picked, not only that it is dimmed.
          labelDayButton: (date, modifiers, options, dateLib) => {
            const label = dayLabel(date, modifiers, options, dateLib)
            return modifiers.booked ? t('item.calendar.bookedDay', { label }) : label
          },
        }}
        components={{
          Chevron: ({ orientation }) =>
            orientation === 'left' ? (
              <ChevronLeft className="size-4" aria-hidden />
            ) : (
              <ChevronRight className="size-4" aria-hidden />
            ),
        }}
        classNames={{
          root: 'w-full',
          months: 'relative',
          month: 'flex flex-col gap-3',
          nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
          button_previous: navButton,
          button_next: navButton,
          month_caption: 'flex h-7 items-center justify-center',
          caption_label: 'text-base font-semibold first-letter:uppercase',
          month_grid: 'w-full border-collapse',
          weekday: 'pb-1 text-xs font-normal text-muted-foreground',
          day: 'group/day p-px text-center',
          day_button:
            'h-10 w-full rounded-md text-sm tabular-nums outline-none enabled:cursor-pointer enabled:hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default',
          today: '[&>button]:inset-ring [&>button]:inset-ring-ring',
          disabled: '[&>button]:text-muted-foreground',
          range_middle:
            '[&>button]:rounded-none [&>button]:bg-accent [&>button]:text-accent-foreground [&>button]:enabled:hover:bg-accent',
          range_start:
            '[&>button]:bg-primary [&>button]:font-semibold [&>button]:text-primary-foreground [&>button]:inset-ring-0 [&>button]:enabled:hover:bg-primary',
          range_end:
            '[&>button]:bg-primary [&>button]:font-semibold [&>button]:text-primary-foreground [&>button]:inset-ring-0 [&>button]:enabled:hover:bg-primary',
          hidden: 'invisible',
          // Styled through the range and pickup modifiers instead.
          selected: '',
          focused: '',
        }}
        modifiersClassNames={{
          past: '[&>button]:opacity-55',
          pickup:
            '[&>button]:bg-primary [&>button]:font-semibold [&>button]:text-primary-foreground [&>button]:inset-ring-0 [&>button]:enabled:hover:bg-primary',
          preview_middle:
            '[&>button]:rounded-none [&>button]:bg-accent [&>button]:text-accent-foreground [&>button]:enabled:hover:bg-accent',
          preview_edge:
            '[&>button]:bg-accent [&>button]:font-semibold [&>button]:text-accent-foreground [&>button]:inset-ring-2 [&>button]:inset-ring-primary [&>button]:enabled:hover:bg-accent',
          // Spelled out rather than built from `hatch`, so Tailwind finds the class.
          booked:
            '[&>button]:line-through [&>button]:disabled:cursor-not-allowed [&>button]:bg-[repeating-linear-gradient(135deg,var(--muted)_0_5px,var(--border)_5px_7px)]',
        }}
      />

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm inset-ring inset-ring-input" aria-hidden />
          {t('item.calendar.available')}
        </li>
        <li className="flex items-center gap-1.5">
          <span className={cn('size-3 rounded-sm', hatch)} aria-hidden />
          {t('item.calendar.booked')}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-primary" aria-hidden />
          {t('item.calendar.selected')}
        </li>
      </ul>
    </div>
  )
}
