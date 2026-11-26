import { CalendarCheck, Search } from 'lucide-react'
import { type FormEvent, type ReactNode, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { todayIso } from '@/pages/catalogue/catalogue-filters'

/**
 * The home hero's date-first search: what, pick-up day, return day and "Show available items".
 * It opens the catalogue with `q`, `from` and `to` set, where items taken on those days are marked.
 */
export function BookingSearch() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const today = todayIso()

  function submit(event: FormEvent) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const search = params.toString()
    void navigate(search ? `/catalogue?${search}` : '/catalogue')
  }

  return (
    <form
      role="search"
      aria-label={t('home.search.label')}
      onSubmit={submit}
      className="relative z-10 grid grid-cols-2 gap-0.5 rounded-2xl border border-band-accent-strong bg-band-raised p-2 text-band-foreground lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center lg:gap-0 lg:p-2.5"
    >
      <Segment
        className="col-span-2 lg:col-span-1"
        icon={<Search className="size-5" aria-hidden />}
        label={t('home.search.what')}
      >
        {(id) => (
          <input
            id={id}
            type="search"
            value={query}
            maxLength={100}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('home.search.whatPlaceholder')}
            className={inputClass}
          />
        )}
      </Segment>
      <Segment
        divider
        icon={<CalendarCheck className="size-5" aria-hidden />}
        label={t('catalogue.pickUp')}
      >
        {(id) => (
          <input
            id={id}
            type="date"
            min={today}
            value={from}
            onChange={(event) => {
              const next = event.target.value
              setFrom(next)
              // A return day before the new pick-up day no longer makes sense.
              if (next && to && to < next) setTo('')
            }}
            className={inputClass}
          />
        )}
      </Segment>
      <Segment
        divider
        icon={<CalendarCheck className="size-5" aria-hidden />}
        label={t('catalogue.return')}
      >
        {(id) => (
          <input
            id={id}
            type="date"
            min={from && from > today ? from : today}
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className={inputClass}
          />
        )}
      </Segment>
      <button
        type="submit"
        className="col-span-2 mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-band-accent px-6 text-base font-semibold text-band outline-none hover:bg-[color-mix(in_oklch,var(--band-accent),var(--band-foreground)_18%)] focus-visible:ring-3 focus-visible:ring-band-foreground lg:col-span-1 lg:mt-0 lg:ml-2 lg:h-13"
      >
        <Search className="size-5" aria-hidden />
        {t('home.search.submit')}
      </button>
    </form>
  )
}

const inputClass =
  'w-full min-w-0 bg-transparent p-0 text-[15px] leading-5 text-band-foreground outline-none placeholder:text-band-muted [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer'

/** One labelled part of the search bar; the whole segment is the label, so a click focuses the field. */
function Segment({
  icon,
  label,
  divider,
  className,
  children,
}: {
  icon: ReactNode
  label: string
  divider?: boolean
  className?: string
  children: (id: string) => ReactNode
}) {
  const id = useId()
  return (
    <label
      htmlFor={id}
      className={`relative flex min-w-0 cursor-text items-center gap-3 rounded-lg px-3 py-2 focus-within:bg-band-raised-2 focus-within:shadow-[inset_0_0_0_2px_var(--band-accent)] hover:bg-band-raised-2 sm:px-5 ${
        divider
          ? 'lg:before:absolute lg:before:top-3 lg:before:bottom-3 lg:before:-left-px lg:before:w-px lg:before:bg-band-line'
          : ''
      } ${className ?? ''}`}
    >
      <span className="shrink-0 text-band-foreground">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] leading-5 font-semibold">{label}</span>
        {children(id)}
      </span>
    </label>
  )
}
