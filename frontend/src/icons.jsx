// Line icons, drawn at 24×24 in the current text colour.
const Icon = ({ children, width = 1.6 }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)

export const ArrowRight = () => <Icon><path d="M5 12h14M13 6l6 6-6 6" /></Icon>
export const ChevronLeft = () => <Icon><path d="M15 6l-6 6 6 6" /></Icon>
export const CalendarIcon = () => <Icon><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></Icon>
export const MessageIcon = () => <Icon><path d="M4 5h16v11H9l-5 4z" /></Icon>
export const SearchIcon = () => <Icon><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></Icon>
export const PinIcon = () => <Icon><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.4" /></Icon>

// The S & Z monogram, in the current text colour (a mask over `.monogram`).
export const Monogram = ({ className = '' }) => <span className={`monogram ${className}`.trim()} aria-hidden="true" />

