import { useEffect, useRef, useState } from 'react'

// Background music. It tries to start as soon as the page loads; phone browsers
// block sound until the guest touches the page, so in that case it starts on
// their first tap (usually "Open the invitation"). The button pauses and resumes.
export default function Music({ src }) {
  const audio = useRef(null)
  const [playing, setPlaying] = useState(false)
  // once the guest pauses it themselves, don't start it again on their next tap
  const paused = useRef(false)

  useEffect(() => {
    const el = audio.current
    if (!el) return
    el.volume = 0.6

    const start = (e) => {
      // the music button handles its own taps
      if (paused.current || !el.paused || e?.target?.closest?.('.music')) return
      el.play().then(cleanup, () => {})
    }
    const events = ['pointerdown', 'touchend', 'keydown']
    const cleanup = () => events.forEach((e) => document.removeEventListener(e, start, true))
    events.forEach((e) => document.addEventListener(e, start, true))
    start()

    // stop when the guest switches apps or tabs; carry on when they're back
    let wasPlaying = false
    const onVisibility = () => {
      if (document.hidden) {
        wasPlaying = !el.paused
        el.pause()
      } else if (wasPlaying) {
        el.play().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cleanup()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  function toggle() {
    const el = audio.current
    if (el.paused) {
      paused.current = false
      el.play().catch(() => {})
    } else {
      paused.current = true
      el.pause()
    }
  }

  return (
    <>
      <audio
        ref={audio}
        src={src}
        loop
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        className={playing ? 'music is-on' : 'music'}
        aria-label={playing ? 'Pause the music' : 'Play the music'}
        aria-pressed={playing}
        onClick={toggle}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V6l10-2v12" />
          <circle cx="6.5" cy="18" r="2.5" />
          <circle cx="16.5" cy="16" r="2.5" />
          {!playing && <path d="M3 3l18 18" />}
        </svg>
      </button>
    </>
  )
}
