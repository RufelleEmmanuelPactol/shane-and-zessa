import { WEDDING, mapUrl } from './wedding.js'

// Escapes text for an .ics field.
const text = (s) => s.replace(/[\\;,]/g, (c) => `\\${c}`)

const stamp = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')

// Downloads a calendar file; phones offer to add it to their calendar app.
export function addToCalendar() {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Shane and Zessa//Wedding//EN',
    'BEGIN:VEVENT',
    'UID:shane-zessa-wedding-2026@invite',
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(WEDDING.start)}`,
    `DTEND:${stamp(WEDDING.end)}`,
    'SUMMARY:Shane & Zessa’s wedding',
    `LOCATION:${text(`${WEDDING.ceremony.name}, ${WEDDING.ceremony.address}`)}`,
    `DESCRIPTION:${text(`Reception: ${WEDDING.reception.name}, ${WEDDING.reception.address}`)}\\n${mapUrl(WEDDING.reception)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'shane-and-zessa.ics'
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
