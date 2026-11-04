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

/** Round, transparent-background PNG of the Peetam logo (the stored icon has a square dark backdrop). */
async function logoData(): Promise<string | null> {
  try {
    const blob = await (await fetch('/assets/logo.webp')).blob()
    const bmp = await createImageBitmap(blob)
    const N = 320, c = document.createElement('canvas')
    c.width = c.height = N
    const g = c.getContext('2d')!
    g.beginPath(); g.arc(N / 2, N / 2, N / 2, 0, Math.PI * 2); g.clip()
    const side = Math.min(bmp.width, bmp.height)
    g.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, N, N)
    return c.toDataURL('image/png')
  } catch {
    try {
      const b = await (await fetch('/assets/pwa-192.png')).blob()
      return await new Promise((res) => { const f = new FileReader(); f.onload = () => res(f.result as string); f.readAsDataURL(b) })
    } catch { return null }
  }
}

export function receiptData(db: DB, p: Payment): ReceiptData {
  const d = findDevotee(db, p.phone)
  return {
    no: receiptNo(p), date: p.date || '', name: d ? d.full_name : p.phone, gothram: d?.gothram || '', phone: fmtPhone(p.phone),
    type: p.type, serviceDate: p.service_date || '', session: p.session || '', amount: +p.amount || 0, mode: p.mode || '', note: p.note || '',
  }
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
const below100 = (n: number) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : ''))
const below1000 = (n: number) => (n >= 100 ? ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + below100(n % 100) : '') : below100(n))

/** Amount in words, Indian grouping: "Twelve Thousand Three Hundred Forty Five". */
export function amountWords(n: number): string {
  let x = Math.floor(Math.abs(Number(n) || 0))
  if (!x) return 'Zero'
  const parts: string[] = []
  for (const [div, name] of [[10000000, 'Crore'], [100000, 'Lakh'], [1000, 'Thousand']] as [number, string][]) {
    if (x >= div) { parts.push(below1000(Math.floor(x / div)) + ' ' + name); x %= div }
  }
  if (x) parts.push(below1000(x))
  return parts.join(' ')
}

/** 2026-11-04 -> 04/11/2026 */
export const dmy = (d: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : d || '' }

export const receiptTitle = (r: ReceiptData) => (r.type === 'Donation' ? 'Donation Receipt' : 'Payment Receipt')

/** Form-style lines shown on the receipt (page and PDF). Each row holds one full-width field or two side by side. */
export function receiptRows(r: ReceiptData): [string, string][][] {
  const towards = r.type + (r.serviceDate ? ' on ' + dmy(r.serviceDate) + (r.session ? ' (' + r.session + ')' : '') : '')
  const pair = [['Gothram', r.gothram], ['Phone', r.phone]].filter(([, v]) => v) as [string, string][]
  return [
    [['Received with thanks from', 'Sri ' + r.name]],
    ...(pair.length ? [pair] : []),
    [['Sum of Rupees', amountWords(r.amount) + ' Only']],
    [['Towards', towards + (r.note ? ' - ' + r.note : '')]],
    [['Mode of payment', r.mode || '-']],
  ]
}

/** Builds the receipt PDF: A5 landscape, laid out like a receipt-book page (jsPDF is loaded on demand). */
export async function buildReceiptPdf(r: ReceiptData): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'landscape' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const logo = await logoData()
  const INK: [number, number, number] = [35, 25, 20], MAROON: [number, number, number] = [110, 20, 20], GREY: [number, number, number] = [105, 95, 85]
  const alpha = (o: number) => doc.setGState(new (doc as unknown as { GState: new (x: { opacity: number }) => object }).GState({ opacity: o }) as never)

  // paper border, faint watermark, invocation
  doc.setDrawColor(...MAROON); doc.setLineWidth(0.7); doc.rect(6, 6, W - 12, H - 12)
  doc.setLineWidth(0.2); doc.rect(7.6, 7.6, W - 15.2, H - 15.2)
  if (logo) { alpha(0.07); doc.addImage(logo, 'PNG', W / 2 - 38, H / 2 - 36, 76, 76); alpha(1) }
  doc.setFont('times', 'italic'); doc.setFontSize(9); doc.setTextColor(...GREY)
  doc.text('|| Swamiye Saranam Ayyappa ||', W / 2, 13.5, { align: 'center' })

  // letterhead
  if (logo) doc.addImage(logo, 'PNG', 14, 16, 19, 19)
  doc.setTextColor(...MAROON); doc.setFont('times', 'bold'); doc.setFontSize(21)
  doc.text(ORG.toUpperCase(), W / 2 + 9, 25, { align: 'center' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GREY)
  doc.text('(' + TRUST_REG + ')', W / 2 + 9, 31, { align: 'center' })
  doc.setDrawColor(...MAROON); doc.setLineWidth(0.5); doc.line(13, 38, W - 13, 38)
  doc.setLineWidth(0.15); doc.line(13, 39, W - 13, 39)

  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...INK)
  doc.text(receiptTitle(r).toUpperCase(), W / 2, 46, { align: 'center', charSpace: 0.6 })
  doc.setFontSize(10)
  doc.text('No.  ', 13, 46); doc.setTextColor(...MAROON); doc.text(r.no, 22, 46)
  doc.setTextColor(...INK); doc.text('Date  ' + dmy(r.date), W - 13, 46, { align: 'right' })

  // fields
  let y = 57
  const field = (k: string, v: string, x0: number, x1: number) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GREY); doc.text(k + ' :', x0, y)
    const x = x0 + doc.getTextWidth(k + ' :') + 3
    doc.setFont('times', 'bold'); doc.setFontSize(12); doc.setTextColor(...INK)
    const lines = doc.splitTextToSize(v, x1 - x) as string[]
    doc.text(lines, x, y)
    const bottom = y + 1.6 + (lines.length - 1) * 5
    doc.setDrawColor(...GREY); doc.setLineWidth(0.1); doc.setLineDashPattern([0.6, 0.8], 0)
    doc.line(x, bottom, x1, bottom); doc.setLineDashPattern([], 0)
    return bottom
  }
  const rows = receiptRows(r)
  let lastY = y
  rows.forEach((row, i) => {
    const mid = (W - 26) / 2 + 13
    // the last row is short, so the seal can sit beside it instead of leaving a gap below
    const ends = row.length === 2
      ? [field(row[0][0], row[0][1], 13, mid - 5), field(row[1][0], row[1][1], mid + 5, W - 13)]
      : [field(row[0][0], row[0][1], 13, i === rows.length - 1 ? W - 13 - 50 : W - 13)]
    lastY = y
    y = Math.max(...ends) + 9.5
  })

  // amount, seal, footer
  const by = lastY + 8
  doc.setFillColor(250, 246, 236); doc.setDrawColor(...INK); doc.setLineWidth(0.5); doc.rect(13, by + 5, 52, 13, 'FD')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...GREY); doc.text('Rs.', 16, by + 13.2)
  doc.setFont('times', 'bold'); doc.setFontSize(18); doc.setTextColor(...INK)
  doc.text((Number(r.amount) || 0).toLocaleString('en-IN') + '/-', 62, by + 14, { align: 'right' })

  // round "PAID" seal
  const cx = W - 13 - 26, cy = lastY + 2.5
  doc.setDrawColor(...MAROON); doc.setTextColor(...MAROON); alpha(0.75)
  doc.setLineWidth(0.6); doc.circle(cx, cy, 9.5); doc.setLineWidth(0.2); doc.circle(cx, cy, 8.2)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text('PAID', cx, cy + 1, { align: 'center', charSpace: 0.4 })
  doc.setFontSize(5.5); doc.text('SSAP', cx, cy - 3.2, { align: 'center', charSpace: 0.6 }); doc.text(dmy(r.date), cx, cy + 5, { align: 'center' })
  alpha(1)

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...MAROON)
  doc.text('For ' + ORG, W - 13, by + 9, { align: 'right' })
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...GREY)
  doc.text('This is a computer generated receipt\nand does not require a signature.', W - 13, by + 14, { align: 'right', lineHeightFactor: 1.5 })
  return doc.output('blob')
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

/** Compact link: positional fields, no JSON keys, dates without dashes, phone reduced to its last 4 digits. */
const sq = (v: string) => (v || '').replace(/\|/g, ' ')
const day = (d: string) => (d || '').replace(/-/g, '')
const unday = (d: string) => (/^\d{8}$/.test(d) ? d.slice(0, 4) + '-' + d.slice(4, 6) + '-' + d.slice(6) : d)

/** Link anyone can open to view and download this receipt. Link path = receipt number (e.g. SSAP-2026-0001); the data after # carries only the last 4 phone digits. */
export function receiptLink(r: ReceiptData): string {
  const f = [r.no.replace(/^SSAP-/, ''), day(r.date), r.name, r.gothram, r.phone.replace(/\D/g, '').slice(-4), r.type, day(r.serviceDate), r.session, String(r.amount), r.mode, r.note].map(sq)
  while (f.length > 9 && !f[f.length - 1]) f.pop()
  return location.origin + '/receipt/' + r.no + '#c=' + b64.enc(f.join('|'))
}

function fromCompact(t: string): ReceiptData | null {
  const f = b64.dec(t).split('|')
  const amount = Number(f[8])
  if (f.length < 9 || !f[0] || !f[2] || !isFinite(amount) || amount <= 0) return null
  const s = (i: number) => (f[i] || '').slice(0, 200)
  return {
    no: 'SSAP-' + s(0), date: unday(s(1)), name: s(2), gothram: s(3), phone: s(4) ? '••••••' + s(4) : '', type: s(5),
    serviceDate: unday(s(6)), session: s(7), amount, mode: s(9), note: s(10),
  }
}

const STR: (keyof ReceiptData)[] = ['no', 'date', 'name', 'gothram', 'phone', 'type', 'serviceDate', 'session', 'mode', 'note']
export type LinkProblem = 'missing' | 'unreadable' | 'incomplete'

/**
 * Reads a receipt from a link. Looks in the fragment (#r=…) and, as a fallback, the query string (?r=…) in case an app
 * rewrote the link. Returns the receipt, or the reason it could not be read.
 */
export function readReceiptLinkDetailed(hash: string, search = ''): { data: ReceiptData } | { problem: LinkProblem } {
  const c = /(?:^[#?]|&)c=([^&\s]+)/.exec(hash) || /(?:^\?|&)c=([^&\s]+)/.exec(search)
  if (c) {
    try {
      let t = decodeURIComponent(c[1]).replace(/[^A-Za-z0-9_\-+/]/g, '')
      while (t.length % 4) t += '='
      const d = fromCompact(t.replace(/=+$/, ''))
      return d ? { data: d } : { problem: 'incomplete' }
    } catch { return { problem: 'unreadable' } }
  }
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

/** Ready-to-send WhatsApp message. WhatsApp styling: *bold*, _italic_, `monospace`. */
export function receiptMessage(r: ReceiptData): string {
  const what = r.type === 'Donation' ? 'donation' : r.type.toLowerCase() + ' payment'
  return [
    'Dear Sri *' + r.name + '*,',
    '',
    'Thank you for your ' + what + ' of *₹' + r.amount.toLocaleString('en-IN') + '/-* to *' + ORG.toUpperCase() + '*.',
    '',
    'Your payment has been received successfully.',
    '',
    'Please click the link below to download your ' + (r.type === 'Donation' ? 'donation' : 'payment') + ' receipt.',
    '`' + receiptLink(r) + '`',
    '',
    '_Swamiye Saranam Ayyappa_',
  ].join('\n')
}

export const receiptShare = (r: ReceiptData) => ({ title: 'Payment receipt ' + r.no, text: receiptMessage(r) })
