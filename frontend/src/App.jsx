import { useEffect, useState } from 'react'
import Gate, { useGate } from './Gate.jsx'
import Music from './Music.jsx'
import Rsvp from './Rsvp.jsx'
import { addToCalendar } from './ics.js'
import { ArrowRight, CalendarIcon } from './icons.jsx'
import { MUSIC_URL, WEDDING } from './wedding.js'

const img = (name) => `${import.meta.env.BASE_URL}images/${name}`

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// Fades sections in as they scroll into view.
function useReveal(ready) {
  useEffect(() => {
    if (!ready) return
    const els = document.querySelectorAll('.reveal:not(.in)')
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in')
          io.unobserve(e.target)
        }
      }),
      { rootMargin: '0px 0px -8% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [ready])
}

function Cover() {
  return (
    <header className="cover">
      {/* The photo, the script and the cut-out couple share one stage, so the
          words sit behind the couple at the same spot on every screen size. */}
      <div className="cover-stage">
        <img className="cover-photo" src={img('guitar-wide.jpg')} width="1200" height="800" fetchPriority="high"
          alt="Shane playing guitar while Zessa, in a burgundy dress, leans on a branch and smiles at him" />
        <h1 className="cover-script">
          <span>Our</span>
          <span>wedding</span>
          <span>day</span>
        </h1>
        <img className="cover-photo cover-cutout" src={img('guitar-wide-cutout.webp')} width="1200" height="800" alt="" />
      </div>

      <p className="cover-names" aria-label="Shane and Zessa"><span>SHANE</span><span>ZESSA</span></p>

      <div className="cover-date">
        <p className="cover-date-line"><span /><time dateTime={WEDDING.start}>{WEDDING.dateShort}</time><span /></p>
        <p>{WEDDING.dateLine}</p>
      </div>

      <div className="cover-bar">
        <img src={img('wax-seal.webp')} width="320" height="320" alt="" />
        <a className="cover-open" href="#invitation">Open the invitation <ArrowRight /></a>
      </div>
    </header>
  )
}

// Cross-stitched sprig for the invitation panel.
function Stitch() {
  return (
    <svg className="stitch" viewBox="0 0 240 400" aria-hidden="true">
      <defs>
        <pattern id="xs" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M1 1l4 4M5 1l-4 4" stroke="#d9a593" strokeWidth="1.3" strokeLinecap="square" />
        </pattern>
        <mask id="sprig">
          <g fill="#fff" stroke="#fff">
            <path d="M150 400C140 320 150 230 120 130" fill="none" strokeWidth="7" />
            <path d="M140 270C170 220 200 190 214 150" fill="none" strokeWidth="5" />
            <path d="M128 190C100 160 70 150 52 120" fill="none" strokeWidth="5" />
            <ellipse cx="112" cy="250" rx="32" ry="13" transform="rotate(-40 112 250)" />
            <ellipse cx="176" cy="300" rx="30" ry="12" transform="rotate(35 176 300)" />
            <ellipse cx="96" cy="330" rx="30" ry="12" transform="rotate(-30 96 330)" />
            <ellipse cx="170" cy="210" rx="26" ry="11" transform="rotate(30 170 210)" />
            <g transform="translate(118 112)">
              {[0, 72, 144, 216, 288].map((r) => <ellipse key={r} cx="0" cy="-26" rx="12" ry="22" transform={`rotate(${r})`} />)}
            </g>
            <g transform="translate(216 140)">
              {[0, 72, 144, 216, 288].map((r) => <circle key={r} cx="0" cy="-14" r="10" transform={`rotate(${r})`} />)}
            </g>
            <g transform="translate(46 112)">
              {[0, 72, 144, 216, 288].map((r) => <circle key={r} cx="0" cy="-12" r="9" transform={`rotate(${r})`} />)}
            </g>
            <circle cx="200" cy="60" r="4" /><circle cx="30" cy="200" r="4" /><circle cx="220" cy="250" r="4" />
          </g>
          <g fill="#000"><circle cx="118" cy="112" r="9" /><circle cx="216" cy="140" r="6" /><circle cx="46" cy="112" r="5" /></g>
        </mask>
      </defs>
      <rect width="240" height="400" fill="url(#xs)" mask="url(#sprig)" opacity="0.9" />
    </svg>
  )
}

function Calendar({ iso }) {
  // Use the wedding's own calendar date, not the viewer's timezone.
  const [y, m, day] = iso.slice(0, 10).split('-').map(Number)
  const first = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7 // Monday-first
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]

  return (
    <div className="calendar" role="img" aria-label={`${MONTHS[m - 1]} ${y}, with the ${day}th circled`}>
      <p className="cal-head"><span>{MONTHS[m - 1]}</span><span className="cal-year">{y}</span></p>
      <div className="cal-grid" aria-hidden="true">
        {WEEKDAYS.map((w) => <span key={w} className="cal-wd">{w}</span>)}
        {cells.map((n, i) => (
          <span key={i} className={n === day ? 'cal-day is-day' : 'cal-day'}>
            {n === day && (
              <svg viewBox="0 0 60 50" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                <path d="M44 8C30 1 8 8 6 24s18 22 32 18 20-14 14-26C48 8 40 6 34 8" />
              </svg>
            )}
            <span>{n ?? ''}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function Countdown({ iso }) {
  const target = new Date(iso).getTime()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const left = Math.max(0, target - now)
  const parts = [
    ['days', Math.floor(left / 864e5)],
    ['hours', Math.floor(left / 36e5) % 24],
    ['minutes', Math.floor(left / 6e4) % 60],
    ['seconds', Math.floor(left / 1e3) % 60],
  ]
  return (
    <div className="countdown" role="timer" aria-live="off">
      {parts.map(([label, n]) => (
        <div key={label} className="cd-unit">
          <span className="cd-num">{String(n).padStart(2, '0')}</span>
          <span className="cd-label">{label}</span>
        </div>
      ))}
    </div>
  )
}

const WORDS = [
  ['just<br>us', { top: '7%', left: '38%' }],
  ['golden<br>hour', { top: '16%', left: '6%' }],
  ['long dinners', { top: '13%', right: '7%' }],
  ['happy tears', { top: '36%', left: '5%' }],
  ['your favorite<br>song', { top: '43%', right: '5%' }],
  ['candlelight', { top: '66%', left: '7%' }],
  ['forever<br>starts here', { top: '71%', right: '8%' }],
]

export default function App() {
  const gate = useGate()
  useReveal(!gate)

  if (gate) return <Gate kind={gate} />

  return (
    <>
      {MUSIC_URL && <Music src={MUSIC_URL} />}
      <Cover />

      <main>
        <section className="invite" id="invitation">
          <div className="invite-photo">
            <img src={img('picnic.jpg')} width="1400" height="933" loading="lazy"
              alt="Shane and Zessa lying head to head on a picnic quilt, laughing" />
          </div>
          <div className="invite-panel">
            <Stitch />
            <span className="rule" />
            <p className="label">AN INVITATION</p>
            <p className="lead">We would love for you to be there as we say our vows, share a long dinner by candlelight, and dance a little after.</p>
          </div>
        </section>

        <section className="when painted">
          <img className="painting" src={img('paint-lake-nemi.webp')} width="1400" height="1091" loading="lazy" alt="" />
          <div className="when-inner">
            <h2 className="title on-dark reveal">Save the date</h2>
            <div className="reveal"><Calendar iso={WEDDING.start} /></div>
            <button type="button" className="btn btn-cream reveal" onClick={addToCalendar}>
              <CalendarIcon /> Add to my calendar
            </button>
          </div>
        </section>

        <section className="day painted">
          <img className="painting" src={img('paint-mortefontaine.webp')} width="1400" height="1012" loading="lazy" alt="" />
          <div className="day-inner">
            <span className="rule" />
            <p className="label">ORDER OF THE DAY</p>
            <h2 className="title reveal">The day</h2>
            <ol className="timeline">
              {WEDDING.day.map(({ time, title, where }) => (
                <li key={title} className="reveal">
                  <span className="tl-time">{time}</span>
                  <span>
                    <span className="tl-title">{title}</span>
                    <span className="tl-where">{where}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="attire">
          <p className="label">DRESS CODE</p>
          <h2 className="title reveal">What to wear</h2>
          <p className="lead">{WEDDING.attire}</p>

          <div className="collage reveal" aria-hidden="true">
            <div className="collage-base">
              <img src={img('paint-poppies.webp')} width="1400" height="1067" loading="lazy" alt="" />
            </div>
            <div className="collage-print collage-giverny">
              <img src={img('paint-giverny.webp')} width="600" height="535" loading="lazy" alt="" />
            </div>
            <div className="collage-oval">
              <img src={img('paint-roses.webp')} width="800" height="654" loading="lazy" alt="" />
            </div>
            <div className="collage-print collage-bordighera">
              <img src={img('paint-bordighera.webp')} width="500" height="402" loading="lazy" alt="" />
            </div>
            <img className="collage-couple" src={img('couple-standing.webp')} width="806" height="1500" loading="lazy" alt="" />
          </div>

          <p className="label muted">OUR COLOURS</p>
          <ul className="swatches">
            {WEDDING.palette.map((c) => (
              <li key={c.name}><span style={{ background: c.hex }} />{c.name}</li>
            ))}
          </ul>
        </section>

        <section className="words" aria-label="Just us, golden hour, long dinners, happy tears, your favorite song, candlelight, forever starts here">
          <img src={img('portrait-field.jpg')} width="900" height="1200" loading="lazy"
            alt="Zessa and Shane holding hands in a field, both in white shirts and jeans" />
          {WORDS.map(([html, pos]) => (
            <span key={html} style={pos} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
          ))}
        </section>

        <section className="rsvp painted" id="rsvp">
          <img className="painting" src={img('paint-meadow.webp')} width="1400" height="1010" loading="lazy" alt="" />
          <div className="rsvp-inner">
            <div className="rsvp-head">
              <p className="label">KINDLY REPLY</p>
              <h2 className="title title-sm">Will you join us?</h2>
              <p className="lead">We would be so happy to have you with us. Kindly let us know whether you can come on or before {WEDDING.replyBy}.</p>
            </div>
            <Rsvp />
          </div>
        </section>
      </main>

      <footer className="finale">
        <div className="arch">
          <img src={img('paint-roses.webp')} width="800" height="654" loading="lazy" alt="Detail of Fantin-Latour’s painting Basket of Roses" />
        </div>
        <p className="title on-dark">See you soon</p>
        <Countdown iso={WEDDING.start} />
        <img className="seal-foot" src={img('wax-seal.webp')} width="320" height="320" alt="" loading="lazy" />
        <p className="lead">With love,<br />Shane &amp; Zessa</p>
      </footer>
    </>
  )
}
