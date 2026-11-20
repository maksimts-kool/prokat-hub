/** The catalogue page's band illustration: a drone over a camera and an open laptop. Band colours only. */
export function CatalogueIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 560 320" aria-hidden className={className}>
      <circle cx="410" cy="360" r="250" className="fill-band-raised" />
      <circle cx="90" cy="400" r="150" className="fill-band-raised" />
      <rect x="70" y="92" width="44" height="44" rx="12" className="fill-band-raised-2" />
      <rect x="494" y="34" width="40" height="40" rx="11" className="fill-band-raised-2" />
      <path
        d="M534 92 C536 106 542 112 556 114 C542 116 536 122 534 136 C532 122 526 116 512 114 C526 112 532 106 534 92Z"
        className="fill-band-accent"
      />
      <g transform="translate(330 72)">
        <rect x="-122" y="-6" width="244" height="12" rx="6" className="fill-band-accent-strong" />
        <rect x="-112" y="-36" width="4" height="16" rx="2" className="fill-band-accent-strong" />
        <rect x="108" y="-36" width="4" height="16" rx="2" className="fill-band-accent-strong" />
        <ellipse cx="-110" cy="-38" rx="54" ry="6" className="fill-band-accent" />
        <ellipse cx="110" cy="-38" rx="54" ry="6" className="fill-band-accent" />
        <rect x="-124" y="-22" width="28" height="36" rx="9" className="fill-band-accent" />
        <rect x="96" y="-22" width="28" height="36" rx="9" className="fill-band-accent" />
        <path
          d="M-30 16 C-44 30 -48 44 -50 58 M30 16 C44 30 48 44 50 58"
          className="stroke-band-accent"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
        <rect x="-48" y="-22" width="96" height="42" rx="15" className="fill-band-accent" />
        <rect x="-28" y="-14" width="56" height="12" rx="6" className="fill-band-accent-strong" />
        <rect x="-17" y="18" width="34" height="18" rx="7" className="fill-band-accent-strong" />
        <circle cx="0" cy="27" r="5" className="fill-band" />
      </g>
      <g transform="translate(318 150)">
        <rect x="0" y="0" width="200" height="128" rx="10" className="fill-band-accent" />
        <rect x="7" y="7" width="186" height="109" rx="4" className="fill-band-raised-2" />
        <circle cx="100" cy="3.5" r="1.5" className="fill-band-accent-strong" />
        <rect
          x="21.88"
          y="20.08"
          width="59.52"
          height="7.63"
          rx="3.82"
          className="fill-band-line"
        />
        <circle cx="174.4" cy="23.89" r="4.91" className="fill-band-accent-strong" />
        <rect
          x="21.88"
          y="79.25"
          width="16.14"
          height="21.49"
          rx="4.84"
          className="fill-band-accent-strong"
        />
        <rect
          x="47.92"
          y="67.87"
          width="16.14"
          height="32.87"
          rx="4.84"
          className="fill-band-accent-strong"
        />
        <rect
          x="73.96"
          y="74.19"
          width="16.14"
          height="26.55"
          rx="4.84"
          className="fill-band-accent-strong"
        />
        <rect
          x="100"
          y="59.01"
          width="16.14"
          height="41.73"
          rx="4.84"
          className="fill-band-accent-strong"
        />
        <rect
          x="126.04"
          y="69.13"
          width="16.14"
          height="31.61"
          rx="4.84"
          className="fill-band-accent-strong"
        />
        <rect
          x="152.08"
          y="51.43"
          width="16.14"
          height="49.31"
          rx="4.84"
          className="fill-band-accent"
        />
        <rect x="-18" y="126" width="236" height="10" rx="5" className="fill-band-accent" />
        <rect x="80" y="126" width="40" height="4" rx="2" className="fill-band-accent-strong" />
        <rect x="-12" y="134" width="224" height="4" rx="2" className="fill-band-accent-strong" />
      </g>
      <g transform="translate(96 150)">
        <rect x="44" y="0" width="84" height="38" rx="11" className="fill-band-accent" />
        <rect x="0" y="22" width="196" height="132" rx="20" className="fill-band-accent" />
        <rect x="0" y="40" width="26" height="96" rx="10" className="fill-band-accent-strong" />
        <circle cx="104" cy="90" r="52" className="fill-band" />
        <circle cx="104" cy="90" r="41" className="fill-band-accent-strong" />
        <circle cx="104" cy="90" r="26" className="fill-band-raised" />
        <circle cx="114" cy="80" r="7" className="fill-band-accent" />
        <rect x="152" y="36" width="26" height="12" rx="4" className="fill-band" />
      </g>
    </svg>
  )
}
