import { useEffect, useRef, useState } from 'react'
import { asset, CONTACT_URL, WEDDING } from './wedding.js'
import { addToCalendar } from './ics.js'
import { CalendarIcon, ChevronLeft, MessageIcon, SearchIcon } from './icons.jsx'

// Replies are saved by the Django backend (POST /api/rsvp/). A copy is kept on
// the guest's phone so they see their reply when they come back.
const SAVED = 'sz-rsvp'

// The guest list lives in the backend (the repo is public); the page only
// ever sees the names that match what the guest typed.
function useGuestSearch(query, active) {
  const [state, setState] = useState({ q: '', results: [], failed: false })
  const q = query.trim()
  useEffect(() => {
    if (!active || q.length < 2) return
    const ctl = new AbortController()
    const t = setTimeout(() => {
      fetch(`/api/guests/?q=${encodeURIComponent(q)}`, { signal: ctl.signal })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error())))
        .then((data) => setState({ q, results: data.results, failed: false }))
        .catch((e) => e.name !== 'AbortError' && setState({ q, results: [], failed: true }))
    }, 200)
    return () => {
      clearTimeout(t)
      ctl.abort()
    }
  }, [q, active])
  const ready = q.length >= 2 && state.q === q
  return { results: ready ? state.results : [], failed: ready && state.failed, done: ready }
}

const ORDER = ['find', 'attend', 'party', 'note', 'done']

const seatsText = (n) => (n === 1 ? '1 seat' : `${n} seats`)

function load() {
  try {
    return JSON.parse(localStorage.getItem(SAVED)) ?? null
  } catch {
    return null
  }
}

function summary(r) {
  if (r.attending === 'no') return 'Regretfully declines'
  const others = r.names.slice(1).filter(Boolean)
  return others.length ? `Joyfully accepts\n${[r.names[0], ...others].join(', ')}` : 'Joyfully accepts'
}

function replyText(r, updated) {
  const lines = [`${updated ? 'Updated reply' : 'RSVP'} from ${r.name}: ${r.attending === 'yes' ? 'joyfully accepts' : 'regretfully declines'}.`]
  if (r.fullName) lines.push(`Complete name: ${r.fullName}`)
  if (r.attending === 'yes') lines.push(`Coming (${r.names.length}): ${r.names.join(', ')}`)
  if (r.note) lines.push(`Note: ${r.note}`)
  return lines.join('\n')
}

function Steps({ n, onBack }) {
  return (
    <div className="steps">
      <div className="steps-row">
        {onBack ? (
          <button type="button" className="back" onClick={onBack} aria-label="Back"><ChevronLeft /></button>
        ) : <span />}
        <span className="steps-count">Step {n} of 4</span>
      </div>
      <div className="steps-bar" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => <span key={i} className={i <= n ? 'on' : ''} />)}
      </div>
    </div>
  )
}

function Flow() {
  const [saved, setSaved] = useState(load)
  const [step, setStep] = useState(saved ? 'done' : 'find')
  const [dir, setDir] = useState('none')
  const [query, setQuery] = useState('')
  const [pick, setPick] = useState(null)
  const [attending, setAttending] = useState('')
  const [count, setCount] = useState(1)
  const [names, setNames] = useState([])
  const [fullName, setFullName] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const card = useRef(null)
  const first = useRef(true)

  // move focus to the new step's heading so screen readers follow along
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    card.current?.querySelector('h3')?.focus({ preventScroll: true })
    const top = card.current?.getBoundingClientRect().top ?? 0
    // only scroll when the card's top has gone off screen
    if (top < 0) card.current.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [step])

  const go = (s) => {
    setError('')
    setDir(ORDER.indexOf(s) < ORDER.indexOf(step) ? 'back' : 'forward')
    setStep(s)
  }

  const { results, failed, done } = useGuestSearch(query, step === 'find' && !pick)
  const seats = pick?.seats ?? 1

  function choose(g) {
    setPick(g)
    setQuery(g.name)
    setCount(1)
    setNames([])
    setFullName('')
    go('attend')
  }

  function afterAttend() {
    if (!attending) return setError('Please choose one.')
    go(attending === 'yes' ? 'party' : 'note')
  }

  function afterParty() {
    if (pick.sponsor && !fullName.trim()) return setError('Please write your complete name.')
    const missing = Array.from({ length: count - 1 }, (_, i) => names[i]).findIndex((n) => !n?.trim())
    if (missing !== -1) return setError(`Please write Guest ${missing + 2}’s name.`)
    go('note')
  }

  const reply = () => ({
    guest: { id: pick.id, name: pick.name, seats: pick.seats, sponsor: pick.sponsor },
    name: pick.name,
    attending,
    fullName: pick.sponsor && attending === 'yes' ? fullName.trim() : '',
    names: attending === 'yes' ? [pick.name, ...names.slice(0, count - 1).map((n) => n.trim())] : [],
    note: note.trim(),
  })

  async function send() {
    const r = reply()
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/rsvp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest: r.guest.id,
          name: r.fullName || r.name,
          attending: r.attending,
          guests: r.names.length,
          // guest names, sponsor's full name and the note ride in the message
          message: replyText(r, !!saved),
        }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setSending(false)
      return setError('We couldn’t send that just now. Please check your connection and try again.')
    }
    try {
      localStorage.setItem(SAVED, JSON.stringify(r))
    } catch { /* private mode: keep it in memory only */ }
    setSaved(r)
    setSending(false)
    go('done')
  }

  function change() {
    const r = saved
    const g = r.guest
    if (!g?.id) {
      setPick(null)
      setQuery('')
      return go('find')
    }
    setPick(g)
    setQuery(g.name)
    setAttending(r.attending)
    setCount(Math.max(1, r.names.length))
    setNames(r.names.slice(1))
    setFullName(r.fullName)
    setNote(r.note)
    go('attend')
  }

  const err = error && <p className="form-error" role="alert">{error}</p>

  if (step === 'done' && saved) {
    const yes = saved.attending === 'yes'
    return (
      <div className="reply-card thanks" ref={card} key={step} data-dir={dir}>
        <img className="thanks-seal" src={asset('photos/crest.webp')} width="320" height="320" alt="" />
        <h3 className="flow-title" tabIndex={-1}>Thank you, {saved.name}</h3>
        <p className="body">
          {yes ? 'We’re so happy you’ll be there. See you on the 29th.' : 'We’ll miss you, and we’re grateful you let us know.'}
        </p>
        <div className="summary">
          <p className="label">YOUR REPLY</p>
          <p className="summary-text">{summary(saved)}</p>
        </div>
        {yes && (
          <button type="button" className="btn btn-line" onClick={addToCalendar}>
            <CalendarIcon /> Add to my calendar
          </button>
        )}
        <button type="button" className="link" onClick={change}>Change my reply</button>
      </div>
    )
  }

  if (step === 'find') {
    const noMatch = done && !failed && results.length === 0
    return (
      <div className="reply-card" ref={card} key={step} data-dir={dir}>
        <Steps n={1} />
        <h3 className="flow-title" tabIndex={-1}>Find your name</h3>
        <label htmlFor="find" className="body">Type your name as it appears on your invitation.</label>
        <div className="search">
          <SearchIcon />
          <input
            id="find"
            type="search"
            autoComplete="off"
            enterKeyHint="search"
            placeholder="e.g. Rhian"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPick(null)
            }}
          />
        </div>
        {results.length > 0 && (
          <ul className="results">
            {results.map((g) => (
              <li key={g.id}>
                <button type="button" onClick={() => choose(g)}>
                  <span>{g.name}</span>
                  <span className="seats">{seatsText(g.seats)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {failed && <p className="form-error" role="alert">We couldn’t search the guest list just now. Please check your connection and try again.</p>}
        {noMatch && (
          <>
            <div className="notice">
              <p className="notice-title">We couldn’t find that name</p>
              <p>Try just your first name, or the name we usually call you. If it still doesn’t show up, send us a message and we’ll add you.</p>
            </div>
            <a className="btn btn-line" href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
              <MessageIcon /> Message Shane &amp; Zessa
            </a>
          </>
        )}
      </div>
    )
  }

  if (step === 'attend') {
    return (
      <div className="reply-card" ref={card} key={step} data-dir={dir}>
        <Steps n={2} onBack={() => go('find')} />
        <p className="chip">
          Hi, <strong>{pick.name}</strong>! {seats === 1 ? 'We’ve saved a seat for you.' : `We’ve saved ${seats} seats for your party.`} Only the guests named on your reply can be seated.
        </p>
        <h3 className="flow-title" tabIndex={-1} id="attend-q">Can you make it?</h3>
        <div className="choices" role="radiogroup" aria-labelledby="attend-q">
          {[['yes', 'Joyfully accepts'], ['no', 'Regretfully declines']].map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={attending === v}
              className={attending === v ? 'choice is-on' : 'choice'}
              onClick={() => {
                setAttending(v)
                setError('')
              }}
            >
              <span className="dot" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
        {err}
        <button type="button" className="btn" onClick={afterAttend}>Continue</button>
      </div>
    )
  }

  if (step === 'party') {
    return (
      <div className="reply-card" ref={card} key={step} data-dir={dir}>
        <Steps n={3} onBack={() => go('attend')} />
        <h3 className="flow-title" tabIndex={-1}>Who’s coming?</h3>

        {pick.sponsor && (
          <div className="field">
            <label htmlFor="fullname">Your complete name, for the programme</label>
            <input id="fullname" type="text" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
        )}

        {seats > 1 && (
          <>
            <div className="stepper">
              <span id="guests-label">Guests, including you</span>
              <div role="group" aria-labelledby="guests-label">
                <button type="button" aria-label="One fewer guest" disabled={count <= 1} onClick={() => setCount(count - 1)}>−</button>
                <span aria-live="polite" key={count} className="tick">{count}</span>
                <button type="button" aria-label="One more guest" disabled={count >= seats} onClick={() => setCount(count + 1)}>+</button>
              </div>
            </div>
            <p className="hint">Your invitation has {seats} seats. We can’t add more.</p>
          </>
        )}

        <div className="field">
          <span className="field-label">Guest 1</span>
          <p className="fixed">{pick.name}</p>
        </div>
        {Array.from({ length: count - 1 }, (_, i) => (
          <div className="field" key={i}>
            <label htmlFor={`guest-${i + 2}`}>Guest {i + 2}’s name</label>
            <input
              id={`guest-${i + 2}`}
              type="text"
              placeholder="A first name is fine"
              value={names[i] ?? ''}
              onChange={(e) => {
                const next = [...names]
                next[i] = e.target.value
                setNames(next)
              }}
            />
          </div>
        ))}

        <div className="kids">
          <p className="kids-title">Children &amp; plus ones</p>
          <p>Ours is an adults-only celebration, and we can only welcome the guests named on your invitation. Please don’t bring anyone who isn’t listed.</p>
        </div>
        {err}
        <button type="button" className="btn" onClick={afterParty}>Continue</button>
      </div>
    )
  }

  // step === 'note'
  const r = reply()
  return (
    <div className="reply-card" ref={card} key={step} data-dir={dir}>
      <Steps n={4} onBack={() => go(attending === 'yes' ? 'party' : 'attend')} />
      <h3 className="flow-title" tabIndex={-1}>A note for us</h3>
      <label htmlFor="note" className="body">
        Anything we should know? Dietary needs, a song request, or just a kind word. <span className="muted">(Optional)</span>
      </label>
      <textarea id="note" rows={4} placeholder="Write a note…" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="summary">
        <p className="label">YOUR REPLY</p>
        <p className="summary-text">{summary(r)}</p>
        <button type="button" className="link" onClick={() => go('attend')}>Edit</button>
      </div>
      {err}
      <button type="button" className="btn" onClick={send} disabled={sending}>
        {sending ? 'Sending…' : 'Send our reply'}
      </button>
      <p className="hint">Kindly reply on or before {WEDDING.replyBy}.</p>
    </div>
  )
}

// Animates the card's height as steps change, so the page doesn't jump.
export default function Rsvp() {
  const inner = useRef(null)
  const [height, setHeight] = useState()
  useEffect(() => {
    const el = inner.current
    if (!el || !('ResizeObserver' in window)) return
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div className="reply-shell" style={{ height }}>
      <div ref={inner}><Flow /></div>
    </div>
  )
}
