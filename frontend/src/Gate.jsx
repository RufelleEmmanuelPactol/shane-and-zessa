import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { asset, WEDDING } from './wedding.js'
import { Monogram } from './icons.jsx'

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
    QRCode.toDataURL(url, { margin: 1, width: 440, color: { dark: '#621828', light: '#f6eee3' } })
      .then(setSrc)
      .catch(() => setSrc(''))
  }, [])
  return (
    <div className="gate-qr">
      {src && <img src={src} width="220" height="220" alt="QR code linking to this page" />}
    </div>
  )
}

// Wide screens: the cover photo on the left, the note and QR code on the right.
export default function Gate({ kind }) {
  return (
    <div className="gate">
      <div className="gate-photo">
        {/* same stage as the phone cover, so "You are Invited" sits behind the couple */}
        <div className="gate-stage">
          <img className="cover-photo" src={asset('web/cover-guitar.webp')} width="3000" height="2000"
            alt="Shane playing guitar while Zessa, in a burgundy dress, leans on a branch and smiles at him" />
          <p className="gate-script" aria-hidden="true"><span>You are</span><span>Invited</span></p>
          <img className="cover-photo cover-cutout" src={asset('web/cover-cutout.webp')} width="3000" height="2000" alt="" />
        </div>
        <p className="gate-date"><span />{WEDDING.dateShort}<span /></p>
      </div>

      <div className="gate-panel">
        <div className="gate-card">
          <Monogram className="gate-crest" />
          <p className="gate-names names">Shane <span>&amp;</span> Zessa</p>
          <span className="rule" />
          {kind === 'rotate' ? (
            <>
              <svg className="gate-rotate" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="20" y="8" width="24" height="44" rx="4" />
                <path d="M29 46h6" />
                <path d="M52 22c4 6 4 14 0 20M52 42l-4-1M52 42l1-4" />
              </svg>
              <h1 className="gate-title">Kindly turn your device upright</h1>
              <p className="gate-body">This invitation was made to be held like a letter.</p>
            </>
          ) : (
            <>
              <h1 className="gate-title">Kindly open this on your phone</h1>
              <p className="gate-body">This invitation was made for the little screen in your pocket. Point your phone’s camera at the code and we’ll see you there.</p>
              <Qr />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
