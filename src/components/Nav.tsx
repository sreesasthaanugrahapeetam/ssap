import { useEffect, useState } from 'react'
import { fetchSheet } from '../lib/sheets'

const esc = (x: string) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function tickerHTML(s: string) {
  const re = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>"]+)/g
  let out = '', last = 0, m: RegExpExecArray | null, href: string | null = null
  while ((m = re.exec(s))) {
    out += esc(s.slice(last, m.index))
    let label = m[1], url = m[2], tail = ''
    if (!url) { url = m[3].replace(/[.,;:!?)]+$/, ''); tail = m[3].slice(url.length); label = url }
    if (!href) href = url
    out += esc(label) + esc(tail)
    last = m.index + m[0].length
  }
  out += esc(s.slice(last))
  return href ? '<a class="tk-link" href="' + esc(href) + '" target="_blank" rel="noopener">' + out + '</a>' : out
}

const DEFAULT_TICKER = '✦ OM SRI Bhoothanatha Sadananda Sarva Bhootha Daya Para Raksha Raksha Maha Baho Sasthre Thubhyam Namo Namaha &nbsp;·&nbsp; SWAMIYE SARANAM AYYAPPA &nbsp;✦&nbsp;'

function readTheme(): 'dark' | 'light' {
  try { return localStorage.getItem('ssap-theme') === 'light' ? 'light' : 'dark' } catch { return 'dark' }
}

export default function Nav() {
  const [theme, setTheme] = useState<'dark' | 'light'>(readTheme)
  const [open, setOpen] = useState(false)
  const [ticker, setTicker] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('ssap-theme', theme) } catch { /* ignore */ }
  }, [theme])

  useEffect(() => {
    let live = true
    fetchSheet('ticker').then(rows => {
      if (!live || !rows || rows.length < 2) return
      const text = rows.slice(1).map(r => r[0]).filter(Boolean).map(tickerHTML).join(' &nbsp;·&nbsp; ')
      if (text) setTicker('✦ ' + text + ' &nbsp;✦&nbsp;')
    })
    return () => { live = false }
  }, [])

  const html1 = ticker ?? DEFAULT_TICKER
  const html2 = ticker ? ticker.replace(/<a /g, '<a tabindex="-1" ') : DEFAULT_TICKER
  const close = () => setOpen(false)

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <nav role="navigation" aria-label="Main navigation">
        <div className="nav-brand">
          <img src="/assets/logo.webp" alt="" className="nav-logo-img" aria-hidden="true" />
          <div className="nav-names">
            <span className="nav-en">Sree Sastha Anugraha Peetam</span>
            <span className="nav-te">శ్రీ శాస్త్ర అనుగ్రహ పీఠం</span>
          </div>
        </div>
        <ul className="nav-links" role="list">
          <li><a href="#peetadhipati">Swami</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#annadanam">Annadanam</a></li>
          <li><a href="#gallery">Gallery</a></li>
          <li><a href="#timings">Timings</a></li>
          <li><a href="#services">Poojas</a></li>
          <li><a className="t-gold-hi" href="#events">Events</a></li>
          <li><a className="t-gold-hi" href="#donate">Donate</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
        <button className="theme-toggle" id="theme-toggle" title="Toggle theme"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? '☀️' : '🌙'}</button>
        <button className="nav-ham" id="nav-ham" aria-label="Open menu" aria-expanded={open}
          onClick={() => setOpen(o => !o)}>{open ? '✕' : '☰'}</button>
      </nav>
      <ul className="nav-drawer" id="nav-drawer" role="list" hidden={!open}>
        <li><a href="#peetadhipati" onClick={close}>Our Guru Swamy</a></li>
        <li><a href="#about" onClick={close}>About the Peetam</a></li>
        <li><a href="#annadanam" onClick={close}>Annadanam</a></li>
        <li><a href="#gallery" onClick={close}>Gallery</a></li>
        <li><a href="#timings" onClick={close}>Darshan Timings</a></li>
        <li><a href="#services" onClick={close}>Poojas &amp; Sevas</a></li>
        <li><a className="t-gold-hi" href="#events" onClick={close}>Upcoming Events</a></li>
        <li><a className="t-gold-hi" href="#donate" onClick={close}>Donate</a></li>
        <li><a href="#contact" onClick={close}>Contact</a></li>
      </ul>
      <div className="ticker" aria-label="Devotional mantra">
        <div className="ticker-inner">
          <span className="ticker-text" dangerouslySetInnerHTML={{ __html: html1 }} />
          <span className="ticker-text" aria-hidden="true" dangerouslySetInnerHTML={{ __html: html2 }} />
        </div>
      </div>
    </>
  )
}
