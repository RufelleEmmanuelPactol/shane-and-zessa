import { useEffect, useRef, useState } from 'react'
import Gate, { useGate } from './Gate.jsx'
import Music from './Music.jsx'
import Rsvp from './Rsvp.jsx'
import { addToCalendar } from './ics.js'
import { CalendarIcon, Monogram, PinIcon } from './icons.jsx'
import ninongImg from './assets/attire-ninong.webp'
import ninangImg from './assets/attire-ninang.webp'
import guestsImg from './assets/attire-guests.webp'
import timelineLine from './assets/timeline/line.webp'
import paperUrl from './assets/paper.webp'
import paperPageUrl from './assets/paper-page.webp'
import monogramUrl from './assets/monogram.webp'
import churchSketch from './assets/timeline/prop-1.webp'
import gardenSketch from './assets/timeline/prop-3.webp'
import lanternsImg from './assets/lanterns.webp'
import giftBoxImg from './assets/gift-box.webp'
import seaMistImg from './assets/sea-mist.webp'
import { asset, mapUrl, MUSIC_URL, WEDDING } from './wedding.js'


// how long the cover takes to drift away; keep in step with .cover.is-leaving in index.css
const OPEN_MS = 1400

const WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// Fades sections in as they scroll into view.
function useReveal(ready) {
  useEffect(() => {
    if (!ready) return
    const els = document.querySelectorAll('.reveal:not(.in)')
    // .reveal-full starts as soon as the top of the piece is well on screen
    const full = document.querySelectorAll('.reveal-full:not(.in)')
    if (!('IntersectionObserver' in window)) {
      [...els, ...full].forEach((el) => el.classList.add('in'))
      return
    }
    const reveal = (io) => (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in')
        io.unobserve(e.target)
      }
    })
    const io = new IntersectionObserver((entries) => reveal(io)(entries), { rootMargin: '0px 0px -8% 0px' })
    const mostlySeen = (e) => e.intersectionRatio >= 0.15
    const ioFull = new IntersectionObserver(
      (entries) => reveal(ioFull)(entries.filter(mostlySeen)),
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
    )
    els.forEach((el) => io.observe(el))
    full.forEach((el) => ioFull.observe(el))
    return () => { io.disconnect(); ioFull.disconnect() }
  }, [ready])
}

// Each moment's sketch, cut from design/web/day-timeline.svg (its pencil filter
// isn't reliable in every browser): [left, top, width, height] on the 342 × 1060 drawing.
const PROP_BOXES = [
  [199, 16, 62, 69],
  [49, 156, 100, 81],
  [192, 312, 60, 73],
  [30, 466, 120, 69],
  [195, 608, 75, 80],
  [41, 765, 92, 64],
  [196, 907, 37, 78],
]
const PROP_IMAGES = Object.values(import.meta.glob('./assets/timeline/prop-*.webp', { eager: true, import: 'default' }))

// The line is drawn already; as each moment comes on screen its sketch
// appears and then its words, one moment at a time.
function Timeline() {
  const list = useRef(null)
  useEffect(() => {
    const props = [...list.current.querySelectorAll('.tl-prop')]
    const moments = [...list.current.querySelectorAll('.tl-moment')]
    const show = (i) => { props[i].classList.add('in'); moments[i].classList.add('in') }
    if (!('IntersectionObserver' in window)) return props.forEach((_, i) => show(i))
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return
        show(moments.indexOf(e.target))
        io.unobserve(e.target)
      }),
      // start once most of the moment is on screen
      { threshold: 0.6 },
    )
    moments.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const pct = (n, of) => `${(n / of) * 100}%`
  return (
    <div className="timeline" ref={list}>
      <img className="timeline-sketch" src={timelineLine} width="1026" height="3180" loading="lazy" alt="" />
      {PROP_BOXES.map(([x, y, w, h], i) => (
        <img key={i} className="tl-prop" src={PROP_IMAGES[i]} width={w * 3} height={h * 3} loading="lazy" alt=""
          style={{ left: pct(x, 342), top: pct(y, 1060), width: pct(w, 342) }} />
      ))}
      <ol>
        {WEDDING.day.map(({ time, title, note }, i) => (
          <li key={title} className={i % 2 ? 'tl-moment is-left' : 'tl-moment'} style={{ '--top': `${((88 + 150 * i) / 1060) * 100}%` }}>
            <span className="tl-time">{time}</span>
            <span className="tl-title">{title}</span>
            <span className="tl-note">{note}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

// Every picture on the page (and the paper textures, fonts and the music) is
// fetched and decoded before the invitation shows, so nothing ever appears
// half-drawn and the music can start the moment the loader is gone.
// Gives up waiting after 15s so a slow connection still gets the page.
function usePreload(active) {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [music, setMusic] = useState(null)
  useEffect(() => {
    if (!active) return
    const imgs = [...document.querySelectorAll('img')]
    // load them now rather than when scrolled to (same elements, so nothing downloads twice)
    imgs.forEach((img) => { img.loading = 'eager' })
    const extras = [paperUrl, paperPageUrl, monogramUrl].map((src) => {
      const img = new Image()
      img.src = src
      return img
    })
    const jobs = [...imgs, ...extras].map((img) => img.decode().catch(() => {}))
    jobs.push(document.fonts.ready)
    // the whole song is held in memory, so playing it never waits on the network
    if (MUSIC_URL) {
      jobs.push(fetch(MUSIC_URL)
        .then((res) => (res.ok ? res.blob() : Promise.reject()))
        .then((blob) => setMusic(URL.createObjectURL(blob)))
        .catch(() => {}))
    }
    let finished = 0
    jobs.forEach((job) => job.then(() => setProgress(++finished / jobs.length)))
    let cancelled = false
    const giveUp = new Promise((resolve) => setTimeout(resolve, 15000))
    Promise.race([Promise.all(jobs), giveUp]).then(() => { if (!cancelled) setDone(true) })
    return () => { cancelled = true }
  }, [active])
  return [progress, done, music]
}

function Loader({ progress, done }) {
  return (
    <div className={`loader${done ? ' is-done' : ''}`} role="status" aria-label="Loading the invitation">
      <Monogram />
      <p className="loader-names">Shane <span>&amp;</span> Zessa</p>
      <span className="loader-line" aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} /></span>
      <p className="loader-note">Preparing your invitation</p>
    </div>
  )
}

function Cover({ onOpen, leaving, loaded }) {
  // play the entrance once the photo is ready, so it never animates over a blank
  const photo = useRef(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (photo.current?.complete) setReady(true)
  }, [])

  return (
    <header className={`cover${ready && loaded ? ' is-in' : ''}${leaving ? ' is-leaving' : ''}`} inert={leaving || undefined}>
      <div className="cover-card">
        <img ref={photo} onLoad={() => setReady(true)} onError={() => setReady(true)} className="cover-bg" src={asset('web/cover-guitar.webp')} width="3000" height="2000" fetchPriority="high"
          alt="Shane playing guitar while Zessa, in a burgundy dress, leans on a branch and smiles at him" />

        <h1 className="cover-script">
          <span>You are</span>
          <span>Invited</span>
        </h1>

        <div className="cover-bar">
          <Monogram />
          {/* scrolling down opens it too; this is the cue (and a tap target) */}
          <button type="button" className="cover-open" onClick={onOpen}>
            Scroll down to continue
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
          </button>
        </div>
      </div>
    </header>
  )
}

// The wedding week, Sunday first, with the day itself filled in.
function Week({ iso }) {
  // Use the wedding's own calendar date, not the viewer's timezone.
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  const days = Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(y, m - 1, d + i)))
  return (
    <div className="week" role="img" aria-label={`Sunday, ${MONTHS[m - 1]} ${d}, ${y}`}>
      {days.map((t, i) => (
        <span key={i} className="week-day" aria-hidden="true">
          {WEEK[t.getUTCDay()]}
          <span className={i === 0 ? 'is-day' : i === 1 ? 'is-next' : undefined}>{t.getUTCDate()}</span>
        </span>
      ))}
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

export default function App() {
  const gate = useGate()
  // sealed → opening (the cover drifts away over the invitation) → open
  const [phase, setPhase] = useState('sealed')
  const opened = phase === 'open'
  useReveal(!gate)
  const [progress, loaded, music] = usePreload(!gate)

  // The cover fills the screen and the page stays put until the guest scrolls
  // down (or taps the cue); that gesture opens the invitation instead.
  useEffect(() => {
    if (opened) return
    const root = document.documentElement
    root.classList.add('is-sealed')
    // iOS still scrolls past overflow: hidden, which would slide the cover
    // away, so swipes and wheels are caught and turned into "open"
    let startY = null
    const touchStart = (e) => { startY = e.touches[0].clientY }
    const touchMove = (e) => {
      e.preventDefault()
      if (startY !== null && startY - e.touches[0].clientY > 24) openRef.current()
    }
    const wheel = (e) => {
      e.preventDefault()
      if (e.deltaY > 4) openRef.current()
    }
    const keys = (e) => {
      if (['ArrowDown', 'PageDown', ' ', 'End'].includes(e.key) && e.target === document.body) {
        e.preventDefault()
        openRef.current()
      }
    }
    const pin = () => window.scrollY && window.scrollTo(0, 0)
    document.addEventListener('touchstart', touchStart, { passive: true })
    document.addEventListener('touchmove', touchMove, { passive: false })
    document.addEventListener('wheel', wheel, { passive: false })
    document.addEventListener('keydown', keys)
    window.addEventListener('scroll', pin)
    return () => {
      root.classList.remove('is-sealed')
      document.removeEventListener('touchstart', touchStart)
      document.removeEventListener('touchmove', touchMove)
      document.removeEventListener('wheel', wheel)
      document.removeEventListener('keydown', keys)
      window.removeEventListener('scroll', pin)
    }
  }, [opened])

  const openRef = useRef(null)
  openRef.current = openInvitation
  function openInvitation() {
    // not while the loader is still up
    if (phase !== 'sealed' || !loaded) return
    window.scrollTo(0, 0)
    setPhase('opening')
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    setTimeout(() => setPhase('open'), still ? 0 : OPEN_MS)
  }

  if (gate) return <Gate kind={gate} />

  return (
    <>
      {MUSIC_URL && <Music src={loaded ? music || MUSIC_URL : undefined} ready={loaded} />}
      <Loader progress={progress} done={loaded} />
      {!opened && <Cover onOpen={openInvitation} leaving={phase === 'opening'} loaded={loaded} />}

      <main className={phase === 'sealed' ? 'is-sealed' : undefined}>
        <section className="invite" id="invitation">
          <img className="invite-photo" src={seaMistImg} width="1170" height="1755"
            alt="Shane and Zessa forehead to forehead on a rock in the shallow sea, Zessa in a flowing white gown" />
          <div className="invite-head">
            <p className="invite-blessing">Together with God’s blessing</p>
            <p className="invite-of">The Wedding Of</p>
            <h2 className="invite-names">Shane &amp; Zessa</h2>
          </div>
          <div className="invite-foot">
            <p className="invite-lead">We joyfully invite you to celebrate our special day with us.</p>
            <p className="invite-save">Save the date</p>
            <p className="invite-month">November</p>
            <Week iso={WEDDING.start} />
            <button type="button" className="invite-cal" onClick={addToCalendar}>
              <CalendarIcon /> Add to my calendar
            </button>
          </div>
        </section>

        <section className="day">
          <p className="label">WEDDING DAY TIMELINE</p>
          <h2 className="title reveal">The day</h2>
          <p className="label day-date">{WEDDING.dayLine}</p>
          {/* a pencil line winds down the middle; each moment sits beside its sketch */}
          <Timeline />
          <p className="timeline-close reveal">We look forward to celebrating with you!</p>
        </section>

        <section className="venues">
          <h2 className="title reveal">The Places</h2>
          {/* two enclosure cards, like the little ones tucked in with an invitation */}
          <div className="venue-cards">
            {[[WEDDING.ceremony, 'Ceremony', churchSketch, [100, 81]], [WEDDING.reception, 'Reception', gardenSketch, [120, 69]]].map(([venue, what, sketch, [w, h]]) => (
              <div key={venue.name} className="venue-card reveal">
                <img src={sketch} width={w * 3} height={h * 3} loading="lazy" alt="" style={{ width: w, height: h }} />
                <p className="venue-what">{what}</p>
                <p className="venue-time">{venue.label.split(' · ')[1].toLowerCase()}</p>
                <p className="venue-name">{venue.name}</p>
                <p className="venue-where">{venue.address.replace(', Zamboanga del Norte', '')}</p>
                <a className="venue-go" href={mapUrl(venue)} target="_blank" rel="noopener" aria-label={`Directions to ${venue.name}`}>
                  <PinIcon /> Directions
                </a>
              </div>
            ))}
          </div>
          <p className="venues-note reveal">The reception is a short drive from the church. We’ll see you at both.</p>
        </section>

        <section className="attire">
          <div className="attire-head">
            <span className="ornament" aria-hidden="true" />
            <h2 className="attire-title">DRESS CODE</h2>
          </div>

          <div className="collage reveal-full" aria-hidden="true">
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
                  <img src={ninongImg} width="800" height="800" loading="lazy" alt="Drawing of a champagne Barong Tagalog over black slacks" />
                  <img src={ninangImg} width="800" height="800" loading="lazy" alt="Drawing of a rose gold formal gown with flutter sleeves" />
                </div>
                <p className="attire-what">Formal wear</p>
                <p className="attire-detail"><em>Ninong</em> · rose gold, champagne or cream barong with black slacks</p>
                <p className="attire-detail"><em>Ninang</em> · rose gold or champagne formal dresses</p>
              </div>

              <div className="attire-card reveal">
                <p className="attire-who">For our guests</p>
                <img className="attire-single" src={guestsImg} width="800" height="800" loading="lazy" alt="Drawing of a burgundy midi dress, a chocolate-brown pantsuit and a maroon long-sleeve shirt with trousers" />
                <p className="attire-what">Formal or semi-formal</p>
                <p className="attire-detail"><em>Ladies</em> · dresses or pantsuits</p>
                <p className="attire-detail"><em>Gentlemen</em> · formal long sleeves or smart casual</p>
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

        <section className="lanterns">
          <img src={lanternsImg} width="1800" height="1200" loading="lazy"
            alt="Zessa and Shane at the water’s edge at night, each holding up a lantern" />
        </section>

        <section className="gifts">
          <img className="gifts-box" src={giftBoxImg} width="640" height="640" loading="lazy"
            alt="A sketch of a gift box tied with a Victorian ribbon bow and a sprig of roses" />
          <p className="label">GIFT PREFERENCE</p>
          <div className="gifts-verse">
            <p>By the grace of God, we’ve been truly blessed,<br />Your love and prayers mean more than the rest.</p>
            <p>As we start our life together, with love all around,<br />A monetary gift would help us build our dreams from the ground.</p>
            <p className="gifts-sign">With love,</p>
            <p className="gifts-names">Shane &amp; Zessa</p>
          </div>
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
                </div>
              </div>
            } />
          </div>
        </section>
      </main>

      <footer className="finale">
        <div className="arch">
          <img src={asset('web/fantin-roses.webp')} width="800" height="654" loading="lazy" alt="Detail of Fantin-Latour’s painting Basket of Roses" />
        </div>
        <p className="title on-dark">See you soon</p>
        <Countdown iso={WEDDING.start} />
        <Monogram className="seal-foot" />
        <p className="lead">With love and gratitude,<br /><span className="finale-names">Shane <span>&amp;</span> Zessa</span></p>
      </footer>
    </>
  )
}
