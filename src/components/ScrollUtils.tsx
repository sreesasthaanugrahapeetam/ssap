import { useEffect, useRef } from 'react'

export default function ScrollUtils() {
  const bar = useRef<HTMLDivElement>(null)
  const btn = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const onScroll = () => {
      const s = document.documentElement
      const y = window.scrollY || window.pageYOffset || s.scrollTop || 0
      const max = (s.scrollHeight - window.innerHeight) || 1
      const pct = Math.min(100, (y / max) * 100)
      if (bar.current) bar.current.style.width = pct + '%'
      btn.current?.classList.toggle('show', y > 400)
      const ring = btn.current?.querySelector<SVGCircleElement>('.bt-ring circle')
      if (ring) ring.style.strokeDashoffset = String(144.5 * (1 - pct / 100))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <>
      <div id="scroll-bar" ref={bar} aria-hidden="true" />
      <button id="back-top" ref={btn} type="button" aria-label="Back to top" title="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <svg className="bt-ring" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="23" pathLength="144.5" /></svg>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
      </button>
    </>
  )
}
