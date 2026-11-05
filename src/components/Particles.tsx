import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/** Canvas rendered inside #hero (portal) so legacy CSS (#particle-canvas absolute in hero) applies. */
export default function Particles() {
  const [host, setHost] = useState<HTMLElement | null>(null)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  useEffect(() => { setHost(document.getElementById('hero')) }, [])
  useEffect(() => {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let W = 0, H = 0, raf = 0
    const resize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener('resize', resize)
    const COLORS = ['rgba(201,162,39,', 'rgba(240,192,64,', 'rgba(217,94,10,', 'rgba(255,200,80,']
    const spawn = (bottom: boolean) => ({
      x: Math.random() * W, y: bottom ? H + 10 : Math.random() * H,
      r: Math.random() * 2.2 + 0.6, vx: (Math.random() - 0.5) * 0.4,
      vy: -(Math.random() * 0.55 + 0.15), op: Math.random() * 0.55 + 0.1,
      decay: Math.random() * 0.003 + 0.0008, col: COLORS[Math.floor(Math.random() * COLORS.length)],
    })
    const n = window.matchMedia('(max-width: 600px)').matches ? 22 : 60
    const pts = Array.from({ length: n }, () => spawn(false))
    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy; p.op -= p.decay
        if (p.op <= 0 || p.y < -10) Object.assign(p, spawn(true))
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.col + p.op + ')'; ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [canvas])
  if (!host) return null
  return createPortal(<canvas id="particle-canvas" ref={setCanvas} aria-hidden="true" />, host, 'particles')
}
