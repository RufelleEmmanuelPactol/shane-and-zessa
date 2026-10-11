import { useEffect, useRef, useState } from 'react'
import { CONTACT_URL, GUESTS, WEDDING } from './wedding.js'
import { addToCalendar } from './ics.js'
import { CalendarIcon, ChevronLeft, MessageIcon, SearchIcon } from './icons.jsx'

// Replies go to the Django backend only when it's switched on. Until then each
// reply is kept on the guest's phone and they send it to us with the share sheet.
const API_ON = import.meta.env.VITE_RSVP === 'on'
const SAVED = 'sz-rsvp'

const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

function search(query) {
  const q = fold(query)
  if (q.length < 2) return []
  return GUESTS.filter((g) => [g.name, ...(g.aka ?? [])].some((n) => fold(n).includes(q)))
}

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

function replyText(r) {
  const lines = [`RSVP from ${r.name}: ${r.attending === 'yes' ? 'joyfully accepts' : 'regretfully declines'}.`]
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

export default function Rsvp() {
  const [saved, setSaved] = useState(load)
  const [step, setStep] = useState(saved ? 'done' : 'find')
  const [query, setQuery] = useState('')
  const [pick, setPick] = useState(null)
  const [attending, setAttending] = useState('')
  const [count, setCount] = useState(1)
  const [names, setNames] = useState([])
  const [fullName, setFullName] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [shared, setShared] = useState('')
  const card = useRef(null)
  const first = useRef(true)

  // move focus to the new step's heading so screen readers follow along
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    card.current?.querySelector('h3')?.focus()
    card.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [step])

  const go = (s) => {
    setError('')
    setStep(s)
  }

  const results = search(query)
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
    if (API_ON) {
      try {
        const res = await fetch('/api/rsvp/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: r.fullName || r.name,
            attending: r.attending,
            guests: r.names.length,
            message: replyText(r),
          }),
        })
        if (!res.ok) throw new Error()
      } catch {
        setSending(false)
        return setError('We couldn’t send that just now. Please try again in a moment.')
      }
    }
    try {
      localStorage.setItem(SAVED, JSON.stringify(r))
    } catch { /* private mode: keep it in memory only */ }
    setSaved(r)
    setSending(false)
    setShared('')
    go('done')
  }

  async function shareReply() {
    const text = replyText(saved)
    try {
      if (navigator.share) {
        await navigator.share({ text })
        return setShared('Thank you, we’ll see it there.')
      }
      await navigator.clipboard.writeText(text)
      setShared('Copied. Paste it into a message to us.')
      window.open(CONTACT_URL, '_blank', 'noopener')
    } catch {
      /* the guest closed the share sheet */
    }
  }

  function change() {
    const r = saved
    const g = GUESTS.find((x) => x.name === r.name)
    if (!g) {
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
      <div className="reply-card thanks" ref={card}>
        <img className="thanks-seal" src={`${import.meta.env.BASE_URL}images/wax-seal.webp`} width="320" height="320" alt="" />
        <h3 className="flow-title" tabIndex={-1}>Thank you, {saved.name}</h3>
        <p className="body">
          {yes ? 'We’re so happy you’ll be there. See you on the 29th.' : 'We’ll miss you, and we’re grateful you let us know.'}
        </p>
        <div className="summary">
          <p className="label">YOUR REPLY</p>
          <p className="summary-text">{summary(saved)}</p>
        </div>
        {!API_ON && (
          <>
            <p className="body small">One last step: send your reply to us so it reaches our list.</p>
            <button type="button" className="btn" onClick={shareReply}>
              <MessageIcon /> Send it to Shane &amp; Zessa
            </button>
            {shared && <p className="body small" role="status">{shared}</p>}
          </>
        )}
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
    const noMatch = query.trim().length >= 2 && results.length === 0
    return (
      <div className="reply-card" ref={card}>
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
              <li key={g.name}>
                <button type="button" onClick={() => choose(g)}>
                  <span>{g.name}</span>
                  <span className="seats">{seatsText(g.seats)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
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
      <div className="reply-card" ref={card}>
        <Steps n={2} onBack={() => go('find')} />
        <p className="chip">
          Hi, <strong>{pick.name}</strong>! {seats === 1 ? 'We’ve saved a seat for you.' : `We’ve saved ${seats} seats for your party.`}
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
      <div className="reply-card" ref={card}>
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
                <span aria-live="polite">{count}</span>
                <button type="button" aria-label="One more guest" disabled={count >= seats} onClick={() => setCount(count + 1)}>+</button>
              </div>
            </div>
            <p className="hint">Your invitation has {seats} seats.</p>
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

        <p className="kids">To keep the ceremony solemn, we kindly ask that any children who attend stay quiet and well-behaved throughout.</p>
        {err}
        <button type="button" className="btn" onClick={afterParty}>Continue</button>
      </div>
    )
  }

  // step === 'note'
  const r = reply()
  return (
    <div className="reply-card" ref={card}>
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
