import { DB, Payment } from './types'
import { findDevotee, fmtPhone } from './utils'

/** Everything a receipt shows. Also the payload of a shareable receipt link. */
export interface ReceiptData {
  no: string; date: string; name: string; gothram: string; phone: string
  type: string; serviceDate: string; session: string; amount: number; mode: string; note: string
}

const ORG = 'Sree Sastha Anugraha Peetam'
export const TRUST_REG = 'Trust Reg. No. 11/2026'

export const receiptNo = (p: Payment) => 'SSAP-' + (p.date || '').slice(0, 4) + '-' + String(p.id ?? 0).padStart(4, '0')

const rupees = (n: number) => 'Rs. ' + (Number(n) || 0).toLocaleString('en-IN') + '/-'

async function logoData(): Promise<string | null> {
  try {
    const r = await fetch('/assets/pwa-192.png')
    const b = await r.blob()
    return await new Promise((res) => { const f = new FileReader(); f.onload = () => res(f.result as string); f.readAsDataURL(b) })
  } catch { return null }
}

export function receiptData(db: DB, p: Payment): ReceiptData {
  const d = findDevotee(db, p.phone)
  return {
    no: receiptNo(p), date: p.date || '', name: d ? d.full_name : p.phone, gothram: d?.gothram || '', phone: fmtPhone(p.phone),
    type: p.type, serviceDate: p.service_date || '', session: p.session || '', amount: +p.amount || 0, mode: p.mode || '', note: p.note || '',
  }
}

/** Builds the receipt PDF (jsPDF is loaded on demand). */
export async function buildReceiptPdf(r: ReceiptData): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a5' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const logo = await logoData()

  doc.setDrawColor(201, 162, 39); doc.setLineWidth(0.8); doc.rect(6, 6, W - 12, H - 12)
  if (logo) doc.addImage(logo, 'PNG', W / 2 - 10, 11, 20, 20)
  doc.setTextColor(90, 0, 0); doc.setFont('times', 'bold'); doc.setFontSize(17)
  doc.text(ORG, W / 2, 38, { align: 'center' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(110, 90, 70)
  doc.text(TRUST_REG, W / 2, 43.5, { align: 'center' })
  doc.setFontSize(10)
  doc.text('PAYMENT RECEIPT', W / 2, 49.5, { align: 'center' })
  doc.setDrawColor(236, 220, 184); doc.line(14, 53, W - 14, 53)

  const rows = receiptRows(r)
  let y = 63
  doc.setFontSize(11)
  rows.forEach(([k, v]) => {
    doc.setTextColor(110, 90, 70); doc.setFont('helvetica', 'normal'); doc.text(k, 16, y)
    doc.setTextColor(42, 21, 0); doc.setFont('helvetica', 'bold')
    const lines = doc.splitTextToSize(v, W - 80) as string[]
    doc.text(lines, 56, y)
    y += 7 * lines.length
  })

  y += 4
  doc.setFillColor(251, 239, 198); doc.roundedRect(16, y, W - 32, 16, 2, 2, 'F')
  doc.setTextColor(90, 0, 0); doc.setFontSize(13); doc.text('Amount received', 22, y + 10)
  doc.setFontSize(16); doc.text(rupees(r.amount), W - 22, y + 10.5, { align: 'right' })

  doc.setFont('helvetica', 'italic'); doc.setFontSize(10); doc.setTextColor(110, 90, 70)
  doc.text('Thank you. Swamiye Saranam Ayyappa.', W / 2, y + 32, { align: 'center' })
  doc.setFontSize(8); doc.text('This is a computer generated receipt.', W / 2, H - 12, { align: 'center' })
  return doc.output('blob')
}

/** Label/value rows shown on the receipt (page and PDF). */
export function receiptRows(r: ReceiptData): [string, string][] {
  return [
    ['Receipt no.', r.no],
    ['Date', r.date],
    ['Received from', r.name],
    ...(r.gothram ? [['Gothram', r.gothram] as [string, string]] : []),
    ...(r.phone ? [['Phone', r.phone] as [string, string]] : []),
    ['Towards', r.type + (r.serviceDate ? ' on ' + r.serviceDate + (r.session ? ' (' + r.session + ')' : '') : '')],
    ['Mode', r.mode || '-'],
    ...(r.note ? [['Note', r.note] as [string, string]] : []),
  ]
}

export async function downloadReceiptPdf(r: ReceiptData) {
  const blob = await buildReceiptPdf(r)
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = r.no + '.pdf'
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}

/* ───────── shareable link: the receipt travels inside the URL fragment, no server involved ───────── */
const b64 = {
  enc: (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))),
}
const maskPhone = (p: string) => (p ? p.slice(0, -4).replace(/\d/g, '•') + p.slice(-4) : '')

/** Link anyone can open to view and download this receipt. The phone number is masked in the link. */
export function receiptLink(r: ReceiptData): string {
  const { phone, ...rest } = r
  return location.origin + '/receipt#r=' + b64.enc(JSON.stringify({ ...rest, phone: maskPhone(phone) }))
}

const STR: (keyof ReceiptData)[] = ['no', 'date', 'name', 'gothram', 'phone', 'type', 'serviceDate', 'session', 'mode', 'note']
export type LinkProblem = 'missing' | 'unreadable' | 'incomplete'

/**
 * Reads a receipt from a link. Looks in the fragment (#r=…) and, as a fallback, the query string (?r=…) in case an app
 * rewrote the link. Returns the receipt, or the reason it could not be read.
 */
export function readReceiptLinkDetailed(hash: string, search = ''): { data: ReceiptData } | { problem: LinkProblem } {
  const m = /(?:^[#?]|&)r=([^&\s]+)/.exec(hash) || /(?:^\?|&)r=([^&\s]+)/.exec(search)
  if (!m) return { problem: 'missing' }
  let o: Record<string, unknown>
  try {
    let t = decodeURIComponent(m[1]).replace(/[^A-Za-z0-9_\-+/]/g, '')
    while (t.length % 4) t += '='
    o = JSON.parse(b64.dec(t.replace(/=+$/, '')))
  } catch { return { problem: 'unreadable' } }
  if (typeof o.amount !== 'number' || !isFinite(o.amount) || o.amount <= 0) return { problem: 'incomplete' }
  const out = { amount: o.amount } as ReceiptData
  for (const k of STR) (out as unknown as Record<string, string>)[k] = typeof o[k] === 'string' ? (o[k] as string).slice(0, 200) : ''
  return out.no && out.name ? { data: out } : { problem: 'incomplete' }
}

export const readReceiptLink = (hash: string, search = ''): ReceiptData | null => {
  const r = readReceiptLinkDetailed(hash, search)
  return 'data' in r ? r.data : null
}

export const receiptShare = (r: ReceiptData) => ({ title: 'Payment receipt ' + r.no, text: ORG + ' payment receipt', url: receiptLink(r) })
