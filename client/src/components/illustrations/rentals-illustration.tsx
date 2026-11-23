import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

function MiniDrone() {
  return (
    <>
      <rect x="-24" y="-3" width="48" height="6" rx="3" className="fill-band-accent" />
      <ellipse cx="-22" cy="-10" rx="14" ry="2.5" className="fill-band-accent" />
      <ellipse cx="22" cy="-10" rx="14" ry="2.5" className="fill-band-accent" />
      <rect x="-24" y="-9" width="4" height="8" rx="2" className="fill-band-foreground" />
      <rect x="20" y="-9" width="4" height="8" rx="2" className="fill-band-foreground" />
      <rect x="-12" y="-6" width="24" height="12" rx="4" className="fill-band-foreground" />
      <circle cx="0" cy="9" r="4" className="fill-band-accent-strong" />
      <path
        d="M-8 6 C-12 11 -13 15 -14 19 M8 6 C12 11 13 15 14 19"
        className="stroke-band-foreground"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </>
  )
}

function MiniHeadphones() {
  return (
    <>
      <path
        d="M-16 6 A16 16 0 0 1 16 6"
        className="stroke-band-foreground"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="-22" y="2" width="11" height="17" rx="4" className="fill-band-accent" />
      <rect x="11" y="2" width="11" height="17" rx="4" className="fill-band-accent" />
    </>
  )
}

interface RentalCardProps {
  x: number
  y: number
  icon: ReactNode
  label: string
  /** Fill of the status pill, and of its dot and word. Literal class names, so Tailwind finds them. */
  pill: string
  ink: string
}

function RentalCard({ x, y, icon, label, pill, ink }: RentalCardProps) {
  // Wide enough for the longer Estonian words (about 7.6px a character at 13px semibold).
  const pillWidth = Math.max(84, Math.round(label.length * 7.6 + 34))
  return (
    <g transform={`translate(${x} ${y}) rotate(-4)`}>
      <rect
        width="290"
        height="92"
        rx="18"
        strokeWidth="2"
        className="fill-band-raised stroke-band-line"
      />
      <rect x="14" y="14" width="64" height="64" rx="14" className="fill-band-raised-2" />
      <g transform="translate(46 44)">{icon}</g>
      <rect x="94" y="28" width="86" height="12" rx="6" className="fill-band-line" />
      <rect x="94" y="52" width="56" height="10" rx="5" className="fill-band-line" />
      <g transform={`translate(${276 - pillWidth} 31)`}>
        <rect width={pillWidth} height="30" rx="15" className={pill} />
        <circle cx="15" cy="15" r="3.5" className={ink} />
        <text
          x={pillWidth / 2 + 6}
          y="20"
          textAnchor="middle"
          className={`${ink} text-[13px] font-semibold`}
        >
          {label}
        </text>
      </g>
    </g>
  )
}

/** The dashboard's band illustration: a calendar with two rental cards, Issued and Overdue. Band colours only. */
export function RentalsIllustration({ className }: { className?: string }) {
  const { t } = useTranslation()

  return (
    <svg viewBox="0 0 560 320" aria-hidden className={className}>
      <circle cx="480" cy="420" r="310" className="fill-band-raised" />
      <path
        d="M86 62 L102 82 M122 40 L124 66 M58 96 L84 102"
        className="stroke-band-accent"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <g transform="translate(116 74) rotate(-6)">
        <rect width="230" height="222" rx="22" className="fill-band-raised-2" />
        <path
          d="M0 22 A22 22 0 0 1 22 0 L208 0 A22 22 0 0 1 230 22 L230 48 L0 48 Z"
          className="fill-band-accent-strong"
        />
        <rect x="50" y="-20" width="13" height="42" rx="6.5" className="fill-band-accent" />
        <rect x="167" y="-20" width="13" height="42" rx="6.5" className="fill-band-accent" />
        {[0, 1, 2].flatMap((row) =>
          [0, 1, 2, 3].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={22 + col * 49}
              y={68 + row * 48}
              width="38"
              height="34"
              rx="8"
              className={row === 1 && col === 2 ? 'fill-band-accent' : 'fill-band-raised'}
            />
          )),
        )}
      </g>
      <RentalCard
        x={262}
        y={100}
        icon={<MiniDrone />}
        label={t('rentalStatus.Issued')}
        pill="fill-highlight"
        ink="fill-on-highlight"
      />
      <RentalCard
        x={244}
        y={204}
        icon={<MiniHeadphones />}
        label={t('rentalStatus.Overdue')}
        pill="fill-destructive"
        ink="fill-destructive-foreground"
      />
    </svg>
  )
}
