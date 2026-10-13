// Photos, paintings and music live in S3 and are served by Django at /media/<key>
// (it redirects to a short-lived signed link). Never put S3 URLs in front-end code.
export const asset = (key) => `/media/${key}`

// EDIT: the wedding details live here.
export const WEDDING = {
  // from seating to the send-off; the calendar invite and countdown use these
  start: '2026-11-29T13:30:00+08:00',
  end: '2026-11-29T21:30:00+08:00',
  dateShort: '29 · 11 · 26',
  dateLine: 'Sunday, at two in the afternoon',
  place: 'Sindangan, Zamboanga del Norte',
  // EDIT: the venues. The "Get directions" buttons open these in Google Maps,
  // and the calendar invite carries the ceremony's address. Paste a Google Maps share link
  // into `map` to drop guests on an exact pin; otherwise Maps searches for name + address.
  ceremony: {
    label: 'CHURCH CEREMONY · 2:00 PM',
    name: 'Sindangan Seventh-day Adventist Pioneer Church',
    address: 'Sta. Cruz, Sindangan, Zamboanga del Norte',
    map: 'https://www.google.com/maps/place/Seventh-Day+Adventist+Church+-+Sindangan/@8.2353024,122.9952136,17.23z/data=!4m10!1m2!2m1!1ssindangan+sda!3m6!1s0x325386a2d97d06d3:0xc99e1465870c28ad!8m2!3d8.2362179!4d122.9973609!15sCg1zaW5kYW5nYW4gc2RhkgEcc2V2ZW50aF9kYXlfYWR2ZW50aXN0X2NodXJjaOABAA!16s%2Fg%2F1tg9q6nq',
  },
  reception: { label: 'RECEPTION · 5:30 PM', name: 'Royal Garden', address: 'Sindangan, Zamboanga del Norte', map: '' },
  replyBy: 'November 15, 2026',
  // `icon` is a key of DAY_ICONS in icons.jsx; `main` marks the highlighted moment
  day: [
    { time: '1:30 PM', title: 'Guest arrival & registration', icon: 'guestbook' },
    { time: '2:00 PM', title: 'Church ceremony', icon: 'rose', main: true },
    { time: '4:00 PM', title: 'Photo session', icon: 'camera' },
    { time: '5:30 PM', title: 'Reception & guest arrival (pika-pika)', icon: 'glasses' },
    { time: '6:30 PM', title: 'Grand entrance of the newlyweds', icon: 'hearts' },
    { time: '7:00 PM', title: 'Dinner', icon: 'plate' },
    { time: '9:30 PM', title: 'Send-off', icon: 'car' },
  ],
  palette: [
    { name: 'Burgundy', hex: '#621828' },
    { name: 'Wine', hex: '#8b1e35' },
    { name: 'Champagne', hex: '#e8d3b4' },
    { name: 'Ivory', hex: '#f6eee3' },
  ],
}

// A Google Maps link for a venue; on phones it opens the Maps app.
export const mapUrl = ({ name, address, map }) =>
  map || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${address}`)}`

// Where "Message Shane & Zessa" goes, for guests who can't find their name.
export const CONTACT_URL = 'https://www.instagram.com/regormortiz/'

// Background music. Leave empty to hide the music button.
export const MUSIC_URL = asset('audio/kay-tagal-kitang-hinintay.mp3')

// The guest list is not here: it lives in the backend database (the repo is
// public). Import it with `manage.py import_guests` or Admin → Parties → Import.
