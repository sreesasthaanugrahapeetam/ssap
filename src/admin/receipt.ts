import { DB, Payment } from './types'
import { findDevotee, fmtPhone } from './utils'

const ORG = 'Sree Sastha Anugraha Peetam'

export const receiptNo = (p: Payment) => 'SSAP-' + (p.date || '').slice(0, 4) + '-' + String(p.id ?? 0).padStart(4, '0')
const fileName = (p: Payment) => receiptNo(p) + '.pdf'

const rupees = (n: number) => 'Rs. ' + (Number(n) || 0).toLocaleString('en-IN') + '/-'

async function logoData(): Promise<string | null> {
  try {
    const r = await fetch('/assets/pwa-192.png')
    const b = await r.blob()
    return await new Promise((res) => { const f = new FileReader(); f.onload = () => res(f.result as string); f.readAsDataURL(b) })
  } catch { return null }
}

/** Builds a payment receipt PDF (jsPDF is loaded on demand). Only Paid payments get a receipt. */
export async function buildReceipt(db: DB, p: Payment): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const d = findDevotee(db, p.phone)
  const doc = new jsPDF({ unit: 'mm', format: 'a5' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const logo = await logoData()

  doc.setDrawColor(201, 162, 39); doc.setLineWidth(0.8); doc.rect(6, 6, W - 12, H - 12)
  if (logo) doc.addImage(logo, 'PNG', W / 2 - 10, 11, 20, 20)
  doc.setTextColor(90, 0, 0); doc.setFont('times', 'bold'); doc.setFontSize(17)
  doc.text(ORG, W / 2, 38, { align: 'center' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(110, 90, 70)
  doc.text('PAYMENT RECEIPT', W / 2, 44, { align: 'center' })
  doc.setDrawColor(236, 220, 184); doc.line(14, 48, W - 14, 48)

  const rows: [string, string][] = [
    ['Receipt no.', receiptNo(p)],
    ['Date', p.date || ''],
    ['Received from', d ? d.full_name : p.phone],
    ...(d?.gothram ? [['Gothram', d.gothram] as [string, string]] : []),
    ['Phone', fmtPhone(p.phone)],
    ['Towards', p.type + (p.service_date ? ' on ' + p.service_date + (p.session ? ' (' + p.session + ')' : '') : '')],
    ['Mode', p.mode || '-'],
    ...(p.note ? [['Note', p.note] as [string, string]] : []),
  ]
  let y = 58
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
  doc.setFontSize(16); doc.text(rupees(p.amount), W - 22, y + 10.5, { align: 'right' })

  doc.setFont('helvetica', 'italic'); doc.setFontSize(10); doc.setTextColor(110, 90, 70)
  doc.text('Thank you. Swamiye Saranam Ayyappa.', W / 2, y + 32, { align: 'center' })
  doc.setFontSize(8); doc.text('This is a computer generated receipt.', W / 2, H - 12, { align: 'center' })
  return doc.output('blob')
}

export async function downloadReceipt(db: DB, p: Payment) {
  const blob = await buildReceipt(db, p)
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = fileName(p)
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}

/** Opens the device share sheet with the PDF attached (WhatsApp, mail…). Returns false if sharing is not supported. */
export async function shareReceipt(db: DB, p: Payment): Promise<boolean> {
  const file = new File([await buildReceipt(db, p)], fileName(p), { type: 'application/pdf' })
  if (!navigator.canShare?.({ files: [file] })) return false
  try {
    await navigator.share({ files: [file], title: 'Payment receipt ' + receiptNo(p), text: ORG + ' payment receipt' })
  } catch (e) { if ((e as Error).name !== 'AbortError') throw e }
  return true
}
