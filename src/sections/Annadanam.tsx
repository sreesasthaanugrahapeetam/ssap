import { useRef, useState } from 'react'
import Carousel from '../components/Carousel'
import { useSheetKV } from '../hooks/useSheet'
import { useReveal } from '../hooks/useReveal'

const SLOGAN = 'అన్నదాన ప్రభువే — The Lord of Sacred Feeding'
const DESC = 'Annadanam — the gift of food — is the highest form of seva. At Sree Sastha Anugraha Peetam, feeding devotees is an act of worshipping the Lord himself, for Ayyappa Swamy dwells in every soul that receives prasadam with gratitude.'

export default function Annadanam() {
  const kv = useSheetKV('annadanam')
  const [hasMedia, setHasMedia] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  useReveal([])

  const onStatus = (ok: boolean) => {
    if (ok) videoRef.current?.pause()
    setHasMedia(ok)
  }

  return (
    <section className="section section--alt" id="annadanam">
      <div className="container">
        <header className="sec-head reveal">
          <span className="sec-icon" aria-hidden="true">🍛</span>
          <h2 className="sec-en">Annadanam</h2>
          <div className="sec-te">అన్నదానం</div>
          <div className="sec-rule"></div>
        </header>

        <p className="anna-slogan">{kv.slogan || SLOGAN}</p>
        <p className="anna-desc">{kv.description || DESC}</p>

        <div className="anna-grid reveal" ref={gridRef}>
          <div className="anna-item" id="an-video" hidden={hasMedia}>
            <video ref={videoRef} src="/assets/annadanam.mp4" poster="/assets/annadanam-poster.webp" controls playsInline preload="none"></video>
          </div>
          <div className="an-media" id="an-media" hidden={!hasMedia}>
            <Carousel tab="annadanam_media" wrapId="an-wrap" dotsId="an-dots" wrapClass="bn-card" lazyRef={gridRef} onStatus={onStatus} />
          </div>
        </div>

        <div className="anna-cta reveal">
          <a href="#contact" className="btn-primary">📞 Book an Annadanam Slot</a>
          <a href="#donate" className="btn-primary btn-maroon">🙏 Sponsor Annadanam</a>
        </div>
        <p className="anna-note">To sponsor Annadanam on auspicious days, birthdays, anniversaries or any special occasion — contact us to reserve your slot. Every meal offered is a divine blessing.</p>
      </div>
    </section>
  )
}
