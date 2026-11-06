// Pure logic for the Annadanam schedule (ported from legacy/index.html lines 2532-3047).
import { type Row } from './sheets'

export const SCHEDULE_GID = '1208846177'
export const UPCOMING_DAYS = 5
// Web-app URL of the Google Apps Script that saves new donors into the sheet (see donor-form-apps-script.gs). Empty = the Add button stays hidden.
export const DONOR_FORM_URL: string = 'https://script.google.com/macros/s/AKfycbwbZklbOhQ1vbMOQSA8IvJkkpM4M4lq8tDPr7fAeWJLzqSsjbcg3Phe2ZPAAJ3swuJdiA/exec'

export const SLOTS: [string, number][] = [['Morning', 3], ['Afternoon', 4], ['Evening', 5]]
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const SLOT_KEYS: Record<string, number> = { morning: 1, afternoon: 1, evening: 1 }
export const REL: [string, string][] = [['Wife', 'సహధర్మచారిణి'], ['Husband', 'భర్త'], ['Son', 'కుమారుడు'], ['Daughter', 'కుమార్తె'], ['Father', 'తండ్రి'], ['Mother', 'తల్లి'], ['Brother', 'సోదరుడు'], ['Sister', 'సోదరి'], ['Other', '']]

export interface Donor {
  name_en: string; name_te: string; gothram_en: string; gothram_te: string
  family_en: string; family_te: string; photo: string
}
export type Donors = Record<string, Donor[]>
export interface Day { date: Date; day: string; cols: string[] }
export interface SlotItem { label: string; list: Donor[]; name: string; filled: boolean }
export interface PopInfo { date: Date; day: string; label: string; list: Donor[]; name: string; free: boolean }
export interface FamRow { id: number; rel: string; en: string; te: string }

const PAD = (n: number) => (n < 10 ? '0' : '') + n
export const dkey = (dt: Date) => dt.getUTCFullYear() + '-' + PAD(dt.getUTCMonth() + 1) + '-' + PAD(dt.getUTCDate())
export const fmtDate = (dt: Date) => dt.getUTCDate() + ' ' + MONTHS[dt.getUTCMonth()] + ' ' + dt.getUTCFullYear()

export function cleanName(v: string): string {
  if (!v) return ''
  const s = v.replace(/\(?\+?\d[\d\s-]{7,}\d\)?/g, '').replace(/\s+/g, ' ').trim()
  return /^[-–—\s]*$/.test(s) ? '' : s
}

export function istToday(): number {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(new Date())
  const g = (t: string) => p.find(x => x.type === t)!.value
  return Date.UTC(+g('year'), +g('month') - 1, +g('day'))
}

/** Rows of the "donors" tab -> map keyed "yyyy-mm-dd|slot". */
export function parseDonors(rows: Row[] | null): Donors {
  if (!rows || rows.length < 2) return {}
  const head = rows[0].map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
  const ix = (k: string) => head.indexOf(k)
  if (ix('date') < 0 || ix('slot') < 0) return {} // a missing tab returns the first tab, so check the headers
  const out: Donors = {}
  rows.slice(1).forEach(r => {
    const g = (k: string) => (ix(k) >= 0 ? (r[ix(k)] || '') : '').trim()
    if (/^(no|n|false|0|hide)$/i.test(g('show'))) return
    const raw = g('date')
    let m: RegExpExecArray | null
    let key = ''
    if ((m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(raw))) key = m[3] + '-' + PAD(+m[2]) + '-' + PAD(+m[1])
    else if ((m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(raw))) key = m[1] + '-' + PAD(+m[2]) + '-' + PAD(+m[3])
    const slot = g('slot').toLowerCase()
    if (!key || !SLOT_KEYS[slot]) return
    const d = {} as Donor
    ;(['name_en', 'name_te', 'gothram_en', 'gothram_te', 'family_en', 'family_te', 'photo'] as const).forEach(k => { d[k] = g(k) })
    if (!d.name_en && !d.name_te) return
    ;(out[key + '|' + slot] = out[key + '|' + slot] || []).push(d)
  })
  return out
}

export function photoURL(v: string): string {
  v = (v || '').trim()
  if (!v) return ''
  let m: RegExpMatchArray | null
  if (/google\.com\//i.test(v) && (m = v.match(/\/d\/([\w-]{20,})/) || v.match(/[?&]id=([\w-]{20,})/))) return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1000'
  if (/^[\w-]{25,}$/.test(v)) return 'https://drive.google.com/thumbnail?id=' + v + '&sz=w1000'
  if (/^https:\/\/lh3\.googleusercontent\.com\//i.test(v)) return v.replace(/=[wh]\d[\w-]*$|=s\d+[\w-]*$/i, '') + '=w1000'
  if (/^https:\/\/\S+\.(jpe?g|png|webp|gif)(\?\S*)?$/i.test(v)) return v
  return ''
}

export function parseFamily(str: string): [string, string][] {
  return (str || '').split(/[;\n]+/).map(p => p.trim()).filter(Boolean).map((p): [string, string] => {
    const i = p.indexOf(':')
    return i > 0 ? [p.slice(0, i).trim(), p.slice(i + 1).trim()] : ['', p]
  })
}

/** Schedule CSV text -> dated rows. */
export function parseSchedule(rows: Row[]): Day[] {
  const days: Day[] = []
  rows.forEach(cols => {
    const m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(cols[0] || '')
    if (!m) return
    days.push({ date: new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])), day: (cols[1] || '').replace(/^[-–—]+$/, ''), cols })
  })
  return days
}

/** Morning/Afternoon/Evening items for a day, or null when none is filled. */
export function slotsFor(d: Day, donors: Donors): SlotItem[] | null {
  const key = dkey(d.date)
  const items = SLOTS.map(([label, idx]) => {
    const list = donors[key + '|' + label.toLowerCase()] || []
    const name = cleanName(d.cols[idx]) || list.map(x => x.name_en || x.name_te).join(' · ')
    return { label, list, name, filled: !!name }
  })
  return items.some(it => it.filled) ? items : null
}

/** True when a donor or a schedule entry already holds this slot on this date ("yyyy-mm-dd"). */
export function slotTaken(dateKey: string, slot: string, days: Day[] | null, donors: Donors): boolean {
  if ((donors[dateKey + '|' + slot.toLowerCase()] || []).length) return true
  const idx = SLOTS.find(([l]) => l === slot)?.[1]
  if (idx === undefined) return false
  return (days || []).some(d => dkey(d.date) === dateKey && !!cleanName(d.cols[idx]))
}

export function famText(rows: FamRow[], lang: 'en' | 'te'): string {
  return rows.map(r => {
    const name = (lang === 'te' ? r.te : r.en).trim().replace(/[;:]+/g, ',')
    if (!name) return ''
    const rel = REL.find(p => p[0] === r.rel)
    return (lang === 'te' ? (rel && rel[1]) || r.rel : r.rel) + ': ' + name
  }).filter(Boolean).join('; ')
}

/** Downscale a photo to max 1000px and return base64 JPEG data. */
export function compress(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const u = URL.createObjectURL(file)
    const im = new Image()
    im.onload = () => {
      const k = Math.min(1, 1000 / Math.max(im.naturalWidth, im.naturalHeight))
      const c = document.createElement('canvas')
      c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k)
      c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height)
      URL.revokeObjectURL(u)
      res(c.toDataURL('image/jpeg', 0.82).split(',')[1])
    }
    im.onerror = () => rej(new Error('Could not read that photo.'))
    im.src = u
  })
}
