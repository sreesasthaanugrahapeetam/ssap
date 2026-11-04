import { useEffect, useRef, useSyncExternalStore } from 'react'
import { lightbox } from '../lib/lightbox'

const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='

export default function Lightbox() {
  const st = useSyncExternalStore(lightbox.subscribe, lightbox.getState)
  const root = useRef<HTMLDivElement>(null)
  const touchX = useRef(0)
  const it = st.items[st.index]
  const isVideo = !!it && it.type === 'video'

  useEffect(() => {
    if (!st.open) return
    document.body.style.overflow = 'hidden'
    root.current?.focus()
    return () => { document.body.style.overflow = '' }
  }, [st.open])

  useEffect(() => {
    if (!st.open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') lightbox.close()
      if (e.key === 'ArrowLeft') lightbox.go(-1)
      if (e.key === 'ArrowRight') lightbox.go(1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [st.open])

  return (
    <div
      id="lightbox" ref={root} role="dialog" aria-modal="true" aria-label="Photo viewer" hidden={!st.open} tabIndex={-1}
      onTouchStart={e => { touchX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 45) lightbox.go(dx < 0 ? 1 : -1)
      }}
    >
      <div className="lb-backdrop" id="lb-backdrop" onClick={() => lightbox.close()} />
      <button className="lb-close" id="lb-close" aria-label="Close" onClick={() => lightbox.close()}>×</button>
      <button className="lb-arrow" id="lb-prev" aria-label="Previous" onClick={e => { e.stopPropagation(); lightbox.go(-1) }}>&#8249;</button>
      <button className="lb-arrow" id="lb-next" aria-label="Next" onClick={e => { e.stopPropagation(); lightbox.go(1) }}>&#8250;</button>
      <div className="lb-frame">
        <img className="lb-img" id="lb-img" src={st.open && it && !isVideo ? it.src : BLANK} alt={it && !isVideo ? it.alt : ''} hidden={isVideo} />
        <video className="lb-video" id="lb-video" controls hidden={!isVideo} src={st.open && isVideo ? it.src : undefined} />
      </div>
      <div className="lb-counter" id="lb-counter" aria-live="polite">{st.items.length ? `${st.index + 1} of ${st.items.length}` : ''}</div>
    </div>
  )
}
