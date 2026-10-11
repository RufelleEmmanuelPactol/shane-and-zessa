import { useEffect, useRef, useState } from 'react'
import Gate, { useGate } from './Gate.jsx'
import Music from './Music.jsx'
import Rsvp from './Rsvp.jsx'
import { addToCalendar } from './ics.js'
import { ArrowRight, CalendarIcon } from './icons.jsx'
import { asset, MUSIC_URL, WEDDING } from './wedding.js'


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

// The burgundy envelope the cover folds into: laid paper, a Morris "Honeysuckle"
// (1876) liner on the inside of the flap, gold rules and fold shading. Drawn in
// one 100-wide unit box per piece and stretched to the screen.
const FLAP = 'M0 0H100C100 7 72 34 57 69Q50 82 43 69C28 34 0 7 0 0Z'

function EnvelopeFront() {
  return (
    <>
      <svg className="env-defs" aria-hidden="true">
        <defs>
          <pattern id="env-paper" patternUnits="userSpaceOnUse" width="100" height="100">
            <image href={asset('web/paper-burgundy.webp')} width="100" height="100" preserveAspectRatio="none" />
          </pattern>
          <pattern id="env-liner" patternUnits="userSpaceOnUse" width="56" height="37">
            <image href={asset('web/liner-honeysuckle.webp')} width="56" height="37" preserveAspectRatio="none" />
          </pattern>
          <linearGradient id="env-shade-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity="0.35" />
            <stop offset="0.5" stopColor="#000" stopOpacity="0.15" />
            <stop offset="1" stopColor="#000" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="env-shade-side" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0.07" />
            <stop offset="0.5" stopColor="#000" stopOpacity="0.12" />
            <stop offset="1" stopColor="#000" stopOpacity="0.28" />
          </linearGradient>
          <linearGradient id="env-shade-bottom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.1" />
            <stop offset="1" stopColor="#000" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="env-shade-flap" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity="0.25" />
            <stop offset="0.6" stopColor="#fff" stopOpacity="0.04" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>

      <svg className="env-pocket" viewBox="0 0 100 131" preserveAspectRatio="none" aria-hidden="true">
        {/* side flaps meet in the middle; the bottom flap folds up over them */}
        <path d="M0 0L50 73L100 0V131H0Z" fill="url(#env-paper)" />
        <path d="M0 0L50 73L0 131Z" fill="url(#env-shade-side)" />
        <path d="M100 0L50 73L100 131Z" fill="url(#env-shade-side)" transform="matrix(-1 0 0 1 100 0)" />
        <path d="M0 131L44 86Q50 80 56 86L100 131Z" fill="url(#env-paper)" />
        <path d="M0 131L44 86Q50 80 56 86L100 131Z" fill="url(#env-shade-bottom)" />
        <path d="M0 131L44 86Q50 80 56 86L100 131" fill="none" stroke="#2a0810" strokeOpacity="0.45" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
        <path d="M1.5 0L50 71L98.5 0" fill="none" stroke="#c9a35a" strokeOpacity="0.85" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>

      <div className="env-flap" aria-hidden="true">
        <div className="env-face env-flap-out"><svg viewBox="0 0 100 83" preserveAspectRatio="none">
          <path d={FLAP} fill="url(#env-paper)" />
          <path d={FLAP} fill="url(#env-shade-flap)" />
          <path d={FLAP} fill="none" stroke="#c9a35a" strokeWidth="1.2" vectorEffect="non-scaling-stroke" transform="translate(50 2) scale(0.9) translate(-50 0)" />
          <path d={FLAP} fill="none" stroke="#c9a35a" strokeOpacity="0.6" strokeWidth="0.6" vectorEffect="non-scaling-stroke" transform="translate(50 3.5) scale(0.86) translate(-50 0)" />
        </svg></div>
        <div className="env-face env-flap-in"><svg viewBox="0 0 100 83" preserveAspectRatio="none">
          <path d={FLAP} fill="url(#env-paper)" />
          <path d={FLAP} fill="url(#env-liner)" transform="translate(50 3) scale(0.92) translate(-50 0)" />
          <path d={FLAP} fill="none" stroke="#c9a35a" strokeWidth="1" vectorEffect="non-scaling-stroke" transform="translate(50 3) scale(0.92) translate(-50 0)" />
        </svg></div>
      </div>
    </>
  )
}

// How long the cover takes to fold into its envelope and fly off; matches the
// .cover.is-leaving timeline in index.css.
const COVER_EXIT_MS = 3450

function Cover({ onOpen }) {
  // play the entrance once the photo is ready, so it never animates over a blank
  const photo = useRef(null)
  const [ready, setReady] = useState(false)
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    if (photo.current?.complete) setReady(true)
  }, [])

  function open() {
    if (leaving) return
    setLeaving(true)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setTimeout(onOpen, reduced ? 0 : COVER_EXIT_MS)
  }

  return (
    <header className={`cover${ready ? ' is-in' : ''}${leaving ? ' is-leaving' : ''}`}>
      {/* On "Open the invitation" the card shrinks, a burgundy envelope closes
          around it, the crest seals it, and the whole letter flies off. */}
      <div className="cover-letter">
        <svg className="env-back" viewBox="0 0 100 131" preserveAspectRatio="none" aria-hidden="true">
          <rect width="100" height="131" fill="url(#env-paper)" />
          <rect width="100" height="131" fill="url(#env-shade-back)" />
        </svg>

        <div className="cover-card">
          {/* The photo, the script and the cut-out couple share one stage, so the
              words sit behind the couple at the same spot on every screen size. */}
          <div className="cover-stage">
            <img ref={photo} onLoad={() => setReady(true)} onError={() => setReady(true)} className="cover-photo" src={asset('web/cover-guitar.webp')} width="3000" height="2000" fetchPriority="high"
              alt="Shane playing guitar while Zessa, in a burgundy dress, leans on a branch and smiles at him" />
            <h1 className="cover-script">
              <span>Our</span>
              <span>wedding</span>
              <span>day</span>
            </h1>
            <img className="cover-photo cover-cutout" src={asset('web/cover-cutout.webp')} width="3000" height="2000" alt="" />
          </div>

          <p className="cover-names" aria-label="Shane and Zessa"><span>SHANE</span><span>ZESSA</span></p>

          <div className="cover-bar">
            <img src={asset('photos/crest.webp')} width="320" height="320" alt="" />
            <button type="button" className="cover-open" onClick={open}>Open the invitation <ArrowRight /></button>
          </div>
        </div>

        <EnvelopeFront />
        <img className="env-seal" src={asset('photos/crest.webp')} width="320" height="320" alt="" />
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
  const [opened, setOpened] = useState(false)
  useReveal(!gate)

  // The cover fills the screen and the page stays put until "Open the invitation".
  useEffect(() => {
    if (opened) return
    const root = document.documentElement
    root.classList.add('is-sealed')
    return () => root.classList.remove('is-sealed')
  }, [opened])

  function openInvitation() {
    window.scrollTo(0, 0)
    setOpened(true)
  }

  if (gate) return <Gate kind={gate} />

  return (
    <>
      {MUSIC_URL && <Music src={MUSIC_URL} />}
      {!opened && <Cover onOpen={openInvitation} />}

      <main>
        <section className="invite" id="invitation">
          <div className="invite-photo">
            <img src={asset('web/picnic.webp')} width="2400" height="1600" loading="lazy"
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
          <img className="painting" src={asset('web/corot-lake-nemi.webp')} width="1403" height="1871" loading="lazy" alt="" />
          <div className="when-inner">
            <h2 className="title on-dark reveal">Save the date</h2>
            <div className="reveal"><Calendar iso={WEDDING.start} /></div>
            <button type="button" className="btn btn-cream reveal" onClick={addToCalendar}>
              <CalendarIcon /> Add to my calendar
            </button>
          </div>
        </section>

        <section className="day painted">
          <img className="painting" src={asset('web/corot-souvenir-mortefontaine.webp')} width="1475" height="1735" loading="lazy" alt="" />
          <div className="day-inner">
            <span className="rule" />
            <p className="label">ORDER OF THE DAY</p>
            <h2 className="title reveal">The day</h2>
            <ol className="timeline">
              {WEDDING.day.map(({ time, title, where }, i) => (
                <li key={title} className="reveal" style={{ '--d': `${i * 80}ms` }}>
                  <span className="tl-time">{time}</span>
                  <span>
                    <span className="tl-title">{title}</span>
                    {where && <span className="tl-where">{where}</span>}
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
              <img src={asset('web/monet-poppies.webp')} width="1750" height="1400" loading="lazy" alt="" />
            </div>
            <div className="collage-print collage-giverny">
              <img src={asset('web/monet-garden-giverny.webp')} width="600" height="535" loading="lazy" alt="" />
            </div>
            <div className="collage-oval">
              <img src={asset('web/fantin-roses.webp')} width="800" height="654" loading="lazy" alt="" />
            </div>
            <div className="collage-print collage-bordighera">
              <img src={asset('web/monet-bordighera.webp')} width="600" height="483" loading="lazy" alt="" />
            </div>
            <img className="collage-couple" src={asset('web/day-what-to-wear-fixed.webp')} width="806" height="1500" loading="lazy" alt="" />
          </div>

          <p className="label muted">OUR COLOURS</p>
          <ul className="swatches">
            {WEDDING.palette.map((c) => (
              <li key={c.name}><span style={{ background: c.hex }} />{c.name}</li>
            ))}
          </ul>
        </section>

        <section className="words" aria-label="Just us, golden hour, long dinners, happy tears, your favorite song, candlelight, forever starts here">
          <img src={asset('web/field-holding-hands.webp')} width="1800" height="2400" loading="lazy"
            alt="Zessa and Shane holding hands in a field, both in white shirts and jeans" />
          {WORDS.map(([html, pos]) => (
            <span key={html} style={pos} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
          ))}
        </section>

        <section className="rsvp painted" id="rsvp">
          <img className="painting" src={asset('web/monet-meadow.webp')} width="1299" height="1732" loading="lazy" alt="" />
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
          <img src={asset('web/fantin-roses.webp')} width="800" height="654" loading="lazy" alt="Detail of Fantin-Latour’s painting Basket of Roses" />
        </div>
        <p className="title on-dark">See you soon</p>
        <Countdown iso={WEDDING.start} />
        <img className="seal-foot" src={asset('photos/crest.webp')} width="320" height="320" alt="" loading="lazy" />
        <p className="lead">With love,<br />Shane &amp; Zessa</p>
      </footer>
    </>
  )
}
