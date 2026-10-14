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

// The venue cards. No crosses on the church.
export const VENUE_ICONS = {
  chapel: <Icon width={1.5}><path d="M3 21h18" /><path d="M5 21V11.5L12 5l7 6.5V21" /><path d="M10 21v-3.5a2 2 0 0 1 4 0V21" /><path d="M9.5 12.5a2.5 2.5 0 0 1 5 0" /></Icon>,
  sprig: <Icon width={1.5}><path d="M12 21V10.5" /><path d="M12 10.5c0-3.6 2.5-6.2 6.2-6.2 0 3.6-2.6 6.2-6.2 6.2z" /><path d="M12 14.5c0-3-2.1-5.1-5.2-5.1 0 3 2.1 5.1 5.2 5.1z" /><path d="M6.5 21h11" /></Icon>,
}
