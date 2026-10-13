import { useEffect, useRef, useState } from 'react'
import { asset, CONTACT_URL } from './wedding.js'
import { addToCalendar } from './ics.js'
import { ArrowRight, CalendarIcon, ChevronLeft, MessageIcon, SearchIcon } from './icons.jsx'

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

// Two screens: find your name and say if you can come, then who's coming and a note.
const ORDER = ['a', 'b', 'done']

const seatLine = (n) => (n === 1 ? 'We’ve saved a seat for you.' : `We’ve saved ${n} seats for you.`)
const ANSWERS = { yes: 'Yes, I’ll be there', no: 'Sorry, I can’t make it' }

function load() {
  try {
    return JSON.parse(localStorage.getItem(SAVED)) ?? null
  } catch {
    return null
  }
}

function summary(r) {
  if (r.attending === 'no') return 'Sorry, can’t make it'
  const names = r.names.filter(Boolean)
  return names.length > 1 ? `Yes, we’ll be there\n${names.join(', ')}` : 'Yes, we’ll be there'
}

function replyText(r, updated) {
  const lines = [`${updated ? 'Updated reply' : 'RSVP'} from ${r.name}: ${r.attending === 'yes' ? 'joyfully accepts' : 'regretfully declines'}.`]
  if (r.fullName) lines.push(`Complete name: ${r.fullName}`)
  if (r.attending === 'yes') lines.push(`Coming (${r.names.length}): ${r.names.join(', ')}`)
  if (r.note) lines.push(`Note: ${r.note}`)
  return lines.join('\n')
}

// Placeholder rows while the guest list answers.
function Skeleton() {
  return (
    <>
      <ul className="results skeleton" aria-hidden="true">
        <li><span style={{ width: 132 }} /><span style={{ width: 52 }} /></li>
        <li><span style={{ width: 96 }} /><span style={{ width: 52 }} /></li>
      </ul>
      <p className="sr-only" role="status">Looking for your name…</p>
    </>
  )
}

function Flow({ onPage }) {
  const [saved, setSaved] = useState(load)
  const [page, setPage] = useState(saved ? 'done' : 'a')
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

  // move focus to the new screen's heading so screen readers follow along
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    card.current?.querySelector('[data-focus]')?.focus({ preventScroll: true })
    const top = card.current?.getBoundingClientRect().top ?? 0
    // only scroll when the card's top has gone off screen
    if (top < 0) card.current.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [page])

  useEffect(() => onPage(page), [page, onPage])

  const go = (p) => {
    setError('')
    setDir(ORDER.indexOf(p) < ORDER.indexOf(page) ? 'back' : 'forward')
    setPage(p)
  }

  const typed = query.trim().length >= 2
  const { results, failed, done } = useGuestSearch(query, page === 'a' && !pick)
  const searching = typed && !pick && !done
  const seats = pick?.seats ?? 1
  const yes = attending === 'yes'

  function choose(g) {
    setPick(g)
    setQuery(g.name)
    setAttending('')
    setCount(1)
    setNames([])
    setFullName('')
    setError('')
  }

  function notYou() {
    setPick(null)
    setQuery('')
    setAttending('')
    setError('')
  }

  const reply = () => ({
    guest: { id: pick.id, name: pick.name, seats: pick.seats, sponsor: pick.sponsor },
    name: pick.name,
    attending,
    fullName: pick.sponsor && yes ? fullName.trim() : '',
    names: yes ? [pick.name, ...names.slice(0, count - 1).map((n) => (n ?? '').trim())] : [],
    note: note.trim(),
  })

  async function send() {
    if (sending) return
    if (yes && pick.sponsor && !fullName.trim()) return setError('Please write your full name.')
    if (yes) {
      const missing = Array.from({ length: count - 1 }, (_, i) => names[i]).findIndex((n) => !n?.trim())
      if (missing !== -1) return setError(`Please write Guest ${missing + 2}’s name.`)
    }
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
      notYou()
      return go('a')
    }
    setPick(g)
    setQuery(g.name)
    setAttending(r.attending)
    setCount(Math.max(1, r.names.length))
    setNames(r.names.slice(1))
    setFullName(r.fullName)
    setNote(r.note)
    go('a')
  }

  const err = error && <p className="form-error" role="alert">{error}</p>

  if (page === 'done' && saved) {
    const came = saved.attending === 'yes'
    return (
      <div className="reply-card thanks" ref={card} key={page} data-dir={dir}>
        <img className="thanks-seal" src={asset('photos/crest.webp')} width="320" height="320" alt="" />
        <h3 className="flow-title" tabIndex={-1} data-focus>Thank you, {saved.name}</h3>
        <p className="body">
          {came ? 'We’re so happy you’ll be there. See you on the 29th!' : 'We’ll miss you, and we’re grateful you let us know.'}
        </p>
        <div className="summary">
          <p className="label">YOUR REPLY</p>
          <p className="summary-text">{summary(saved)}</p>
        </div>
        {came && (
          <button type="button" className="btn btn-line" onClick={addToCalendar}>
            <CalendarIcon /> Add to my calendar
          </button>
        )}
        <button type="button" className="link" onClick={change}>Change my reply</button>
      </div>
    )
  }

  if (page === 'a') {
    const noMatch = typed && !pick && done && !failed && results.length === 0
    return (
      <div className="reply-card" ref={card} key={page} data-dir={dir}>
        <div className="reply-part">
          <label htmlFor="find" className="reply-q" tabIndex={-1} data-focus>Your name</label>
          <p className="reply-help">Type it the way it’s written on your invitation.</p>
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
                setAttending('')
              }}
            />
          </div>
          {searching && <Skeleton />}
          {!pick && results.length > 0 && (
            <ul className="results">
              {results.map((g) => (
                <li key={g.id}>
                  <button type="button" onClick={() => choose(g)}>
                    <span>{g.name}</span>
                    <span className="seats">That’s me</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {failed && <p className="form-error" role="alert">We couldn’t search the guest list just now. Please check your connection and try again.</p>}
          {noMatch && (
            <>
              <div className="notice">
                <p className="notice-title">We can’t find that name</p>
                <p>Try just your first name, or the name we usually call you. Still nothing? Send us a message and we’ll add you.</p>
              </div>
              <a className="btn btn-line" href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
                <MessageIcon /> Message Shane &amp; Zessa
              </a>
            </>
          )}
          {pick && (
            <div className="chip">
              <p>Hi, <strong>{pick.name}</strong>! {seatLine(seats)}</p>
              <button type="button" className="link" onClick={notYou}>Not you?</button>
            </div>
          )}
        </div>

        {pick && (
          <div className="reply-part reply-rule">
            <p className="reply-q" id="come-q">Can you come?</p>
            <div className="choices" role="radiogroup" aria-labelledby="come-q">
              {Object.entries(ANSWERS).map(([v, label]) => (
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
            {yes && (
              <div className="kids">
                <p className="kids-title">Named guests only</p>
                <p>Kindly note that only guests who have received this invitation link are invited. As seats are limited, we are unable to accommodate additional guests or plus-ones unless specifically named in the invitation.</p>
              </div>
            )}
          </div>
        )}

        {pick && attending && (
          <button type="button" className="btn" onClick={() => go('b')}>Continue <ArrowRight /></button>
        )}
      </div>
    )
  }

  // page === 'b'
  return (
    <div className="reply-card" ref={card} key={page} data-dir={dir}>
      <div className="recap">
        <button type="button" className="back" onClick={() => go('a')} aria-label="Back"><ChevronLeft /></button>
        <p tabIndex={-1} data-focus><strong>{pick.name}</strong> · {ANSWERS[attending]}</p>
      </div>

      {yes && (
        <div className="reply-part">
          <p className="reply-q">Who’s coming?</p>
          {pick.sponsor && (
            <div className="field">
              <label htmlFor="fullname">Your full name, for the programme</label>
              <input id="fullname" type="text" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
          )}
          {seats > 1 && (
            <>
              <div className="stepper">
                <span id="guests-label">How many of you, including you?</span>
                <div role="group" aria-labelledby="guests-label">
                  <button type="button" aria-label="One fewer" disabled={count <= 1} onClick={() => setCount(count - 1)}>−</button>
                  <span aria-live="polite" key={count} className="tick">{count}</span>
                  <button type="button" aria-label="One more" disabled={count >= seats} onClick={() => setCount(count + 1)}>+</button>
                </div>
              </div>
              {/* only mention the limit once they reach it */}
              {count >= seats && <p className="hint">That’s all {seats} of your seats. We can’t add more.</p>}
            </>
          )}
          <p className="fixed">{pick.name}</p>
          {Array.from({ length: count - 1 }, (_, i) => (
            <div className="field" key={i}>
              <label htmlFor={`guest-${i + 2}`}>Guest {i + 2}</label>
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
        </div>
      )}

      <div className={yes ? 'reply-part reply-rule' : 'reply-part'}>
        <label htmlFor="note" className="reply-q">A note for us <span className="muted">(optional)</span></label>
        <textarea id="note" rows={3} placeholder="Food allergies, a song you love, or just a kind word" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      {err}
      <button type="button" className="btn" onClick={send} disabled={sending} aria-busy={sending}>
        {sending && <span className="spinner" aria-hidden="true" />}
        {sending ? 'Sending…' : 'Send my reply'}
      </button>
    </div>
  )
}

// Animates the card's height as steps change, so the page doesn't jump.
// `head` (the "Will you join us?" card) is hidden once they've replied.
export default function Rsvp({ head }) {
  const [page, setPage] = useState(() => (load() ? 'done' : 'a'))
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
    <>
      {page !== 'done' && head}
      <div className="reply-shell" style={{ height }}>
        <div ref={inner}><Flow onPage={setPage} /></div>
      </div>
    </>
  )
}
