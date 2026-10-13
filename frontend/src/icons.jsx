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

// The wedding day timeline. No crosses on the church, no dancing.
export const DAY_ICONS = {
  guestbook: <Icon width={1.5}><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" /><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3" /><path d="M9 7.5h6M9 10.5h4" /></Icon>,
  rose: <Icon width={1.5}><path d="M8 5.5c0 3 1.8 4.8 4 4.8s4-1.8 4-4.8" /><path d="M8 5.5c1.2-1.6 2.6-2.4 4-2.4s2.8.8 4 2.4" /><path d="M10.4 5.4c.5-.7 1-1 1.6-1s1.1.3 1.6 1c-.3 1.2-1 1.8-1.6 1.8s-1.3-.6-1.6-1.8z" /><path d="M12 10.3V21" /><path d="M12 16c-2.4 0-4-1.2-4.6-3.2 2.4-.2 4 1 4.6 3.2zM12 14c2.4 0 4-1.2 4.6-3.2-2.4-.2-4 1-4.6 3.2z" /></Icon>,
  camera: <Icon width={1.5}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7l1.5-2.5h5L16 7" /><circle cx="12" cy="13.5" r="3.5" /></Icon>,
  glasses: <Icon width={1.5}><g transform="rotate(-14 8 12)"><path d="M5.5 3h4l-.4 5.6a1.6 1.6 0 0 1-3.2 0z" /><path d="M7.5 10.2v8.3M5.5 18.5h4" /></g><g transform="rotate(14 16 12)"><path d="M14.5 3h4l-.4 5.6a1.6 1.6 0 0 1-3.2 0z" /><path d="M16.5 10.2v8.3M14.5 18.5h4" /></g><path d="M12 1.5v2M10.2 2.6l.8.9M13.8 2.6l-.8.9" /></Icon>,
  hearts: <Icon width={1.5}><path d="M9.5 19S3.5 15.3 3.5 10.6A3.4 3.4 0 0 1 9.5 8.4a3.4 3.4 0 0 1 6 2.2" /><path d="M15 21s-5-3.1-5-7a2.8 2.8 0 0 1 5-1.8 2.8 2.8 0 0 1 5 1.8c0 3.9-5 7-5 7z" /></Icon>,
  plate: <Icon width={1.5}><circle cx="12" cy="12" r="5.5" /><circle cx="12" cy="12" r="3" /><path d="M2.5 4v3.5a1.5 1.5 0 0 0 3 0V4M4 4v16" /><path d="M20.5 20V4c1.3 1.3 1.6 3.6 1.6 6.5h-1.6" /></Icon>,
  car: <Icon width={1.5}><path d="M2.5 16v-3.2a1 1 0 0 1 .7-1l1.6-.5 2-3.8a1 1 0 0 1 .9-.5h6.4a1 1 0 0 1 .8.4l2.6 3.6 3.1.6a1 1 0 0 1 .9 1V16" /><path d="M2.5 16h2.2M9.3 16h5.4M19.3 16h2.2" /><circle cx="7" cy="16.5" r="2.2" /><circle cx="17" cy="16.5" r="2.2" /><path d="M8 11.4l1.2-2.6h3.3v2.6zM14 8.8l1.8 2.6" /></Icon>,
  chapel: <Icon width={1.5}><path d="M3 21h18" /><path d="M5 21V11.5L12 5l7 6.5V21" /><path d="M10 21v-3.5a2 2 0 0 1 4 0V21" /><path d="M9.5 12.5a2.5 2.5 0 0 1 5 0" /></Icon>,
  sprig: <Icon width={1.5}><path d="M12 21V10.5" /><path d="M12 10.5c0-3.6 2.5-6.2 6.2-6.2 0 3.6-2.6 6.2-6.2 6.2z" /><path d="M12 14.5c0-3-2.1-5.1-5.2-5.1 0 3 2.1 5.1 5.2 5.1z" /><path d="M6.5 21h11" /></Icon>,
}
