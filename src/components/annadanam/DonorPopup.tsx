import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { DONOR_FORM_URL, dkey, fmtDate, parseFamily, photoURL, type Donor, type PopInfo } from '../../lib/annadanam'
import Svg from './Svg'
import { useModalLock } from './useModalLock'

const BASE = import.meta.env.BASE_URL
const reduceMotion = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

interface SlideDef { key: string; cls: string; node: ReactNode }

type FsDoc = Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void }
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => void }
const fsEl = () => document.fullscreenElement || (document as FsDoc).webkitFullscreenElement

function titleBlock(lang: 'en' | 'te', title?: string): ReactNode {
  return (
    <>
      <div className="ad-title">{title ?? (lang === 'te' ? 'మహాన్నదాత' : 'Maha Annadatha')}</div>
      <div className="ad-rule" />
    </>
  )
}

function detailSlide(key: string, lang: 'en' | 'te', d: Partial<Donor>): SlideDef {
  const pick = (k: 'name' | 'gothram' | 'family') => {
    const en = d[(k + '_en') as keyof Donor] || '', te = d[(k + '_te') as keyof Donor] || ''
    return (lang === 'te' ? te || en : en || te) || ''
  }
  const rows: [string, string][] = []
  const add = (k: string, v: string) => { if (v) rows.push([k, v]) }
  add(lang === 'te' ? 'స్వామి పేరు' : 'Swamy Name', pick('name'))
  add(lang === 'te' ? 'గోత్రం' : 'Gothram', pick('gothram'))
  parseFamily(pick('family')).forEach(p => add(p[0], p[1]))
  return {
    key, cls: 'ad-slide' + (lang === 'te' ? ' te' : ''),
    node: (
      <>
        {titleBlock(lang)}
        <div className="ad-rows">
          {rows.map(([k, v], i) => k
            ? [<div className="ad-k" key={i + 'k'}>{k}</div>, <div className="ad-v" key={i + 'v'}>{v}</div>]
            : <div className="ad-full" key={i}>{v}</div>)}
        </div>
      </>
    )
  }
}

function photoSlide(key: string, title: string, img: string, name: string, nameTe: string, blessing: string | undefined, onError: (k: string) => void): SlideDef {
  return {
    key, cls: 'ad-slide',
    node: (
      <>
        <div className="ad-title">{title}</div>
        <div className="ad-rule" />
        <div className="ad-photo-wrap">
          <img src={img} alt={name || ''} referrerPolicy="no-referrer" decoding="async" onError={() => onError(key)} />
        </div>
        {name && <div className="ad-cap">{name}{nameTe && <small>{nameTe}</small>}</div>}
        {blessing && <div className="ad-blessing">{blessing}</div>}
      </>
    )
  }
}

function guruSlide(onError: (k: string) => void): SlideDef {
  const en = document.querySelector('.pth-content h3'), te = document.querySelector('.pth-content .p-sub')
  return photoSlide('guru', 'Our Guru Swamy', BASE + 'assets/founder.webp',
    en ? (en.textContent || '').trim() : 'Manya Sri Ayyappa Indra Kumar Dev Guru Swamy', te ? (te.textContent || '').trim() : '',
    'Swamiye Saranam Ayyappa', onError)
}

function sponsorSlide(o: PopInfo, onClose: () => void, onAdd: (pre: { date: string; slot: string }) => void): SlideDef {
  const phones = Array.from(document.querySelectorAll<HTMLAnchorElement>('.contact-phones a')).map(a => ({ text: (a.textContent || '').trim(), href: a.getAttribute('href') || '' }))
  return {
    key: 'sponsor', cls: 'ad-slide',
    node: (
      <>
        <div className="ad-title">Sponsor This Annadanam</div>
        <div className="ad-sub">ఈ అన్నదాన సేవను చేయడానికి సంప్రదించండి</div>
        <div className="ad-rule" />
        <p className="ad-text">The {o.label} Annadanam on {fmtDate(o.date)} is open for sponsorship. Offering food is the highest seva — contact us to book this slot.</p>
        {phones.length > 0 && <div className="ad-phones">{phones.map((p, i) => <a key={i} href={p.href}>{p.text}</a>)}</div>}
        <div className="ad-actions">
          <a className="ad-contact" href="#contact" onClick={onClose}>Contact the Peetam</a>
          {DONOR_FORM_URL && (
            <button type="button" className="df-btn" onClick={() => { onClose(); onAdd({ date: dkey(o.date), slot: o.label }) }}>+ Add donor details for this slot</button>
          )}
        </div>
      </>
    )
  }
}

interface Props {
  info: PopInfo | null
  open: boolean
  onClose: () => void
  onAddDonor: (pre: { date: string; slot: string }) => void
}

export default function DonorPopup({ info, open, onClose, onAddDonor }: Props) {
  const popRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const navTimer = useRef<number | undefined>(undefined)
  const touch = useRef<{ x: number; y: number } | null>(null)

  const [failed, setFailed] = useState<string[]>([])
  const [cur, setCur] = useState(0)
  const [tick, setTick] = useState(0) // restarts the progress bar
  const [max, setMax] = useState(false)
  const [nativeFs, setNativeFs] = useState(false)
  const [paused, setPaused] = useState(false)
  const [navOn, setNavOn] = useState(false)
  const isFs = max || nativeFs

  useModalLock(open)

  const onPhotoError = useCallback((k: string) => setFailed(f => (f.includes(k) ? f : [...f, k])), [])

  const allSlides = useMemo<SlideDef[]>(() => {
    if (!info || !open) return []
    const s: SlideDef[] = []
    if (info.free) s.push(sponsorSlide(info, onClose, onAddDonor))
    else {
      if (info.list.length) info.list.forEach((d, i) => {
        if (d.name_en || d.gothram_en || d.family_en) s.push(detailSlide('en' + i, 'en', d))
        if (d.name_te || d.gothram_te || d.family_te) s.push(detailSlide('te' + i, 'te', d))
        const p = photoURL(d.photo)
        if (p) s.push(photoSlide('photo' + i, 'Maha Annadatha', p, d.name_en || d.name_te, d.name_en ? d.name_te : '', undefined, onPhotoError))
      })
      else s.push(detailSlide('only', 'en', { name_en: info.name }))
      s.push(guruSlide(onPhotoError))
    }
    return s
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info, open])
  const slides = allSlides.filter(s => !failed.includes(s.key))
  const n = slides.length
  const cn = n ? Math.min(cur, n - 1) : 0

  const show = useCallback((i: number) => {
    if (!n) return
    setCur(((i % n) + n) % n); setTick(t => t + 1)
  }, [n])

  // reset on each open
  useEffect(() => {
    if (!open) return
    setFailed([]); setCur(0); setTick(t => t + 1); setPaused(false); setMax(false)
    closeRef.current?.focus()
    showNav()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, info])

  // arrows fade out while the slides run and come back when the mouse moves over the popup
  function showNav() {
    setNavOn(true); clearTimeout(navTimer.current)
    navTimer.current = window.setTimeout(() => {
      if (!cardRef.current?.querySelector('.ad-nav:hover')) setNavOn(false)
    }, 2200)
  }
  useEffect(() => () => clearTimeout(navTimer.current), [])

  useEffect(() => {
    const sync = () => setNativeFs(!!fsEl())
    document.addEventListener('fullscreenchange', sync); document.addEventListener('webkitfullscreenchange', sync)
    const vis = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', vis)
    return () => {
      document.removeEventListener('fullscreenchange', sync); document.removeEventListener('webkitfullscreenchange', sync)
      document.removeEventListener('visibilitychange', vis)
    }
  }, [])
  useEffect(() => { if (isFs) setPaused(false) }, [isFs])

  function exitNative() {
    if (fsEl()) (document.exitFullscreen || (document as FsDoc).webkitExitFullscreen)!.call(document)
  }
  function toggleFs() {
    const pop = popRef.current as FsEl | null
    if (!pop) return
    if (isFs) { exitNative(); setMax(false); return }
    const r = pop.requestFullscreen || pop.webkitRequestFullscreen
    if (r) {
      try { const p = r.call(pop) as Promise<void> | undefined; if (p && p.catch) p.catch(() => setMax(true)) } catch { setMax(true) }
    } else setMax(true)
  }

  function close() {
    exitNative(); setMax(false); onClose()
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close() }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(cn + 1) }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(cn - 1) }
      else if (e.key === 'Tab') {
        const pop = popRef.current; if (!pop) return
        const f = Array.from(pop.querySelectorAll<HTMLElement>('button, a[href]')).filter(x => x.offsetParent && getComputedStyle(x).visibility !== 'hidden')
        if (!f.length) return
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cn, show])

  if (!info) return null

  const fsLabel = isFs ? 'Exit full screen' : 'Full screen'
  const cardCls = 'ad-card' + (n < 2 ? ' ad-single' : '') + (paused ? ' paused' : '') + (navOn ? ' nav-on' : '')

  return createPortal(
    <div id="ad-pop" ref={popRef} className={(open ? 'open' : '') + (max ? ' ad-max' : '')} role="dialog" aria-modal="true" aria-label="Annadanam details"
      onClick={e => { if (e.target === e.currentTarget) close() }}>
      <div className={cardCls} ref={cardRef}
        onMouseEnter={() => { if (!isFs) setPaused(true); showNav() }}
        onMouseMove={showNav}
        onMouseOver={e => { if (isFs) setPaused(!!(e.target as Element).closest('.ad-nav')) }}
        onMouseLeave={() => { setPaused(false); setNavOn(false) }}
        onTouchStart={e => { setPaused(true); showNav(); touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }}
        onTouchEnd={e => {
          setPaused(false)
          const t = touch.current; if (!t) return
          const dx = e.changedTouches[0].clientX - t.x, dy = e.changedTouches[0].clientY - t.y; touch.current = null
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(dx < 0 ? cn + 1 : cn - 1)
        }}>
        <button className="ad-close" type="button" aria-label="Close" ref={closeRef} onClick={close}><Svg d="M6 6l12 12M18 6L6 18" /></button>
        <button className={'ad-fs' + (isFs ? ' on' : '')} type="button" aria-label={fsLabel} title={fsLabel} onClick={toggleFs}>
          <Svg className="ic-exp" d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          <Svg className="ic-cmp" d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
        </button>
        <div className="ad-left">
          <img className="ad-logo" src={BASE + 'assets/logo.webp'} alt="" />
          <div className="ad-peetam-en">Sree Sastha Anugraha Peetam</div>
          <div className="ad-peetam-te">శ్రీ శాస్త్ర అనుగ్రహ పీఠం</div>
          <div className="ad-orn" aria-hidden="true">✦ ✦ ✦</div>
          <div className="ad-meal">{info.label.toUpperCase() + ' ANNADANAM'}</div>
          <div className="ad-when">{fmtDate(info.date) + (info.day ? ' · ' + info.day : '')}</div>
        </div>
        <div className="ad-right">
          <div className="ad-stage" aria-live="polite">
            {slides.map((s, k) => (
              <div key={s.key} className={s.cls + (k === cn ? ' on' : '')} aria-hidden={k === cn ? 'false' : 'true'}>{s.node}</div>
            ))}
          </div>
          <button className="ad-nav ad-prev" type="button" aria-label="Previous" onClick={() => show(cn - 1)}><Svg d="M15 4l-8 8 8 8" /></button>
          <button className="ad-nav ad-next" type="button" aria-label="Next" onClick={() => show(cn + 1)}><Svg d="M9 4l8 8-8 8" /></button>
          <div className="ad-dots">
            {slides.map((s, k) => (
              <button key={s.key} type="button" className={k === cn ? 'on' : ''} aria-label={'Go to slide ' + (k + 1)} onClick={() => show(k)} />
            ))}
          </div>
          <div className={'ad-bar' + (open && n > 1 && !reduceMotion ? ' run' : '')} key={tick} onAnimationEnd={() => show(cn + 1)}><i /></div>
        </div>
      </div>
    </div>,
    document.body
  )
}
