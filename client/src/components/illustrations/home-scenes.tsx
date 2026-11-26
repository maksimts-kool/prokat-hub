/**
 * Small flat scenes for the home page's promise cards and steps, drawn in the band colours plus
 * `highlight`, like the hero. They sit on a `bg-band` shape the caller provides.
 */

export type WhyKind = 'live' | 'quote' | 'cancel' | 'deposit'
export type StepKind = 'search' | 'book' | 'pickup' | 'return'

/** A square scene for a promise card, meant to be clipped to a circle. */
export function WhyScene({ kind, className }: { kind: WhyKind; className?: string }) {
  return (
    <svg viewBox="0 0 200 200" aria-hidden className={className}>
      <circle cx="160" cy="36" r="56" className="fill-band-raised" />
      {kind === 'live' && <LiveCalendar />}
      {kind === 'quote' && <Receipt />}
      {kind === 'cancel' && <CancelTicket />}
      {kind === 'deposit' && <DepositCoins />}
    </svg>
  )
}

/** A 16:10 scene for a step card. */
export function StepScene({ kind, className }: { kind: StepKind; className?: string }) {
  return (
    <svg viewBox="0 0 320 200" aria-hidden className={className}>
      <circle cx="292" cy="16" r="72" className="fill-band-raised" />
      <circle cx="16" cy="196" r="48" className="fill-band-raised" />
      {kind === 'search' && <SearchBar />}
      {kind === 'book' && <QuoteCard />}
      {kind === 'pickup' && <Desk />}
      {kind === 'return' && <ReturnBox />}
    </svg>
  )
}

/** A month with a booked range and today marked, and a "live" dot. */
function LiveCalendar() {
  const cells = Array.from({ length: 15 }, (_, index) => index)
  return (
    <>
      <g transform="translate(36 50) rotate(-6)">
        <rect width="124" height="112" rx="16" className="fill-band-raised-2" />
        <path
          d="M0 16a16 16 0 0 1 16-16h92a16 16 0 0 1 16 16v12H0Z"
          className="fill-band-accent-strong"
        />
        <rect x="30" y="-7" width="8" height="18" rx="4" className="fill-band-foreground" />
        <rect x="86" y="-7" width="8" height="18" rx="4" className="fill-band-foreground" />
        {cells.map((index) => (
          <rect
            key={index}
            x={10 + (index % 5) * 22}
            y={40 + Math.floor(index / 5) * 22}
            width="16"
            height="14"
            rx="4"
            className="fill-band-line"
          />
        ))}
        {/* Your booked days, joined into one bar */}
        <rect x="32" y="62" width="60" height="14" rx="7" className="fill-band-accent" />
        <rect x="76" y="84" width="16" height="14" rx="4" className="fill-highlight" />
      </g>
      <circle cx="156" cy="58" r="13" className="fill-highlight/40" />
      <circle cx="156" cy="58" r="8" className="fill-highlight" />
    </>
  )
}

/** A receipt with its lines and total, and a coin beside it. */
function Receipt() {
  return (
    <>
      <g transform="translate(52 30) rotate(5)">
        <path
          d="M0 12A12 12 0 0 1 12 0h68a12 12 0 0 1 12 12v112l-11.5-8-11.5 8-11.5-8-11.5 8-11.5-8-11.5 8-11.5-8L0 124Z"
          className="fill-band-foreground"
        />
        <rect x="14" y="18" width="40" height="9" rx="4.5" className="fill-band-accent-strong" />
        {[42, 56, 70].map((y) => (
          <g key={y}>
            <rect x="14" y={y} width="38" height="6" rx="3" className="fill-band-muted" />
            <rect x="62" y={y} width="16" height="6" rx="3" className="fill-band-muted" />
          </g>
        ))}
        <rect x="14" y="86" width="64" height="2" rx="1" className="fill-band-accent" />
        <rect x="14" y="96" width="30" height="10" rx="5" className="fill-band-accent-strong" />
        <rect x="50" y="96" width="28" height="10" rx="5" className="fill-band-accent-strong" />
      </g>
      <g transform="translate(150 146)">
        <circle r="26" className="fill-highlight" />
        <circle r="19" className="fill-none stroke-on-highlight/25" strokeWidth="2" />
        <text y="9" textAnchor="middle" className="fill-on-highlight text-[26px] font-extrabold">
          €
        </text>
      </g>
    </>
  )
}

/** A booking ticket crossed out, with a shield in front of it. */
function CancelTicket() {
  return (
    <>
      <g transform="translate(30 50) rotate(-8)">
        <path
          d="M14 0h96a14 14 0 0 1 14 14v22a10 10 0 0 0 0 20v22a14 14 0 0 1-14 14H14A14 14 0 0 1 0 78V56a10 10 0 0 0 0-20V14A14 14 0 0 1 14 0Z"
          className="fill-band-raised-2"
        />
        <rect x="18" y="18" width="52" height="9" rx="4.5" className="fill-band-accent" />
        <rect x="18" y="36" width="34" height="16" rx="8" className="fill-band-line" />
        <rect x="58" y="36" width="34" height="16" rx="8" className="fill-band-line" />
        <rect x="18" y="62" width="60" height="6" rx="3" className="fill-band-line" />
        <g transform="translate(112 6)">
          <circle r="14" className="fill-highlight" />
          <path
            d="M-5-5 5 5M5-5-5 5"
            className="fill-none stroke-on-highlight"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </g>
      </g>
      <g transform="translate(100 92)">
        <path
          d="M34 0 68 13v28c0 21-15 34-34 41C15 75 0 62 0 41V13Z"
          className="fill-band-accent"
        />
        <path
          d="m19 40 10 10 20-21"
          className="fill-none stroke-band"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </>
  )
}

/** Two coins inside the round "comes back" arrows. */
function DepositCoins() {
  return (
    <>
      <g
        transform="translate(22 22) scale(6.5)"
        className="fill-none stroke-band-accent-strong"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M8 16H3v5" />
      </g>
      <circle cx="114" cy="90" r="30" className="fill-band-accent" />
      <circle cx="114" cy="90" r="22" className="fill-none stroke-band/20" strokeWidth="2" />
      <g transform="translate(92 112)">
        <circle r="30" className="fill-highlight" />
        <circle r="22" className="fill-none stroke-on-highlight/25" strokeWidth="2" />
        <text y="10" textAnchor="middle" className="fill-on-highlight text-[28px] font-extrabold">
          €
        </text>
      </g>
    </>
  )
}

/** The search box: a query field, two dates and the button. */
function SearchBar() {
  return (
    <>
      <rect x="44" y="40" width="232" height="40" rx="20" className="fill-band-foreground" />
      <circle
        cx="68"
        cy="58"
        r="8"
        className="fill-none stroke-band-accent-strong"
        strokeWidth="4"
      />
      <path
        d="m74 64 6 6"
        className="stroke-band-accent-strong"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect x="90" y="56" width="96" height="8" rx="4" className="fill-band-muted" />
      {[44, 164].map((x) => (
        <g key={x} transform={`translate(${x} 92)`}>
          <rect width="112" height="38" rx="14" className="fill-band-raised-2" />
          <rect x="12" y="11" width="16" height="16" rx="4" className="fill-band-accent" />
          <rect x="36" y="16" width="60" height="6" rx="3" className="fill-band-line" />
        </g>
      ))}
      <rect x="44" y="142" width="232" height="30" rx="15" className="fill-band-accent-strong" />
      <rect x="128" y="154" width="64" height="6" rx="3" className="fill-band-foreground" />
    </>
  )
}

/** The quote with its total and the confirm button, a pointer on it. */
function QuoteCard() {
  return (
    <>
      <rect x="70" y="24" width="180" height="152" rx="16" className="fill-band-raised-2" />
      <rect x="88" y="42" width="80" height="10" rx="5" className="fill-band-foreground" />
      {[66, 82].map((y) => (
        <g key={y}>
          <rect x="88" y={y} width="72" height="7" rx="3.5" className="fill-band-line" />
          <rect x="200" y={y} width="32" height="7" rx="3.5" className="fill-band-line" />
        </g>
      ))}
      <rect x="88" y="100" width="144" height="2" rx="1" className="fill-band-line" />
      <rect x="88" y="112" width="50" height="10" rx="5" className="fill-band-accent" />
      <rect x="192" y="112" width="40" height="10" rx="5" className="fill-band-accent" />
      <rect x="88" y="134" width="144" height="26" rx="13" className="fill-band-accent-strong" />
      <path
        d="m150 147 7 7 13-14"
        className="fill-none stroke-band-foreground"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0 0v24l6.5-6.5 4.5 9.5 4.5-2-4.5-9.5H20Z"
        transform="translate(206 146)"
        className="fill-band-foreground stroke-band"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </>
  )
}

/** A parcel waiting on the rental desk. */
function Desk() {
  return (
    <>
      <g transform="translate(118 66) rotate(-4)">
        <rect width="88" height="66" rx="8" className="fill-highlight" />
        <rect x="38" width="12" height="66" className="fill-on-highlight/15" />
        <rect y="18" width="88" height="3" className="fill-on-highlight/15" />
        <rect x="10" y="38" width="22" height="16" rx="3" className="fill-band-foreground" />
      </g>
      <rect x="20" y="132" width="280" height="16" rx="8" className="fill-band-accent" />
      <rect x="40" y="148" width="240" height="60" rx="4" className="fill-band-raised-2" />
      <rect x="64" y="166" width="60" height="8" rx="4" className="fill-band-line" />
      <circle cx="240" cy="66" r="18" className="fill-band-accent-strong" />
      <path
        d="m231 66 6 6 11-12"
        className="fill-none stroke-band-foreground"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  )
}

/** The parcel going back, and the last day ticked off. */
function ReturnBox() {
  return (
    <>
      <g transform="translate(40 92) rotate(4)">
        <rect width="88" height="66" rx="8" className="fill-highlight" />
        <rect x="38" width="12" height="66" className="fill-on-highlight/15" />
        <rect y="18" width="88" height="3" className="fill-on-highlight/15" />
      </g>
      <path
        d="M92 84C104 40 168 30 186 58"
        className="fill-none stroke-band-foreground"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="2 11"
      />
      <path
        d="M175.3 52.2 186 58l1.8-12.1"
        className="fill-none stroke-band-foreground"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g transform="translate(192 62)">
        <rect width="96" height="96" rx="16" className="fill-band-raised-2" />
        <path
          d="M0 16A16 16 0 0 1 16 0h64a16 16 0 0 1 16 16v8H0Z"
          className="fill-band-accent-strong"
        />
        <circle cx="48" cy="60" r="24" className="fill-band-accent" />
        <path
          d="m37 60 8 8 15-16"
          className="fill-none stroke-band"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </>
  )
}
