import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { driveImage, fetchSheet } from '../lib/sheets'
import { lightbox } from '../lib/lightbox'

type Def = {
  id: number
  kind: 'image' | 'video'
  caption: string
  src?: string
  click?: string
  poster?: string
  posterAlt?: string
  cover?: boolean
  embed?: string
}

function ytId(v: string) {
  const m = v.match(/^https?:\/\/(?:www\.|m\.|music\.)?(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/i)
  return m ? m[1] : null
}
function driveId(v: string) {
  const m = v.match(/drive\.google\.com\/.*?\/d\/([\w-]{20,})/i) || v.match(/(?:drive|docs)\.google\.com\/.*[?&]id=([\w-]{20,})/i)
  return m ? m[1] : (/^[\w-]{25,}$/.test(v) ? v : null)
}

async function loadDefs(tab: string, max: number): Promise<Def[]> {
  const rows = await fetchSheet(tab)
  if (!rows || rows.length < 2) return []
  const head = rows[0].map(h => h.trim().toLowerCase())
  const li = head.indexOf('link'), ci = head.indexOf('caption'), ui = head.indexOf('url'), ti = head.indexOf('type')
  if (li < 0) return []
  const defs: Def[] = []
  let n = 0
  rows.slice(1).forEach(r => {
    const v = (r[li] || '').trim()
    if (!v) return
    const caption = ci >= 0 ? (r[ci] || '').trim() : ''
    const click = ui >= 0 ? (r[ui] || '').trim() : ''
    const type = ti >= 0 ? (r[ti] || '').trim().toLowerCase() : ''
    const y = ytId(v)
    if (y) {
      defs.push({ id: n++, kind: 'video', caption, cover: true,
        poster: 'https://i.ytimg.com/vi/' + y + '/maxresdefault.jpg', posterAlt: 'https://i.ytimg.com/vi/' + y + '/hqdefault.jpg',
        embed: 'https://www.youtube-nocookie.com/embed/' + y + '?autoplay=1&rel=0&playsinline=1' })
      return
    }
    const d = driveId(v)
    if (d && type === 'video') {
      defs.push({ id: n++, kind: 'video', caption, poster: 'https://drive.google.com/thumbnail?id=' + d + '&sz=w1280', embed: 'https://drive.google.com/file/d/' + d + '/preview' })
      return
    }
    const img = driveImage(v)
    if (img) defs.push({ id: n++, kind: 'image', caption, src: img.thumb.replace(/(sz=w|=w)800$/, '$11280'), click: /^https?:\/\//i.test(click) ? click : '' })
  })
  return defs.slice(0, max)
}

// Arrow keys move whichever carousel is on screen (first registered wins).
type Reg = { inView: () => boolean; count: () => number; go: (d: number) => void }
const registry: Reg[] = []
let keysBound = false
function bindKeys() {
  if (keysBound) return
  keysBound = true
  document.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return
    const adEl = document.getElementById('ad-pop')
    if (lightbox.isOpen() || (adEl && adEl.classList.contains('open'))) return
    const t = e.target as HTMLElement | null
    const tag = t && t.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return
    const c = registry.find(x => x.inView() && x.count() > 1)
    if (!c) return
    e.preventDefault()
    c.go(e.key === 'ArrowRight' ? 1 : -1)
  })
}

type Props = {
  tab: string
  wrapId: string
  dotsId: string
  wrapClass?: string
  backdrop?: boolean
  max?: number
  /** Wait until this element is near the viewport before loading slides. */
  lazyRef?: RefObject<HTMLElement | null>
  /** Called with true once slides exist, false when none (or all failed). */
  onStatus?: (hasSlides: boolean) => void
}

export default function Carousel({ tab, wrapId, dotsId, wrapClass, backdrop, max = 12, lazyRef, onStatus }: Props) {
  const [defs, setDefs] = useState<Def[]>([])
  const [cur, setCur] = useState(0)
  const [loaded, setLoaded] = useState<Set<number>>(new Set())
  const [frameId, setFrameId] = useState<number | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const slideEls = useRef<Record<number, HTMLDivElement | null>>({})
  const hover = useRef(false)
  const inView = useRef(true)
  const engaged = useRef<number | null>(null)
  const dir = useRef(1)
  const snap = useRef(true)
  const prevCur = useRef(0)
  const statusRef = useRef(onStatus)
  statusRef.current = onStatus
  const n = defs.length
  const wide = typeof matchMedia === 'function' && matchMedia('(min-width: 641px)').matches
  const touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

  // Load the sheet (and wait for the section to be near the screen when lazy).
  useEffect(() => {
    let live = true
    ;(async () => {
      const d = await loadDefs(tab, max)
      if (!live || !d.length) return
      const el = lazyRef?.current
      if (el && 'IntersectionObserver' in window) {
        await new Promise<void>(res => {
          const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { io.disconnect(); res() } }, { rootMargin: '600px' })
          io.observe(el)
        })
      }
      if (live) setDefs(d)
    })().catch(() => {})
    return () => { live = false }
  }, [tab, max, lazyRef])

  useEffect(() => { statusRef.current?.(n > 0) }, [n])

  const go = (i: number, d?: number) => {
    if (!n) return
    const next = (i + n) % n
    dir.current = d ?? 1
    if (next === cur) snap.current = true
    setCur(next)
  }
  const goRef = useRef(go)
  goRef.current = go

  // Keep cur valid and preload current + next.
  useEffect(() => {
    if (!n) return
    if (cur >= n) { snap.current = true; setCur(0); return }
    setLoaded(prev => {
      const nx = new Set(prev)
      nx.add(defs[cur].id); nx.add(defs[(cur + 1) % n].id)
      return nx.size === prev.size ? prev : nx
    })
  }, [cur, defs, n])

  // Slide classes (kept imperative, mirrors the legacy transition choreography).
  useLayoutEffect(() => {
    if (!n) return
    const els = defs.map(d => slideEls.current[d.id])
    const old = prevCur.current
    const inc = els[cur]
    if (snap.current || old === cur || !inc) {
      els.forEach((el, k) => { if (!el) return; el.classList.add('noanim'); el.classList.toggle('on', k === cur); el.classList.remove('prev') })
      void wrapRef.current?.offsetWidth
      els.forEach(el => el && el.classList.remove('noanim'))
      snap.current = false
    } else {
      const out = els[old]
      inc.classList.add('noanim'); inc.classList.toggle('prev', dir.current < 0)
      void inc.offsetWidth
      inc.classList.remove('noanim')
      inc.classList.add('on'); inc.classList.remove('prev')
      if (out && out !== inc) { out.classList.remove('on'); out.classList.toggle('prev', dir.current > 0) }
    }
    prevCur.current = cur
    engaged.current = null
  }, [cur, defs, n])

  // Mount the video iframe shortly after arriving; drop others once off screen.
  useEffect(() => {
    if (!n || !defs[cur]) return
    const d = defs[cur]
    const t1 = d.kind === 'video' ? setTimeout(() => setFrameId(d.id), 350) : undefined
    const t2 = setTimeout(() => setFrameId(f => (f === d.id ? f : null)), 700)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [cur, defs, n])

  // has-frame is toggled imperatively so React never rewrites the slide className.
  useLayoutEffect(() => {
    defs.forEach(d => slideEls.current[d.id]?.classList.toggle('has-frame', frameId === d.id))
  }, [frameId, defs])

  // Iframe focus means the viewer is watching: stop autoplay on that slide.
  useEffect(() => {
    const onBlur = () => setTimeout(() => {
      const a = document.activeElement
      if (!a || a.tagName !== 'IFRAME') return
      const hit = defs.find(d => slideEls.current[d.id]?.contains(a))
      if (hit) engaged.current = hit.id
    }, 0)
    window.addEventListener('blur', onBlur)
    return () => window.removeEventListener('blur', onBlur)
  }, [defs])

  // Autoplay
  useEffect(() => {
    if (reduce || n < 2) return
    const d = defs[cur]
    if (touch && d && d.kind === 'video') return
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      timer = setTimeout(() => {
        if (hover.current || !inView.current || document.hidden || engaged.current === d?.id) return schedule()
        goRef.current(cur + 1, 1)
      }, d && d.kind === 'video' ? 10000 : 6000)
    }
    schedule()
    const onVis = () => { clearTimeout(timer); schedule() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', onVis) }
  }, [cur, defs, n, reduce, touch])

  // In-view tracking + keyboard registry
  useEffect(() => {
    const el = wrapRef.current?.parentElement
    let io: IntersectionObserver | undefined
    if (el && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(es => { inView.current = es[0].isIntersecting }, { threshold: 0.2 })
      io.observe(el)
    }
    const reg: Reg = { inView: () => inView.current, count: () => nRef.current, go: d => goRef.current(curRef.current + d, d) }
    registry.push(reg)
    bindKeys()
    return () => { io?.disconnect(); const k = registry.indexOf(reg); if (k >= 0) registry.splice(k, 1) }
  }, [])
  const nRef = useRef(n); nRef.current = n
  const curRef = useRef(cur); curRef.current = cur

  const drop = (id: number) => {
    snap.current = true
    setDefs(ds => ds.filter(d => d.id !== id))
  }

  const touchStart = useRef<{ x: number; y: number } | null>(null)

  if (!n) return <div className={'bn-wrap ' + (wrapClass || '')} id={wrapId} ref={wrapRef} hidden />

  return (
    <>
      <div
        className={'bn-wrap' + (wrapClass ? ' ' + wrapClass : '') + (n < 2 ? ' bn-single' : '')} id={wrapId} ref={wrapRef}
        onMouseEnter={() => { hover.current = true }}
        onMouseLeave={() => { hover.current = false }}
        onTouchStart={e => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }}
        onTouchEnd={e => {
          const s = touchStart.current
          if (!s) return
          touchStart.current = null
          const dx = e.changedTouches[0].clientX - s.x, dy = e.changedTouches[0].clientY - s.y
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? cur + 1 : cur - 1, dx < 0 ? 1 : -1)
        }}
      >
        <button className="bn-arrow bn-prev" type="button" aria-label="Previous slide" onClick={() => go(cur - 1, -1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4l-8 8 8 8" /></svg></button>
        <button className="bn-arrow bn-next" type="button" aria-label="Next slide" onClick={() => go(cur + 1, 1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8" /></svg></button>
        {defs.map((d, k) => {
          const imgSrc = loaded.has(d.id) ? (d.kind === 'video' ? d.poster : d.src) : undefined
          const img = (
            <img
              className={d.cover ? 'cover' : ''} src={imgSrc} alt={d.caption || (d.kind === 'video' ? 'Video' : 'Banner')}
              referrerPolicy="no-referrer" decoding="async"
              {...(k === 0 ? { fetchPriority: 'high' as const } : {})}
              onLoad={e => {
                if (!backdrop || !wide) return
                const bg = e.currentTarget.parentElement?.closest('.bn-slide')?.querySelector<HTMLImageElement>('img.bn-bg')
                if (bg) bg.src = e.currentTarget.currentSrc || e.currentTarget.src
              }}
              onError={e => {
                const im = e.currentTarget
                if (d.posterAlt && im.getAttribute('src') !== d.posterAlt) { im.src = d.posterAlt; return }
                drop(d.id)
              }}
            />
          )
          return (
            <div
              className="bn-slide" key={d.id} aria-hidden={k === cur ? 'false' : 'true'}
              ref={el => { slideEls.current[d.id] = el }}
            >
              {backdrop && <img className="bn-bg" alt="" aria-hidden="true" decoding="async" referrerPolicy="no-referrer" />}
              {d.kind === 'image' && d.click ? <a href={d.click} target="_blank" rel="noopener">{img}</a> : img}
              {d.caption && <div className="bn-cap">{d.caption}</div>}
              {frameId === d.id && d.embed && (
                <>
                  <iframe
                    src={d.embed.replace('autoplay=1', 'autoplay=0')} title={d.caption || 'Video'}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                  <div className="bn-swipe l" /><div className="bn-swipe r" />
                </>
              )}
            </div>
          )
        })}
      </div>
      <div className="bn-dots" id={dotsId}>
        {defs.map((d, k) => (
          <button key={d.id} type="button" className={k === cur ? 'on' : ''} aria-label={'Go to slide ' + (k + 1)} onClick={() => go(k, k < cur ? -1 : 1)} />
        ))}
      </div>
    </>
  )
}
