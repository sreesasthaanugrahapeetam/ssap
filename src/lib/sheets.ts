// Shared Google Sheets CMS helpers (ported from legacy/index.html lines 1993-2090).
export const SHEET_ID = '1mxb4kGg-ejyya9PrxxOnTXqN7LkUMUV6CA5wJ6ecClA'
export const ANNADANAM_SHEET_ID = '1Q_EkgF5QhDgx7ndO2-1nXOSLC8iuhlLJeEblwh8i-AI'

export type Row = string[]
export type KV = Record<string, string>
export type DriveImg = { thumb: string; full: string }

export function parseCSV(text: string): Row[] {
  const rows: Row[] = []
  let row: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++ } else inQ = false
      } else cur += c
    } else if (c === '"') inQ = true
    else if (c === ',') { row.push(cur.trim()); cur = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cur.trim()); cur = ''
      if (row.some(Boolean)) rows.push(row)
      row = []
    } else cur += c
  }
  row.push(cur.trim())
  if (row.some(Boolean)) rows.push(row)
  return rows
}

const caches: Record<string, Promise<Row[] | null>> = {}

/** Fetch one tab of a Google Sheet as rows (header row included). Cached per sheet+tab. Null on failure. */
export function fetchSheet(name: string, sheetId: string = SHEET_ID): Promise<Row[] | null> {
  const key = sheetId + '::' + name
  if (!caches[key]) {
    const base = 'https://docs.google.com/spreadsheets/d/' + sheetId + '/gviz/tq?tqx=out:csv&headers=1&sheet='
    caches[key] = (async () => {
      try {
        const r = await fetch(base + encodeURIComponent(name))
        if (!r.ok) return null
        return parseCSV(await r.text())
      } catch {
        return null
      }
    })()
  }
  return caches[key]
}

/** Two-column key/value tab -> object. */
export async function getKV(name: string, sheetId: string = SHEET_ID): Promise<KV> {
  const rows = await fetchSheet(name, sheetId)
  if (!rows || rows.length < 2) return {}
  const map: KV = {}
  rows.slice(1).forEach(r => { if (r[0]) map[r[0].trim()] = r[1] !== undefined ? r[1] : '' })
  return map
}

export function driveImage(v: string): DriveImg | null {
  v = (v || '').trim()
  if (!v) return null
  let id: string | null = null
  if (/^https?:\/\/(drive|docs)\.google\.com\//i.test(v)) {
    if (/\/folders\//.test(v)) return null
    const m = v.match(/\/d\/([\w-]{20,})/) || v.match(/[?&]id=([\w-]{20,})/)
    if (m) id = m[1]
  } else if (/^[\w-]{25,}$/.test(v)) {
    id = v
  } else if (/^https:\/\/lh3\.googleusercontent\.com\//i.test(v)) {
    const b = v.replace(/=[wh]\d[\w-]*$|=s\d+[\w-]*$/i, '')
    return { thumb: b + '=w800', full: b + '=w2000' }
  } else if (/^https:\/\/\S+\.(jpe?g|png|webp|gif)(\?\S*)?$/i.test(v)) {
    return { thumb: v, full: v }
  }
  if (!id) return null
  const base = 'https://drive.google.com/thumbnail?id=' + id + '&sz=w'
  return { thumb: base + '800', full: base + '2000' }
}

export function canLoad(url: string): Promise<boolean> {
  return new Promise(resolve => {
    const im = new Image()
    const timer = setTimeout(() => resolve(false), 12000)
    im.onload = () => { clearTimeout(timer); resolve(im.naturalWidth > 0) }
    im.onerror = () => { clearTimeout(timer); resolve(false) }
    im.referrerPolicy = 'no-referrer'
    im.src = url
  })
}

/** React hook helper data fetch: see src/hooks/useSheet.ts */
