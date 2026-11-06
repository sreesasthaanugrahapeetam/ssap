import { useState } from 'react'
import { useAdmin } from './AdminContext'
import { Field, PinLink, rowOpen, validPin } from './ui'
import { POOJA_KINDS, SESSION_ORDER, sessionsFor } from './types'
import { daysUntil, devoteeLabel, money, todayISO } from './utils'
import { Select, SelectOther } from './Select'
import AvailabilityCalendar from '../components/annadanam/AvailabilityCalendar'

export const whenLabel = (iso: string) => {
  const n = daysUntil(iso)
  return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n > 1 ? 'in ' + n + ' days' : Math.abs(n) + ' days ago'
}

export default function PoojasView() {
  const { db, openPooja, confirm, update } = useAdmin()
  const [kind, setKind] = useState('')
  const today = todayISO()
  // preset kinds plus any custom "Other" kinds already in use
  const kinds = [...POOJA_KINDS.filter((k) => k !== 'Other'), ...new Set(db.poojas.map((p) => p.kind).filter((k) => !POOJA_KINDS.includes(k)))]
  const rows = db.poojas.map((p, i) => ({ p, i })).filter(({ p }) => !kind || p.kind === kind)
    .sort((a, b) => a.p.date.localeCompare(b.p.date) || SESSION_ORDER.indexOf(a.p.session) - SESSION_ORDER.indexOf(b.p.session))
  const upcoming = rows.filter(({ p }) => p.date >= today)
  const past = rows.filter(({ p }) => p.date < today).reverse()

  const table = (list: typeof rows, empty: string) => (
    <div className="tablewrap">
      <table>
        <thead><tr><th>Activity</th><th>Date</th><th className="hm">Donors</th><th className="hm">Payment</th><th></th></tr></thead>
        <tbody>
          {list.map(({ p, i }) => {
            const pay = db.payments.find((x) => x.pooja_id === p.id)
            return (
            <tr key={p.id ?? i} {...rowOpen(() => openPooja(i), p.date === today ? 'row today' : 'row')}>
              <td>{p.kind}<div className="muted fs12">{p.notes}</div></td>
              <td>{p.date} <span className="pill gold">{p.session}</span><div className="muted fs12">{whenLabel(p.date)}</div></td>
              <td className="hm">{p.phones.length ? p.phones.map((ph) => devoteeLabel(db, ph)).join(', ') : <span className="muted">—</span>}<div className="muted fs12"><PinLink value={p.venue} /></div></td>
              <td className="hm">{pay ? <>{money(pay.amount)} <span className={'pill ' + (pay.status === 'Paid' ? 'ok' : 'warn')}>{pay.status}</span></> : <span className="muted">—</span>}</td>
              <td className="nowrap">
                <button className="btn danger sm" aria-label="Delete activity" onClick={() => confirm('Delete this activity and its linked payment?', () => update((d) => { const id = d.poojas[i].id; d.poojas.splice(i, 1); d.payments = d.payments.filter((x) => x.pooja_id !== id) }))}>✕</button>
              </td>
            </tr>
            )
          })}
          {!list.length && <tr><td colSpan={5} className="empty">{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  )

  return (
    <>
      <div className="top"><h1>Poojas &amp; Seva</h1><button className="btn" onClick={() => openPooja(null)}>+ Schedule</button></div>
      <div className="filters">
        <Select aria-label="Activity type filter" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="">All activities</option>{kinds.map((k) => <option key={k}>{k}</option>)}
        </Select>
      </div>
      <div className="panel"><h3>Upcoming</h3>{table(upcoming, 'Nothing scheduled. Click “+ Schedule”.')}</div>
      {past.length > 0 && <div className="panel"><h3>Past</h3>{table(past, '')}</div>}
    </>
  )
}

/** Poojas & Seva drawer form (add / edit by index). Payment fields are internal and kept in a linked payment record. */
export function PoojaForm({ index }: { index: number | null }) {
  const { db, update, closeDrawer, toast, confirm } = useAdmin()
  const [f, setF] = useState(() => {
    const x = index == null ? { id: 0, kind: POOJA_KINDS[0], date: todayISO(), session: 'Evening', venue: '', notes: '', phones: [] as string[] } : db.poojas[index]
    const pay = x.id ? db.payments.find((p) => p.pooja_id === x.id) : undefined
    const date = index == null && db.poojas.some((p) => p.date === x.date && p.kind === x.kind && p.session === x.session) ? '' : x.date
    return { kind: x.kind, date, session: x.session, venue: x.venue, notes: x.notes, phones: [...x.phones],
      amount: pay ? String(pay.amount) : '', status: pay?.status || 'Pending', mode: pay?.mode || 'UPI' }
  })
  const sessions = sessionsFor(f.kind)
  /** Another activity of the same kind already holds this date + session (the one being edited does not count). */
  const taken = (date: string, kind: string, session: string) =>
    db.poojas.some((p, i) => i !== index && p.date === date && p.kind === kind && p.session === session)
  const set = (k: 'date' | 'session' | 'venue' | 'notes' | 'amount' | 'status' | 'mode') => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const v = e.target.value
    setF({ ...f, [k]: v })
  }
  // phones = donors; the payment is recorded against the first one
  const donor = f.phones[0] ?? ''
  const addPhone = (ph: string) => { if (ph && !f.phones.includes(ph)) setF({ ...f, phones: [...f.phones, ph] }) }
  const delPhone = (ph: string) => setF({ ...f, phones: f.phones.filter((x) => x !== ph) })
  const save = () => {
    if (!f.kind.trim()) { toast('Enter what the other activity is'); return }
    const oldVenue = index == null ? '' : db.poojas[index].venue
    if (f.venue.trim() !== oldVenue && !validPin(f.venue.trim())) { toast('Paste a Google Maps link (starts with https://)'); return }
    if (!f.date) { toast('Pick an available date'); return }
    if (taken(f.date, f.kind.trim(), f.session)) { toast('That date and session is already booked'); return }
    const amt = +f.amount
    if (amt > 0 && !donor) { toast('Add a donor to record a payment'); return }
    const r = { kind: f.kind.trim(), date: f.date, session: f.session, venue: f.venue.trim(), notes: f.notes.trim(), phones: f.phones }
    update((d) => {
      let rec = index == null ? undefined : d.poojas[index]
      if (rec) Object.assign(rec, r)
      else { rec = { id: d.nextId.pooja++, ...r }; d.poojas.push(rec) }
      const id = rec.id
      const ix = d.payments.findIndex((p) => p.pooja_id === id)
      if (!(amt > 0)) { if (ix >= 0) d.payments.splice(ix, 1); return }
      const base = { phone: f.phones[0], type: f.kind, service_date: f.date, session: f.session, pooja_id: id, amount: amt, status: f.status, mode: f.status === 'Paid' ? f.mode : '', note: f.notes.trim() }
      if (ix >= 0) { const old = d.payments[ix]; d.payments[ix] = { ...old, ...base, date: f.status === 'Paid' ? old.date || todayISO() : '' } }
      else d.payments.push({ id: d.nextId.pay++, ...base, date: f.status === 'Paid' ? todayISO() : '' })
    })
    closeDrawer(); toast('Saved')
  }
  return (
    <>
      <div className="hdr"><h2>{index == null ? 'Schedule' : 'Edit'} activity</h2><button className="btn sec" onClick={closeDrawer}>Close</button></div>
      <div className="grid2">
        <Field label="Activity"><SelectOther value={f.kind} options={POOJA_KINDS} onChange={(v) => setF((p) => { const se = sessionsFor(v).includes(p.session) ? p.session : sessionsFor(v)[0]; return { ...p, kind: v, session: se, date: taken(p.date, v, se) ? '' : p.date } })} /></Field>
        <Field label="Session"><Select value={f.session} onChange={(e) => setF((p) => ({ ...p, session: e.target.value, date: taken(p.date, p.kind, e.target.value) ? '' : p.date }))}>{sessions.map((s) => <option key={s}>{s}</option>)}</Select></Field>
        <div className="full"><div className="muted fs12">Date * (green = free, red = already booked for this activity and session)</div>
          <AvailabilityCalendar value={f.date} min={todayISO()} isTaken={(k) => taken(k, f.kind, f.session)} onPick={(k) => setF((p) => ({ ...p, date: k }))} /></div>
        <Field label="Google Maps pin" full><input type="url" inputMode="url" placeholder="Paste Google Maps link, e.g. https://maps.app.goo.gl/..." value={f.venue} onChange={set('venue')} /></Field>
        <Field label="Notes (occasion)" full><input value={f.notes} onChange={set('notes')} /></Field>
        <Field label="Donors" full>
          <Select value="" onChange={(e) => addPhone(e.target.value)}>
            <option value="">Add a donor…</option>
            {db.devotees.filter((d) => !f.phones.includes(d.phone)).map((d) => <option key={d.phone} value={d.phone}>{devoteeLabel(db, d.phone)}</option>)}
          </Select>
        </Field>
        <div className="full">
          {f.phones.map((ph) => (
            <span key={ph} className="pill gold pill-link" onClick={() => confirm('Remove ' + devoteeLabel(db, ph) + ' from this pooja?', () => delPhone(ph), 'Remove')} title="Remove">{devoteeLabel(db, ph)} ✕</span>
          ))}
        </div>
      </div>
      <div className="sub mt12">
        <b>Payment (internal, not shown on dashboard)</b>
        <div className="grid2 mt8">
          <Field label="Amount (₹)"><input type="number" min="0" inputMode="decimal" value={f.amount} onChange={set('amount')} /></Field>
          <Field label="Status"><Select value={f.status} onChange={set('status')}><option>Paid</option><option>Pending</option></Select></Field>
          {f.status === 'Paid' && <Field label="Mode"><Select value={f.mode} onChange={set('mode')}><option>UPI</option><option>Cash</option><option>Bank</option></Select></Field>}
        </div>
        <div className="muted fs12 mt8">Leave amount empty if there is no payment. The payment is recorded against the first donor and also appears on the Payments page and that donor's record.</div>
      </div>
      <div className="actbar"><button className="btn" onClick={save}>Save</button><button className="btn sec" onClick={closeDrawer}>Cancel</button></div>
    </>
  )
}
