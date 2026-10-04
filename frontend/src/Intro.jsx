import { useEffect, useRef } from 'react'

// Opening sequence, driven by scroll: the envelope stays pinned while the guest
// scrolls; the flap opens, the card rises, then it all fades into the page.
// Scrolling back up plays it in reverse.

const clamp01 = (n) => Math.min(1, Math.max(0, n))
const span = (p, a, b) => clamp01((p - a) / (b - a))
const ease = (t) => 1 - Math.pow(1 - t, 3)

export default function Intro({ names, date }) {
  const wrap = useRef(null)
  const stage = useRef(null)
  const env = useRef(null)
  const flap = useRef(null)
  const card = useRef(null)
  const hint = useRef(null)
  const seal = useRef(null)

  useEffect(() => {
    let frame = 0

    function render() {
      frame = 0
      const el = wrap.current
      if (!el) return
      const total = el.offsetHeight - window.innerHeight
      const p = clamp01(-el.getBoundingClientRect().top / total)

      const flapT = ease(span(p, 0.02, 0.3))
      const cardT = ease(span(p, 0.28, 0.62))
      const fadeT = span(p, 0.78, 0.98)

      const angle = flapT * Math.PI
      flap.current.style.transform = `rotateX(${flapT * 180}deg)`
      // once the flap is past upright it tucks behind the card
      flap.current.style.zIndex = flapT > 0.5 ? 1 : 6
      // the seal rides on the flap's tip
      seal.current.style.transform = `translate(-50%, -50%) translateY(${env.current.offsetHeight * 0.58 * (Math.cos(angle) - 1)}px) scale(${1 + Math.sin(angle) * 0.06})`
      seal.current.style.zIndex = flapT > 0.5 ? 2 : 7
      card.current.style.transform = `translateY(${-62 * cardT}%)`
      card.current.style.zIndex = cardT > 0 ? 4 : 2
      env.current.style.transform = `translateY(${18 * cardT}%) scale(${1 - 0.06 * fadeT})`
      stage.current.style.opacity = String(1 - fadeT)
      hint.current.style.opacity = String(1 - span(p, 0, 0.06))
    }

    const onScroll = () => { if (!frame) frame = requestAnimationFrame(render) }
    render()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <section className="intro-wrap" ref={wrap} aria-label={`${names[0]} and ${names[1]}, ${date}`}>
      <div className="intro-screen" ref={stage}>
        <div className="envelope" ref={env}>
          <div className="env-back" />
          <div className="env-card" ref={card}>
            <div className="env-card-rule">
              <p className="env-names">{names[0]}<span>&amp;</span>{names[1]}</p>
              <p className="env-date">{date}</p>
            </div>
          </div>
          <div className="env-pocket">
            <div className="env-side env-side-l" />
            <div className="env-side env-side-r" />
            <div className="env-bottom" />
          </div>
          <div className="env-flap" ref={flap}>
            <div className="env-flap-shape" />
          </div>
          <img className="env-seal" ref={seal} src={`${import.meta.env.BASE_URL}images/wax-seal.webp`} width="320" height="320" alt="" />
        </div>
        <div className="intro-hint" ref={hint} aria-hidden="true">
          <span>Scroll to open</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
        </div>
      </div>
    </section>
  )
}
