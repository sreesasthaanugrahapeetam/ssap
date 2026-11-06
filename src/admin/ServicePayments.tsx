import { useState } from 'react'
import { useAdmin } from './AdminContext'
import { Field, rowOpen } from './ui'
import { MAINTENANCE_AMOUNT, Payment, SVC_TYPES, sessionsFor } from './types'
import { devoteeLabel, findDevotee, money, todayISO } from './utils'
import { Select, SelectOther } from './Select'
import { downloadReceiptPdf, receiptData, receiptShare } from './receipt'
import { useShare } from './useShare'

/** Receipt buttons for a Paid payment: download the PDF, or share a link anyone can open to view / download it. */
function ReceiptButtons({ p }: { p: Payment }) {
  const { db, toast } = useAdmin()
  const share = useShare()
  if (p.status !== 'Paid') return null
  const fail = () => toast('Could not create receipt')
  /** Opens WhatsApp chat with the devotee's number and the message filled in; falls back to the share sheet without a number. */
  const sendWhatsApp = (x: Payment) => {
    const msg = receiptShare(receiptData(db, x))
    const num = (x.phone || '').replace(/\D/g, '')
    if (num.length >= 11) window.open('https://wa.me/' + num + '?text=' + encodeURIComponent(msg.text), '_blank', 'noopener')
    else share(msg, 'Receipt message copied')
  }
  return (
    <>
      <button className="btn sec sm" aria-label="Download receipt PDF" onClick={() => downloadReceiptPdf(receiptData(db, p)).catch(fail)}>⬇ Receipt</button>{' '}
      <button className="btn sec sm" aria-label="Share receipt message" onClick={() => sendWhatsApp(p)}>Share</button>{' '}
    </>
  )
}

/** Edit form for one payment (by index). Linked Annadanam / Alpaharam / pooja payments keep their date and session on the activity. */
export function PaymentEditor({ index, onDone }: { index: number; onDone: () => void }) {
  const { db, update, toast, confirm, go } = useAdmin()
  const p = db.payments[index]
  const [f, setF] = useState(() => ({ type: p?.type ?? '', amount: String(p?.amount ?? ''), status: p?.status ?? 'Pending', mode: p?.mode || 'UPI', date: p?.date || todayISO(), note: p?.note ?? '' }))
  if (!p) return null
  const linked = db.poojas.find((x) => x.id === p.pooja_id)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    const a = +f.amount
    if (!f.type.trim()) { toast('Enter what the payment is for'); return }
    if (!(a > 0)) { toast('Enter a valid amount'); return }
    if (f.status === 'Paid' && !f.date) { toast('Pick the paid date'); return }
    update((d) => {
      Object.assign(d.payments[index], {
        type: f.type.trim(), amount: a, status: f.status, note: f.note.trim(),
        mode: f.status === 'Paid' ? f.mode : '', date: f.status === 'Paid' ? f.date : '',
      })
      const act = d.poojas.find((x) => x.id === d.payments[index].pooja_id)
      if (act) act.kind = f.type.trim()
    })
    onDone(); toast('Saved')
  }
  const del = () => confirm('Delete this payment?', () => { update((d) => { d.payments.splice(index, 1) }); onDone(); toast('Deleted') }, 'Delete')
  return (
    <>
      <div className="grid2">
        <Field label="Devotee" full><input value={findDevotee(db, p.phone)?.full_name ?? p.phone} disabled /></Field>
        <Field label="Type">
          {linked ? <input value={f.type} onChange={set('type')} /> : <SelectOther value={f.type} options={['Yatra', 'Donation', 'Maintenance', 'Other']} onChange={(v) => setF((q) => ({ ...q, type: v }))} />}
        </Field>
        <Field label="Amount (₹) *"><input type="number" min="0" inputMode="decimal" value={f.amount} onChange={set('amount')} /></Field>
        <Field label="Status"><Select value={f.status} onChange={set('status')}><option>Paid</option><option>Pending</option></Select></Field>
        {f.status === 'Paid' && <Field label="Paid on"><input type="date" value={f.date} onChange={set('date')} /></Field>}
        {f.status === 'Paid' && <Field label="Mode"><Select value={f.mode} onChange={set('mode')}><option>UPI</option><option>Cash</option><option>Bank</option></Select></Field>}
        <Field label="Note" full><input value={f.note} onChange={set('note')} /></Field>
      </div>
      {linked && (
        <div className="muted fs12 mt8">
          For {linked.kind} on {linked.date} ({linked.session}). Change the date or session on the <a href="#" onClick={(e) => { e.preventDefault(); onDone(); go('poojas') }}>Poojas &amp; Seva</a> screen.
        </div>
      )}
      <div className="actbar">
        <button className="btn" onClick={save}>Save</button>
        <button className="btn sec" onClick={onDone}>Cancel</button>
        <button className="btn danger" onClick={del}>Delete</button>
      </div>
    </>
  )
}

/** Payment drawer (opened from the Payments page). */
export function PaymentForm({ index }: { index: number | null }) {
  const { db, closeDrawer } = useAdmin()
  const [phone, setPhone] = useState('')
  if (index == null) {
    return (
      <>
        <div className="hdr"><h2>Add payment</h2><button className="btn sec" onClick={closeDrawer}>Close</button></div>
        <Field label="Devotee *">
          <Select value={phone} onChange={(e) => setPhone(e.target.value)}>
            <option value="">Select devotee…</option>
            {db.devotees.map((d) => <option key={d.phone} value={d.phone}>{devoteeLabel(db, d.phone)}</option>)}
          </Select>
        </Field>
        {phone ? <AddPayment key={phone} phone={phone} onAdded={closeDrawer} /> : <div className="muted mt12">Choose a devotee to record a payment.</div>}
      </>
    )
  }
  return (
    <>
      <div className="hdr"><h2>Edit payment</h2><button className="btn sec" onClick={closeDrawer}>Close</button></div>
      <PaymentEditor index={index} onDone={closeDrawer} />
    </>
  )
}

/** Toggle a payment between Paid and Pending. Marking pending clears the paid date. */
function useSetStatus() {
  const { update, toast } = useAdmin()
  return (i: number, status: 'Paid' | 'Pending') => {
    update((d) => {
      const x = d.payments[i]
      x.status = status
      if (status === 'Paid') { x.date = todayISO(); x.mode = x.mode || 'UPI' } else { x.date = '' }
    })
    toast(status === 'Paid' ? 'Marked paid' : 'Marked pending')
  }
}

const BLANK = { type: 'Yatra', sd: '', se: 'Morning', amount: '', status: 'Pending', mode: 'UPI', note: '' }

/** "Add payment" form. Annadanam / Alpaharam / Pooja sponsorships are scheduled on the Poojas & Seva screen. */
function AddPayment({ phone, onAdded }: { phone: string; onAdded?: () => void }) {
  const { update, toast } = useAdmin()
  const [f, setF] = useState(BLANK)
  const set = (k: keyof typeof BLANK) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const v = e.target.value
    // changing type keeps session valid: Annadanam = Afternoon only, others Morning/Evening
    if (k === 'type') setF({ ...f, type: v, se: sessionsFor(v).includes(f.se) ? f.se : sessionsFor(v)[0] })
    else setF({ ...f, [k]: v })
  }
  const svc = SVC_TYPES.includes(f.type)

  const add = () => {
    const a = +f.amount
    if (!f.type.trim()) { toast('Enter what the other payment is for'); return }
    if (!(a > 0)) { toast('Enter amount'); return }
    if (svc && !f.sd) { toast('Pick the ' + f.type.toLowerCase() + ' date'); document.getElementById('psd')?.focus(); return }
    update((d) => {
      d.payments.push({
        id: d.nextId.pay++, phone, type: f.type.trim(), service_date: svc ? f.sd : '', session: svc ? f.se : '', amount: a,
        date: f.status === 'Paid' ? todayISO() : '', mode: f.status === 'Paid' ? f.mode : '', status: f.status, note: f.note,
      })
    })
    setF(BLANK); toast('Added')
    onAdded?.()
  }

  return (
    <div className="sub mt12">
      <b>Add payment</b>
      <div className="grid2 two mt8">
        <Field label="Type">
          <SelectOther value={f.type} options={['Yatra', 'Donation', 'Maintenance', 'Other']} onChange={(v) => setF((p) => ({ ...p, type: v, amount: v === 'Maintenance' && !p.amount ? String(MAINTENANCE_AMOUNT) : p.type === 'Maintenance' && p.amount === String(MAINTENANCE_AMOUNT) ? '' : p.amount }))} />
        </Field>
        {svc && <Field label={f.type + ' date *'}><input id="psd" type="date" value={f.sd} onChange={set('sd')} /></Field>}
        {svc && <Field label="Session"><Select value={f.se} onChange={set('se')}>{sessionsFor(f.type).map((s) => <option key={s}>{s}</option>)}</Select></Field>}
        <Field label="Amount (₹) *"><input type="number" min="0" inputMode="decimal" value={f.amount} onChange={set('amount')} /></Field>
        <Field label="Status"><Select value={f.status} onChange={set('status')}><option>Paid</option><option>Pending</option></Select></Field>
        <Field label="Mode"><Select value={f.mode} onChange={set('mode')}><option>UPI</option><option>Cash</option><option>Bank</option></Select></Field>
        <Field label="Note" full><input value={f.note} onChange={set('note')} /></Field>
      </div>
      <button className="btn mt8" onClick={add}>Add</button>
    </div>
  )
}

/** Payments tab inside the devotee drawer. */
export function DevoteePaymentsTab({ phone }: { phone: string }) {
  const { db, update, confirm } = useAdmin()
  const setStatus = useSetStatus()
  const [editing, setEditing] = useState<number | null>(null)
  const list = db.payments.map((x, i) => ({ x, i })).filter((o) => o.x.phone === phone)
  if (editing != null) return <PaymentEditor index={editing} onDone={() => setEditing(null)} />
  return (
    <>
      {list.length ? list.map(({ x, i }) => (
        <div key={x.id ?? i} {...rowOpen(() => setEditing(i), 'sub pay row')}>
          <div className="pay-top">
            <div className="pay-title"><b>{x.type}</b>{x.service_date && <span className="pill gold nowrap">{x.service_date}{x.session ? ' · ' + x.session : ''}</span>}</div>
            <b className="pay-amt">{money(x.amount)}</b>
          </div>
          <div className="pay-meta">
            <span className={'pill ' + (x.status === 'Paid' ? 'ok' : 'warn')}>{x.status}</span>
            {x.date && <span className="muted nowrap">{x.date}</span>}
            {x.note && <span className="muted">{x.note}</span>}
          </div>
          <div className="pay-acts">
            <ReceiptButtons p={x} />
            <button className="btn sec sm" onClick={() => setStatus(i, x.status === 'Paid' ? 'Pending' : 'Paid')}>{x.status === 'Paid' ? 'Mark pending' : 'Mark paid'}</button>
            <button className="btn danger sm push" aria-label="Delete payment" onClick={() => confirm('Delete this ' + x.type + ' payment of ' + money(x.amount) + '?', () => update((d) => { d.payments.splice(i, 1) }), 'Delete')}>✕</button>
          </div>
        </div>
      )) : <div className="muted">No payments yet.</div>}
      <AddPayment phone={phone} />
    </>
  )
}

/** All-devotees payments view. */
export default function PaymentsView() {
  const { db, openDevotee, openPayment } = useAdmin()
  const setStatus = useSetStatus()
  const rows = db.payments.map((p, i) => ({ p, i, d: findDevotee(db, p.phone) }))
  const tot = (s: string) => rows.filter((r) => r.p.status === s).reduce((a, r) => a + (+r.p.amount || 0), 0)
  return (
    <>
      <div className="top"><h1>Payments</h1><button className="btn" onClick={() => openPayment(null)}>+ Add payment</button></div>
      <div className="cards">
        <div className="stat"><b>{money(tot('Paid'))}</b><span>Collected</span></div>
        <div className="stat"><b>{money(tot('Pending'))}</b><span>Pending</span></div>
      </div>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Devotee</th><th>Type</th><th>Service date</th><th>Amount</th><th>Status</th><th className="hm">Paid on</th><th></th></tr></thead>
          <tbody>
            {rows.map(({ p, i, d }) => (
              <tr key={p.id ?? i} {...rowOpen(() => openPayment(i))}>
                <td><a href="#" onClick={(e) => { e.preventDefault(); openDevotee(p.phone) }}>{d ? d.full_name : p.phone}</a></td>
                <td>{p.type}</td>
                <td>{p.service_date ? <>{p.service_date}{p.session && <> <span className="pill gold">{p.session}</span></>}</> : <span className="muted">—</span>}</td>
                <td>{money(p.amount)}</td>
                <td><span className={'pill ' + (p.status === 'Paid' ? 'ok' : 'warn')}>{p.status}</span></td>
                <td className="hm">{p.date}</td>
                <td className="nowrap"><ReceiptButtons p={p} /><button className="btn sec sm" onClick={() => setStatus(i, p.status === 'Paid' ? 'Pending' : 'Paid')}>{p.status === 'Paid' ? 'Mark pending' : 'Mark paid'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
