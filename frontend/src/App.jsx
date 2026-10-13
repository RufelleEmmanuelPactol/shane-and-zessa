import { useEffect, useRef, useState } from 'react'
import Gate, { useGate } from './Gate.jsx'
import Music from './Music.jsx'
import Rsvp from './Rsvp.jsx'
import { addToCalendar } from './ics.js'
import { ArrowRight, CalendarIcon, DAY_ICONS, PinIcon } from './icons.jsx'
import barongImg from './assets/attire-barong.webp'
import filipinianaImg from './assets/attire-filipiniana.webp'
import guestsImg from './assets/attire-guests.webp'
import { asset, mapUrl, MUSIC_URL, WEDDING } from './wedding.js'


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

function Cover({ onOpen }) {
  // play the entrance once the photo is ready, so it never animates over a blank
  const photo = useRef(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (photo.current?.complete) setReady(true)
  }, [])

  return (
    <header className={`cover${ready ? ' is-in' : ''}`}>
      <div className="cover-letter">
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
            <button type="button" className="cover-open" onClick={onOpen}>Open the invitation <ArrowRight /></button>
          </div>
        </div>
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
            <p className="invite-blessing">Together with God’s blessing,<br />the wedding of</p>
            <p className="invite-names names">Shane <span>&amp;</span> Zessa</p>
            <p className="lead">We joyfully invite you to celebrate our special day with us.</p>
          </div>
        </section>

        <section className="when painted">
          <img className="painting" src={asset('web/corot-lake-nemi.webp')} width="1403" height="1871" loading="lazy" alt="" />
          <div className="when-inner">
            <div className="reveal">
              <h2 className="title on-dark">Save the date</h2>
              <p className="when-date">Sunday, November 29, 2026</p>
            </div>
            <div className="reveal"><Calendar iso={WEDDING.start} /></div>
            <button type="button" className="btn btn-cream reveal" onClick={addToCalendar}>
              <CalendarIcon /> Add to my calendar
            </button>
          </div>
        </section>

        <section className="day painted">
          <img className="painting" src={asset('web/corot-souvenir-mortefontaine.webp')} width="1475" height="1735" loading="lazy" alt="" />
          <span className="rule" />
          <p className="label">WEDDING DAY TIMELINE</p>
          <h2 className="title reveal">The day</h2>
          <ol className="timeline">
            {WEDDING.day.map(({ time, title, icon, main }, i) => (
              <li key={title} className={main ? 'reveal is-main' : 'reveal'} style={{ '--d': `${i * 80}ms` }}>
                <span className="tl-icon">{DAY_ICONS[icon]}</span>
                <span className="tl-text">
                  <span className="tl-time">{time}</span>
                  <span className="tl-title">{title}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="timeline-close reveal">We look forward to celebrating with you!</p>

          <div className="venues">
            <p className="label">WHERE TO FIND US</p>
            {[[WEDDING.ceremony, 'chapel', ''], [WEDDING.reception, 'sprig', ' venue-dark']].map(([venue, icon, tone]) => (
              <div key={venue.name} className={`venue reveal${tone}`}>
                <div className="venue-head">
                  <span className="venue-icon">{DAY_ICONS[icon]}</span>
                  <span>
                    <span className="venue-label">{venue.label}</span>
                    <span className="venue-name">{venue.name}</span>
                  </span>
                </div>
                <a className="btn venue-go" href={mapUrl(venue)} target="_blank" rel="noopener">
                  <PinIcon /> Get directions
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="attire">
          <div className="attire-head">
            <span className="ornament" aria-hidden="true" />
            <h2 className="attire-title">DRESS CODE</h2>
          </div>

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
            {/* a lace band hides the couple's feet */}
            <div className="collage-lace">
              <svg viewBox="0 0 390 28" preserveAspectRatio="xMidYMid meet">
                <path d="M24 14H166M224 14H366" stroke="#c9a96e" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                <g fill="#c9a96e"><rect x="17" y="13" width="6" height="6" transform="rotate(45 20 16)" /><rect x="367" y="13" width="6" height="6" transform="rotate(45 370 16)" /></g>
                <g transform="translate(195 15)">
                  <ellipse cx="-17" cy="2" rx="10" ry="4" fill="#5f6b4e" transform="rotate(-18 -17 2)" />
                  <ellipse cx="17" cy="2" rx="10" ry="4" fill="#5f6b4e" transform="rotate(18 17 2)" />
                  <g fill="#c48a78">{[0, 72, 144, 216, 288].map((r) => <circle key={r} cx="0" cy="-7" r="5.5" transform={`rotate(${r})`} />)}</g>
                  <circle r="4" fill="#8b1e35" />
                  <circle r="1.4" fill="#e8d3b4" />
                </g>
              </svg>
            </div>
          </div>

          <div className="attire-garden">
            <img className="attire-painting" src={asset('web/hassam-garden.webp')} width="1546" height="1800" loading="lazy" alt="" />
            <h3 className="title reveal">What to wear</h3>
            <div className="attire-cards">
              <div className="attire-card reveal">
                <p className="attire-who">For our principal sponsors</p>
                <div className="attire-pair">
                  <img src={barongImg} width="800" height="800" loading="lazy" alt="Drawing of a Barong Tagalog with embroidered front panels" />
                  <img src={filipinianaImg} width="800" height="800" loading="lazy" alt="Drawing of a Filipiniana gown with butterfly sleeves" />
                </div>
                <p className="attire-what">Formal wear</p>
                <p className="attire-detail">Barong Tagalog<span className="diamond" aria-hidden="true" />Filipiniana</p>
              </div>

              <div className="attire-card reveal">
                <p className="attire-who">For our guests</p>
                <img className="attire-single" src={guestsImg} width="800" height="800" loading="lazy" alt="Drawing of a semi-formal midi dress beside a suit" />
                <p className="attire-what">Semi-formal attire</p>
                <p className="attire-detail">in burgundy &amp; champagne</p>
                <ul className="swatches" aria-label="Our colour palette">
                  {WEDDING.palette.map((c) => (
                    <li key={c.name}><span style={{ background: c.hex }} />{c.name}</li>
                  ))}
                </ul>
                <p className="attire-note">We kindly encourage everyone to dress within our chosen color palette to complement the look and feel of our celebration.</p>
              </div>
            </div>
          </div>
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
            <Rsvp head={
              <div className="rsvp-head">
                <p className="label">KINDLY RSVP</p>
                <h2 className="title title-sm">Will you join us?</h2>
                <p className="rsvp-lead">
                  Please confirm your attendance on or before <strong>{WEDDING.replyBy}</strong> so we can reserve your seat and finalize our guest list.
                </p>
                <div className="reply-by">
                  <span className="rsvp-rule-title">No RSVP, no seat reserved</span>
                  <p className="rsvp-note">We sincerely ask for your prompt response and understanding as we make the necessary arrangements for our celebration.</p>
                </div>
              </div>
            } />
          </div>
        </section>

        <section className="gifts">
          <svg className="gifts-rose" viewBox="0 0 120 20" aria-hidden="true">
            <path d="M4 10H46M74 10H116" stroke="#c9a96e" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <g transform="translate(60 10)" fill="#c48a78">
              {[0, 72, 144, 216, 288].map((r) => <circle key={r} cx="0" cy="-4.5" r="3.5" transform={`rotate(${r})`} />)}
              <circle r="2.4" fill="#8b1e35" />
            </g>
          </svg>
          <p className="label">GIFT PREFERENCE</p>
          <p className="gifts-blessed">BY THE GRACE OF GOD, WE’VE BEEN TRULY BLESSED.</p>
          <p className="gifts-request">Your presence and prayers are all we request.</p>
          <p className="gifts-body">Should you wish to give us a gift, in lieu of material items, a monetary gift would be most appreciated. Your generosity will help us as we begin building our life together and plan for our future as husband and wife.</p>
          <p className="gifts-body muted"><em>Above all, we are grateful to celebrate this milestone with you.</em></p>
        </section>
      </main>

      <footer className="finale">
        <div className="arch">
          <img src={asset('web/fantin-roses.webp')} width="800" height="654" loading="lazy" alt="Detail of Fantin-Latour’s painting Basket of Roses" />
        </div>
        <p className="title on-dark">See you soon</p>
        <Countdown iso={WEDDING.start} />
        <img className="seal-foot" src={asset('photos/crest.webp')} width="320" height="320" alt="" loading="lazy" />
        <p className="lead">With love and gratitude,<br /><span className="finale-names names">Shane <span>&amp;</span> Zessa</span></p>
      </footer>
    </>
  )
}
