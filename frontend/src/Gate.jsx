import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Corner, Flourish } from './Doodles.jsx'

// The site is made for phones held upright.
// - touch screens in landscape (iPad, or a phone turned sideways): ask to rotate
// - mouse/trackpad screens wider than a phone: ask to open it on a phone
// Add ?preview to the URL to skip the gate (handy while editing on a laptop).
function detect() {
  try {
    if (new URLSearchParams(location.search).has('preview')) return null
  } catch { /* ignore */ }
  const coarse = matchMedia('(pointer: coarse)').matches
  const landscape = matchMedia('(orientation: landscape)').matches
  if (coarse && landscape) return 'rotate'
  if (!coarse && window.innerWidth > 700) return 'desktop'
  return null
}

export function useGate() {
  const [gate, setGate] = useState(detect)
  useEffect(() => {
    const update = () => setGate(detect())
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])
  return gate
}

function Qr() {
  const [src, setSrc] = useState('')
  useEffect(() => {
    const url = location.origin + location.pathname
    QRCode.toDataURL(url, { margin: 1, width: 360, color: { dark: '#4e1219', light: '#f6efe2' } })
      .then(setSrc)
      .catch(() => setSrc(''))
  }, [])
  return src ? <img className="gate-qr" src={src} width="180" height="180" alt="QR code linking to this page" /> : null
}

export default function Gate({ kind }) {
  return (
    <div className="gate">
      <div className="gate-card">
        <Corner className="c-tl" /><Corner className="c-tr" /><Corner className="c-bl" /><Corner className="c-br" />
        <p className="gate-names">Shane <span>&amp;</span> Zessa</p>
        <Flourish />
        {kind === 'rotate' ? (
          <>
            <svg className="gate-rotate" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="20" y="8" width="24" height="44" rx="4" />
              <path d="M29 46h6" />
              <path d="M52 22c4 6 4 14 0 20M52 42l-4-1M52 42l1-4" />
            </svg>
            <p className="gate-title">Kindly turn your device upright</p>
            <p className="gate-body">This invitation was made to be held like a letter.</p>
          </>
        ) : (
          <>
            <p className="gate-title">Kindly fetch your telephone</p>
            <p className="gate-body">This invitation was made for the little screen in your pocket. Scan this and we&rsquo;ll see you there.</p>
            <Qr />
          </>
        )}
      </div>
    </div>
  )
}
