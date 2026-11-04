import { useState } from 'react'
import { useAdmin } from './AdminContext'
import { Field } from './ui'
import { SVC_TYPES, sessionsFor } from './types'
import { findDevotee, money, todayISO } from './utils'
import { Select, SelectOther } from './Select'

function useMarkPaid() {
  const { update } = useAdmin()
  return (i: number) => update((d) => {
    const x = d.payments[i]
    x.status = 'Paid'; x.date = todayISO(); x.mode = x.mode || 'UPI'
  })
}

const BLANK = { type: 'Yatra', sd: '', se: 'Morning', amount: '', status: 'Paid', mode: 'UPI', note: '' }

/** "Add payment" form. Annadanam / Alpaharam / Pooja sponsorships are scheduled on the Poojas & Seva screen. */
function AddPayment({ phone }: { phone: string }) {
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
  }

  return (
    <div className="sub mt12">
      <b>Add payment</b>
      <div className="grid2 mt8">
        <Field label="Type">
          <SelectOther value={f.type} options={['Yatra', 'Donation', 'Other']} onChange={(v) => setF((p) => ({ ...p, type: v }))} />
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
  const { db, update } = useAdmin()
  const markPaid = useMarkPaid()
  const list = db.payments.map((x, i) => ({ x, i })).filter((o) => o.x.phone === phone)
  return (
    <>
      {list.length ? (
        <div className="tablewrap"><table>
          <tbody>
            <tr><th>Type</th><th>Amount</th><th>Status</th><th>Date</th><th></th></tr>
            {list.map(({ x, i }) => (
              <tr key={x.id ?? i}>
                <td>{x.type}{x.service_date && <> <span className="pill gold">{x.service_date}{x.session ? ' · ' + x.session : ''}</span></>}
                  <div className="muted fs12">{x.note}</div></td>
                <td>{money(x.amount)}</td>
                <td><span className={'pill ' + (x.status === 'Paid' ? 'ok' : 'warn')}>{x.status}</span></td>
                <td>{x.date}</td>
                <td className="nowrap">
                  {x.status === 'Pending' && <><button className="btn sm" onClick={() => markPaid(i)}>Mark paid</button> </>}
                  <button className="btn danger sm" aria-label="Delete payment" onClick={() => update((d) => { d.payments.splice(i, 1) })}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      ) : <div className="muted">No payments yet.</div>}
      <AddPayment phone={phone} />
    </>
  )
}

/** All-devotees payments view. */
export default function PaymentsView() {
  const { db, openDevotee } = useAdmin()
  const markPaid = useMarkPaid()
  const rows = db.payments.map((p, i) => ({ p, i, d: findDevotee(db, p.phone) }))
  const tot = (s: string) => rows.filter((r) => r.p.status === s).reduce((a, r) => a + (+r.p.amount || 0), 0)
  return (
    <>
      <div className="top"><h1>Payments</h1></div>
      <div className="cards">
        <div className="stat"><b>{money(tot('Paid'))}</b><span>Collected</span></div>
        <div className="stat"><b>{money(tot('Pending'))}</b><span>Pending</span></div>
      </div>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Devotee</th><th>Type</th><th>Service date</th><th>Amount</th><th>Status</th><th className="hm">Paid on</th><th></th></tr></thead>
          <tbody>
            {rows.map(({ p, i, d }) => (
              <tr key={p.id ?? i}>
                <td><a href="#" onClick={(e) => { e.preventDefault(); openDevotee(p.phone) }}>{d ? d.full_name : p.phone}</a></td>
                <td>{p.type}</td>
                <td>{p.service_date ? <>{p.service_date}{p.session && <> <span className="pill gold">{p.session}</span></>}</> : <span className="muted">—</span>}</td>
                <td>{money(p.amount)}</td>
                <td><span className={'pill ' + (p.status === 'Paid' ? 'ok' : 'warn')}>{p.status}</span></td>
                <td className="hm">{p.date}</td>
                <td>{p.status === 'Pending' && <button className="btn sm" onClick={() => markPaid(i)}>Mark paid</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
