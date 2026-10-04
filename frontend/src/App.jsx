import { useEffect, useRef, useState } from 'react'
import Intro from './Intro.jsx'
import Gate, { useGate } from './Gate.jsx'
import { Cake, Calla, Candles, DoodleDefs, Flourish, Frame, Glasses, Heart, Notes, Rings, Rose } from './Doodles.jsx'

// RSVPs need the Django backend. Static builds show a "replies open soon" note instead.
const RSVP_OPEN = import.meta.env.DEV || import.meta.env.VITE_RSVP === 'on'

const img = (name) => `${import.meta.env.BASE_URL}images/${name}`

// EDIT: the wedding details live here.
const WEDDING = {
  start: '2027-06-12T15:00:00+08:00',
  dateLong: 'Saturday, June 12, 2027',
  dateShort: '12 . 06 . 2027',
  place: 'City, Province',
  replyBy: 'May 1, 2027',
  day: [
    { time: '3:00 pm', title: 'Ceremony', where: 'Venue name, Street, City', Icon: Rings },
    { time: '4:30 pm', title: 'Cocktails', where: 'In the garden', Icon: Glasses },
    { time: '6:00 pm', title: 'Dinner', where: 'Venue name, Street, City', Icon: Cake },
    { time: '8:00 pm', title: 'Dancing', where: 'Until the candles burn down', Icon: Notes },
  ],
  attire: 'Garden formal',
  palette: [
    { name: 'Oxblood', hex: '#4e1219' },
    { name: 'Burgundy', hex: '#7a2230' },
    { name: 'Champagne', hex: '#e6d2b0' },
    { name: 'Ivory', hex: '#f6efe2' },
    { name: 'Sage', hex: '#8e9878' },
  ],
}

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

function Calendar({ iso }) {
  const d = new Date(iso)
  // Use the wedding's own calendar date, not the viewer's timezone.
  const [y, m, day] = iso.slice(0, 10).split('-').map(Number)
  const first = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7 // Monday-first
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]

  return (
    <div className="calendar" aria-label={`${MONTHS[m - 1]} ${y}, the wedding is on the ${day}th`} data-ts={d.getTime()}>
      <p className="cal-month">{MONTHS[m - 1]} <span>{y}</span></p>
      <div className="cal-grid">
        {WEEKDAYS.map((w) => <span key={w} className="cal-wd">{w}</span>)}
        {cells.map((n, i) => (
          <span key={i} className={n === day ? 'cal-day is-day' : 'cal-day'}>
            {n === day && <Heart className="cal-heart" />}
            {n ?? ''}
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

function RsvpForm() {
  const [attending, setAttending] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | done
  const [error, setError] = useState('')
  const [reply, setReply] = useState(null)
  const thanksRef = useRef(null)

  useEffect(() => {
    if (status === 'done') thanksRef.current?.focus()
  }, [status])

  async function onSubmit(e) {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget).entries())

    if (!data.name?.trim()) return setError('Please tell us your name.')
    if (!data.attending) return setError('Please let us know if you can make it.')
    if (data.email && !e.currentTarget.email.checkValidity()) return setError('That email doesn’t look quite right.')

    setError('')
    setStatus('sending')
    try {
      const res = await fetch('/api/rsvp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, guests: data.attending === 'yes' ? Number(data.guests) : 0 }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Something went wrong.')
      }
      setReply({ name: data.name.trim().split(/\s+/)[0], attending: data.attending })
      setStatus('done')
    } catch (err) {
      setStatus('idle')
      setError(`${err.message} Please try again in a moment.`)
    }
  }

  if (status === 'done') {
    return (
      <div className="thanks" tabIndex={-1} ref={thanksRef}>
        <p className="thanks-title">Thank you, {reply.name}</p>
        <p className="muted">
          {reply.attending === 'yes'
            ? 'We’re so happy you’ll be there. See you soon.'
            : 'We’ll miss you, and we’re grateful you let us know.'}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="field">
        <label htmlFor="name">Your name</label>
        <input id="name" name="name" type="text" autoComplete="name" required />
      </div>

      <fieldset className="field">
        <legend>Can you make it?</legend>
        <div className="choices">
          <label className="choice">
            <input type="radio" name="attending" value="yes" onChange={(e) => setAttending(e.target.value)} />
            <span>Yes, gladly</span>
          </label>
          <label className="choice">
            <input type="radio" name="attending" value="no" onChange={(e) => setAttending(e.target.value)} />
            <span>Sadly, no</span>
          </label>
        </div>
      </fieldset>

      {attending === 'yes' && (
        <div className="field">
          <label htmlFor="guests">How many of you, including yourself?</label>
          <select id="guests" name="guests" defaultValue="1">
            {[1, 2, 3, 4].map((n) => <option key={n}>{n}</option>)}
          </select>
        </div>
      )}

      <div className="field">
        <label htmlFor="email">Email <span className="optional">(optional)</span></label>
        <input id="email" name="email" type="email" autoComplete="email" />
      </div>

      <div className="field">
        <label htmlFor="message">A note for us <span className="optional">(optional)</span></label>
        <textarea id="message" name="message" rows={3} placeholder="Dietary needs, a song request, a kind word" />
      </div>

      {/* spam trap, hidden from people */}
      <input className="hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send reply'}
      </button>
    </form>
  )
}

// An oval portrait. With `cutout`, the couple stand in front of a velvet oval
// and rise above its top edge; otherwise the photo fills the oval.
function Cameo({ src, alt, cutout, lazy, className = '' }) {
  const loading = lazy ? 'lazy' : undefined
  if (cutout) {
    return (
      <figure className={`cameo cameo-pop ${className}`}>
        <div className="cameo-oval" />
        <div className="cameo-pic">
          <img src={img(src)} width="806" height="1500" alt={alt} loading={loading} />
        </div>
      </figure>
    )
  }
  return (
    <figure className={`cameo ${className}`}>
      <div className="cameo-oval">
        <img src={img(src)} width="900" height="1200" alt={alt} loading={loading} />
      </div>
    </figure>
  )
}

export default function App() {
  const gate = useGate()
  useReveal(!gate)

  if (gate) return <Gate kind={gate} />

  return (
    <>
      <DoodleDefs />
      <Intro names={['Shane', 'Zessa']} date={WEDDING.dateShort} />

      <header className="hero">
        <div className="hero-copy">
          <h1 className="names">
            <span className="n1">Shane</span>
            <span className="amp">&amp;</span>
            <span className="n2">Zessa</span>
          </h1>
          <Flourish />
          <p className="hero-sub">request the pleasure of your company<br />as they are joined in marriage</p>
          <p className="hero-date">{WEDDING.dateLong}<br />{WEDDING.place}</p>
          <a className="btn" href="#rsvp">Reply to the invitation</a>
        </div>

        <div className="hero-art">
          <Cameo cutout src="couple-guitar.webp" alt="Shane holding a guitar with Zessa standing behind him, her hands on his shoulders" />
          <Rose className="d-rose" />
          <Calla className="d-calla" />
        </div>
      </header>

      <main>
        <section className="invite">
          <div className="cartouche reveal">
            <p>We would love for you to be there as we say our vows, share a long dinner by candlelight, and dance a little after.</p>
            <Heart className="d-heart" />
          </div>
          <div className="invite-print reveal">
            <img src={img('picnic.jpg')} width="1400" height="933" loading="lazy" alt="Shane and Zessa lying head to head on a picnic blanket, laughing" />
          </div>
        </section>

        <section className="when reveal">
          <Frame className="cal-frame">
            <h2 className="script-title">Save the date</h2>
            <Calendar iso={WEDDING.start} />
          </Frame>
          <Candles className="d-candles" />
        </section>

        <section className="day">
          <div className="day-inner">
            <h2 className="script-title reveal">The day</h2>
            <Flourish />
            <ol className="timeline">
              {WEDDING.day.map(({ time, title, where, Icon }) => (
                <li key={title} className="reveal">
                  <Icon className="tl-icon" />
                  <p className="tl-time">{time}</p>
                  <p className="tl-title">{title}</p>
                  <p className="tl-where">{where}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="attire reveal">
          <h2 className="script-title">Dress code</h2>
          <p className="attire-name">{WEDDING.attire}</p>
          <p className="muted">We&rsquo;d love to see you in these shades.</p>
          <ul className="swatches">
            {WEDDING.palette.map((c) => (
              <li key={c.name}><span style={{ background: c.hex }} /><small>{c.name}</small></li>
            ))}
          </ul>
        </section>

        <section className="rsvp" id="rsvp">
          <div className="rsvp-art reveal">
            <Cameo className="cameo-sm" src="portrait-field.jpg" lazy alt="Zessa and Shane holding hands, both in white shirts and jeans" />
          </div>

          <Frame className="rsvp-card reveal">
            <h2 className="script-title">Will you join us?</h2>
            <p className="muted">Kindly reply by {WEDDING.replyBy}.</p>
            {RSVP_OPEN ? <RsvpForm /> : (
              <p className="rsvp-soon">Replies open soon. We&rsquo;ll send word when they do.</p>
            )}
          </Frame>
        </section>
      </main>

      <footer className="finale">
        <p className="script-title">See you soon</p>
        <Countdown iso={WEDDING.start} />
        <Flourish />
        <p className="sign">With love, Shane &amp; Zessa</p>
        <img className="seal-foot" src={img('wax-seal.webp')} width="320" height="320" alt="" />
      </footer>
    </>
  )
}
