import { useTranslation } from 'react-i18next'

/** Laptop screen bars, as share of the chart height; the last one is the light "today" bar. */
const bars = [0.34, 0.52, 0.42, 0.66, 0.5, 0.78]

/**
 * The home hero's band illustration: a camera, a drone and headphones on tiles around an open
 * laptop with a bar chart, and an orange "−20% for 7+ days" tag. Band colours plus `highlight` only.
 */
export function HeroIllustration({ className }: { className?: string }) {
  const { t } = useTranslation()

  return (
    <svg viewBox="0 0 600 430" aria-hidden className={className}>
      {/* Camera */}
      <g transform="translate(60 52) rotate(-8)">
        <rect width="200" height="168" rx="34" className="fill-band-raised" />
        <rect x="62" y="40" width="54" height="26" rx="8" className="fill-band-accent" />
        <rect x="34" y="56" width="134" height="88" rx="16" className="fill-band-accent" />
        <rect x="34" y="70" width="22" height="62" rx="8" className="fill-band-accent-strong" />
        <rect x="46" y="64" width="22" height="9" rx="3" className="fill-band-foreground" />
        <circle cx="108" cy="100" r="34" className="fill-band" />
        <circle cx="108" cy="100" r="26" className="fill-band-accent-strong" />
        <circle cx="108" cy="100" r="15" className="fill-band-raised-2" />
        <circle cx="114" cy="94" r="4" className="fill-band-foreground" />
      </g>

      {/* Drone */}
      <g transform="translate(392 14) rotate(10)">
        <rect width="196" height="160" rx="34" className="fill-band-raised" />
        <g transform="translate(98 84) scale(2.6)">
          <rect x="-24" y="-3" width="48" height="6" rx="3" className="fill-band-accent" />
          <ellipse cx="-22" cy="-10" rx="14" ry="2.5" className="fill-band-accent" />
          <ellipse cx="22" cy="-10" rx="14" ry="2.5" className="fill-band-accent" />
          <rect x="-24" y="-9" width="4" height="8" rx="2" className="fill-band-foreground" />
          <rect x="20" y="-9" width="4" height="8" rx="2" className="fill-band-foreground" />
          <rect x="-12" y="-6" width="24" height="12" rx="4" className="fill-band-foreground" />
          <circle cx="0" cy="9" r="4" className="fill-band-accent-strong" />
          <path
            d="M-8 6 C-12 11 -13 15 -14 19 M8 6 C12 11 13 15 14 19"
            className="fill-none stroke-band-foreground"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      </g>

      {/* Headphones */}
      <g transform="translate(440 196) rotate(-10)">
        <rect width="164" height="164" rx="34" className="fill-band-raised" />
        <path
          d="M42 96 A40 40 0 0 1 122 96"
          className="fill-none stroke-band-foreground"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <rect x="30" y="88" width="30" height="50" rx="13" className="fill-band-accent" />
        <rect x="104" y="88" width="30" height="50" rx="13" className="fill-band-accent" />
        <rect x="38" y="96" width="12" height="34" rx="6" className="fill-band-accent-strong" />
        <rect x="114" y="96" width="12" height="34" rx="6" className="fill-band-accent-strong" />
      </g>

      {/* Laptop with a bar chart */}
      <g transform="translate(180 176)">
        <rect width="290" height="186" rx="15" className="fill-band-accent" />
        <rect x="10" y="10" width="270" height="159" rx="6" className="fill-band-raised-2" />
        <circle cx="145" cy="5" r="2" className="fill-band-accent-strong" />
        <rect x="31.6" y="29.1" width="86.4" height="11.1" rx="5.6" className="fill-band-line" />
        <circle cx="253" cy="34.6" r="7.2" className="fill-band-accent-strong" />
        {bars.map((share, index) => {
          const height = 102.8 * share
          return (
            <rect
              key={index}
              x={31.6 + index * 37.8}
              y={146.7 - height}
              width="23.4"
              height={height}
              rx="7"
              className={index === bars.length - 1 ? 'fill-band-accent' : 'fill-band-accent-strong'}
            />
          )
        })}
        <rect x="-26.1" y="184" width="342.2" height="15" rx="7" className="fill-band-accent" />
        <rect x="116" y="184" width="58" height="5" rx="3" className="fill-band-accent-strong" />
        <rect
          x="-17.4"
          y="197"
          width="324.8"
          height="6"
          rx="3"
          className="fill-band-accent-strong"
        />
      </g>

      {/* Discount tag */}
      <g transform="translate(384 318) rotate(-8)">
        <rect width="196" height="76" rx="38" className="fill-highlight" />
        <g
          transform="translate(18 20) scale(1.5)"
          className="fill-none stroke-on-highlight"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
          <path d="m15 9-6 6" />
          <path d="M9 9h.01" />
          <path d="M15 15h.01" />
        </g>
        <text
          x="118"
          y="40"
          textAnchor="middle"
          className="fill-on-highlight text-[34px] font-extrabold tracking-[-0.02em]"
        >
          −20%
        </text>
        <text
          x="118"
          y="61"
          textAnchor="middle"
          className="fill-on-highlight text-[15px] font-semibold"
        >
          {t('home.heroTag')}
        </text>
      </g>
    </svg>
  )
}
