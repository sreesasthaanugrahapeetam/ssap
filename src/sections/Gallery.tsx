import { useEffect, useState } from 'react'
import { canLoad, driveImage, fetchSheet, getKV, type DriveImg, type KV } from '../lib/sheets'
import { openLightbox } from '../lib/lightbox'
import { useReveal } from '../hooks/useReveal'

const MAX_GALLERY = 60

type Entry = { thumb: string; full: string; alt: string; folder?: boolean }

const DEFAULTS: Entry[] = [
  'Manya Sri Ayyappa Indra Kumar Dev Guru Swamy',
  'Lord Ayyappa Swamy idol adorned with flowers',
  'Devotees performing Abhishekam pooja',
  'Lord Ayyappa Swamy decorated with flowers',
  'Guru Swamy at a devotional event',
  'Sree Sastha Anugraha Peetam official logo',
  'Mandala Kala Deeksha Poojas announcement',
].map((alt, i) => ({ thumb: `/assets/gallery-${i + 1}.jpg`, full: `/assets/gallery-${i + 1}.jpg`, alt }))

async function listFolder(id: string, cfg: KV): Promise<{ id: string; name: string }[]> {
  try {
    if (cfg.apps_script_url) {
      const r = await fetch(cfg.apps_script_url + (cfg.apps_script_url.includes('?') ? '&' : '?') + 'folder=' + encodeURIComponent(id))
      const j = await r.json()
      return (j.files || []).map((f: { id: string; name?: string }) => ({ id: f.id, name: f.name || '' }))
    }
    if (cfg.api_key) {
      const q = "'" + id + "' in parents and mimeType contains 'image/' and trashed=false"
      const url = 'https://www.googleapis.com/drive/v3/files?pageSize=100&orderBy=name&fields=files(id,name)&q=' + encodeURIComponent(q) + '&key=' + encodeURIComponent(cfg.api_key)
      const r = await fetch(url)
      const j = await r.json()
      return (j.files || []).map((f: { id: string; name?: string }) => ({ id: f.id, name: f.name || '' }))
    }
  } catch { /* ignore */ }
  return []
}

async function loadGallery(): Promise<Entry[] | null> {
  const rows = await fetchSheet('gallery')
  if (!rows || rows.length < 2) return null
  const head = rows[0].map(h => h.toLowerCase())
  const li = head.indexOf('link'), ci = head.indexOf('caption')
  if (li < 0) return null
  const cfg = await getKV('gallery_settings')

  let hadFolder = false
  const parts = await Promise.all(rows.slice(1).map(async (r): Promise<Entry[]> => {
    const v = (r[li] || '').trim()
    const caption = ci >= 0 ? (r[ci] || '') : ''
    const fm = v.match(/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([\w-]{20,})/i) || (/drive\.google\.com\/.*folders/i.test(v) ? v.match(/[?&]id=([\w-]{20,})/) : null)
    if (fm) {
      hadFolder = true
      const files = await listFolder(fm[1], cfg)
      return files.map(f => {
        const b = 'https://drive.google.com/thumbnail?id=' + f.id + '&sz=w'
        return { thumb: b + '800', full: b + '2000', alt: f.name.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' '), folder: true }
      })
    }
    const img: DriveImg | null = driveImage(v)
    return img ? [{ thumb: img.thumb, full: img.full, alt: caption }] : []
  }))

  let entries = parts.flat().slice(0, MAX_GALLERY)
  if (!entries.length) return null

  const singles = entries.filter(e => !e.folder)
  const firstFolder = entries.find(e => e.folder)
  const [okSingles, okFolder] = await Promise.all([
    Promise.all(singles.map(e => canLoad(e.thumb))),
    firstFolder ? canLoad(firstFolder.thumb) : Promise.resolve(false),
  ])
  const good = new Set(singles.filter((_, i) => okSingles[i]))
  entries = entries.filter(e => (e.folder ? okFolder : good.has(e)))
  if (!entries.length || (hadFolder && !entries.some(e => e.folder))) return null
  return entries
}

export default function Gallery() {
  const [entries, setEntries] = useState<Entry[]>(DEFAULTS)
  useReveal([entries])

  useEffect(() => {
    let live = true
    loadGallery().then(e => { if (live && e) setEntries(e) }).catch(() => {})
    return () => { live = false }
  }, [])

  const open = (i: number) =>
    openLightbox(entries.map(e => ({ src: e.full, type: 'image' as const, alt: e.alt || 'Gallery item' })), i)

  return (
    <section className="section section--alt" id="gallery">
      <div className="container">
        <header className="sec-head reveal">
          <span className="sec-icon" aria-hidden="true">📸</span>
          <h2 className="sec-en">Divine Gallery</h2>
          <div className="sec-te">దైవిక చిత్రాలు</div>
          <div className="sec-rule"></div>
        </header>

        <div className="gallery-grid reveal">
          {entries.map((e, i) => (
            <div
              className="gal-item" key={e.thumb + i} style={{ cursor: 'zoom-in' }} tabIndex={0} role="button" aria-label="View full size"
              onClick={() => open(i)}
              onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(i) } }}
            >
              <img src={e.thumb} alt={e.alt || 'Divine gallery photo'} loading="lazy" referrerPolicy="no-referrer" />
            </div>
          ))}
        </div>
        <p className="gal-note">✦ Divine moments from Sree Sastha Anugraha Peetam · More photos coming soon ✦</p>
      </div>
    </section>
  )
}
