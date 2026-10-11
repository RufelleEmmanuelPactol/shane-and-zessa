// Photos, paintings and music live in S3 and are served by Django at /media/<key>
// (it redirects to a short-lived signed link). Never put S3 URLs in front-end code.
export const asset = (key) => `/media/${key}`

// EDIT: the wedding details live here.
export const WEDDING = {
  start: '2026-11-29T15:00:00+08:00',
  end: '2026-11-29T23:00:00+08:00',
  dateShort: '29 · 11 · 26',
  dateLine: 'Sunday, at three in the afternoon',
  place: 'Sindangan, Zamboanga del Norte',
  replyBy: 'Sunday, November 1, 2026',
  day: [
    { time: '3:00 pm', title: 'Ceremony', where: 'Venue name, Street, City' },
    { time: '4:30 pm', title: 'Cocktails', where: 'In the garden' },
    { time: '6:00 pm', title: 'Dinner', where: 'Venue name, Street, City' },
    { time: '8:00 pm', title: 'Dancing', where: 'Until the candles burn down' },
  ],
  attire: 'Garden formal',
  palette: [
    { name: 'Burgundy', hex: '#621828' },
    { name: 'Maroon', hex: '#8b1e35' },
    { name: 'Chocolate', hex: '#4e2e24' },
    { name: 'Rose gold', hex: '#c48a78' },
    { name: 'Champagne', hex: '#e8d3b4' },
    { name: 'Cream', hex: '#f6eee3' },
  ],
}

// Where "Message Shane & Zessa" goes, for guests who can't find their name.
export const CONTACT_URL = 'https://www.instagram.com/regormortiz/'

// Background music. Leave empty to hide the music button.
export const MUSIC_URL = asset('audio/air-on-the-g-string.mp3')

// EDIT: the guest list. The name search runs on this list in the browser
// (replies themselves are saved by the backend). `seats` includes the guest themselves; sponsors are
// asked for their complete name (for the programme), everyone else isn't.
// `aka` holds other names a guest might type (nicknames, surnames).
export const GUESTS = [
  { name: 'Rhian', seats: 2 },
  { name: 'Sample Guest', seats: 1 },
  { name: 'Sample Sponsor', seats: 2, sponsor: true },
]
