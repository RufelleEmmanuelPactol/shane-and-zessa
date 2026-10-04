// Loose hand-drawn line doodles. All share the "wobble" filter defined in <DoodleDefs />.

const base = {
  viewBox: '0 0 64 64',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

const Svg = ({ className = '', children }) => (
  <svg {...base} className={`doodle ${className}`}>
    <g filter="url(#wobble)">{children}</g>
  </svg>
)

export function DoodleDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <filter id="wobble">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="3" />
        <feDisplacementMap in="SourceGraphic" scale="2.2" />
      </filter>
      <filter id="brush" x="-10%" y="-30%" width="120%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency="0.06 0.3" numOctaves="3" seed="8" />
        <feDisplacementMap in="SourceGraphic" scale="14" />
      </filter>
    </svg>
  )
}

export const Heart = (p) => (
  <Svg {...p}>
    <path d="M32 54C12 40 8 25 18 18c6-4 12-1 14 5 2-6 8-9 14-5 10 7 6 22-14 36z" />
    <path d="M24 22c-2 1-4 4-3 7" />
  </Svg>
)

export const Rings = (p) => (
  <Svg {...p}>
    <circle cx="25" cy="38" r="12" />
    <circle cx="39" cy="38" r="12" />
    <path d="M21 26l4-6 4 6M22 23h6" />
  </Svg>
)

export const Glasses = (p) => (
  <Svg {...p}>
    <path d="M12 14l10-3 3 16c0 4-4 6-7 4z" />
    <path d="M21 30l5 16M22 47l8-2" />
    <path d="M52 14l-10-3-3 16c0 4 4 6 7 4z" />
    <path d="M43 30l-5 16M42 47l-8-2" />
    <path d="M30 8l2-4M34 9l4-3M27 9l-3-3" />
  </Svg>
)

export const Cake = (p) => (
  <Svg {...p}>
    <path d="M14 50h36M17 50V36h30v14M22 36V26h20v10" />
    <path d="M17 41c3 3 6 3 8 0s6-3 8 0 6 3 8 0 5-3 6 0" />
    <path d="M32 26v-8" />
    <path d="M32 18c-2-2-2-5 0-8 2 3 2 6 0 8z" />
  </Svg>
)

export const Notes = (p) => (
  <Svg {...p}>
    <path d="M24 46V18l22-6v28" />
    <path d="M24 24l22-6" />
    <ellipse cx="19" cy="46" rx="5" ry="4" />
    <ellipse cx="41" cy="40" rx="5" ry="4" />
  </Svg>
)

export const Rose = (p) => (
  <Svg {...p}>
    <path d="M32 30c-3 0-4-3-2-5 3-2 7 0 6 4-1 5-9 6-11 1-2-6 4-11 10-9 7 2 7 11 2 15-5 3-12 2-15-3" />
    <path d="M32 38v22" />
    <path d="M32 50c-6 0-10-4-11-8 6 0 10 3 11 8zM32 46c5-1 8-4 9-8-5 1-8 4-9 8z" />
  </Svg>
)

export const Candles = (p) => (
  <Svg {...p}>
    <path d="M22 56V26h8v30M36 56V32h8v24M16 56h34" />
    <path d="M26 26v-5M40 32v-5" />
    <path d="M26 21c-2-2-2-4 0-7 2 3 2 5 0 7zM40 27c-2-2-2-4 0-7 2 3 2 5 0 7z" />
  </Svg>
)

export const Calla = (p) => (
  <Svg {...p}>
    <path d="M30 34c-8-4-12-14-8-24 6 2 12 8 12 16 0 4-2 7-4 8z" />
    <path d="M30 34c2-6 2-14-2-20" />
    <path d="M30 34c2 8 2 16 0 26M30 48c6-4 12-4 16-2-4 4-10 5-16 2z" />
  </Svg>
)

// Engraved-style flourish used as a divider.
export const Flourish = ({ className = '' }) => (
  <svg viewBox="0 0 240 24" className={`flourish ${className}`} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" aria-hidden="true">
    <path d="M6 12h70M164 12h70" />
    <path d="M76 12c10 0 14-8 22-8s10 8 4 8-4-5 0-5M164 12c-10 0-14-8-22-8s-10 8-4 8 4-5 0-5" />
    <path d="M76 12c10 0 14 8 22 8s10-8 4-8M164 12c-10 0-14 8-22 8s-10-8-4-8" />
    <path d="M120 5l6 7-6 7-6-7z" fill="currentColor" />
    <circle cx="108" cy="12" r="1.4" fill="currentColor" /><circle cx="132" cy="12" r="1.4" fill="currentColor" />
  </svg>
)

// Corner ornament for engraved frames; mirrored with CSS for the other corners.
export const Corner = ({ className = '' }) => (
  <svg viewBox="0 0 60 60" className={`corner ${className}`} fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" aria-hidden="true">
    <path d="M2 58V18C2 9 9 2 18 2h40" />
    <path d="M8 58V22c0-8 6-14 14-14h36" />
    <path d="M14 30c0-10 6-16 16-16-6 4-8 10-4 14s10 0 8-6" />
    <circle cx="8" cy="8" r="2.2" fill="currentColor" />
  </svg>
)

export function Frame({ className = '', children }) {
  return (
    <div className={`frame ${className}`}>
      <Corner className="c-tl" /><Corner className="c-tr" /><Corner className="c-bl" /><Corner className="c-br" />
      {children}
    </div>
  )
}
