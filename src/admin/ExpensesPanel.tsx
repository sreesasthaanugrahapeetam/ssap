import { useState } from 'react'
import { useAdmin } from './AdminContext'
import { Field } from './ui'
import { EXP_CATS } from './types'
import { money, todayISO } from './utils'
import { Select } from './Select'

export default function ExpensesPanel() {
  const { db, openExpense, confirm, update } = useAdmin()
  const [f, setF] = useState({ q: '', cat: '', month: '' })
  const all = db.expenses
  const sum = (l: typeof all) => l.reduce((a, e) => a + (+e.amount || 0), 0)
  const mk = todayISO().slice(0, 7)
  const byCat: Record<string, number> = {}
  all.forEach((e) => { byCat[e.category] = (byCat[e.category] || 0) + (+e.amount || 0) })
  const months = [...new Set(all.map((e) => String(e.date).slice(0, 7)).filter(Boolean))].sort().reverse()
  const q = f.q.trim().toLowerCase()
  const rows = all.map((e, i) => ({ e, i }))
    .filter(({ e }) => (!f.cat || e.category === f.cat) && (!f.month || String(e.date).slice(0, 7) === f.month) && (!q || (e.paid_to + ' ' + e.note + ' ' + e.category).toLowerCase().includes(q)))
    .sort((a, b) => String(b.e.date).localeCompare(String(a.e.date)))
  const paid = db.payments.filter((p) => p.status === 'Paid').reduce((a, p) => a + (+p.amount || 0), 0)
  const total = sum(all)

  return (
    <>
      <div className="top"><h1>Expenses</h1><button className="btn" onClick={() => openExpense(null)}>+ Add expense</button></div>
      <div className="cards">
        <div className="stat"><b>{money(total)}</b><span>Total expenses</span></div>
        <div className="stat"><b>{money(sum(all.filter((e) => String(e.date).slice(0, 7) === mk)))}</b><span>This month</span></div>
        <div className="stat"><b>{money(paid - total)}</b><span>Balance (collected − expenses)</span></div>
      </div>
      <div className="panel">
        <h3>By category</h3>
        {Object.keys(byCat).length ? Object.keys(byCat).sort((a, b) => byCat[b] - byCat[a]).map((c) => (
          <div key={c} style={{ marginBottom: 8 }}>
            <span>{c}</span> <span className="muted">· {money(byCat[c])}</span>
            <div className="bar"><i style={{ width: Math.min(100, (byCat[c] / total) * 100) + '%' }} /></div>
          </div>
        )) : <span className="muted">No expenses yet.</span>}
      </div>
      <div className="filters">
        <input placeholder="Search paid to, note…" aria-label="Search expenses" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
        <Select aria-label="Category filter" value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })}>
          <option value="">All categories</option>{EXP_CATS.map((c) => <option key={c}>{c}</option>)}
        </Select>
        <Select aria-label="Month filter" value={f.month} onChange={(e) => setF({ ...f, month: e.target.value })}>
          <option value="">All months</option>{months.map((m) => <option key={m}>{m}</option>)}
        </Select>
      </div>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Date</th><th>Category</th><th>Paid to</th><th>Amount</th><th className="hm">Mode</th><th></th></tr></thead>
          <tbody>
            {rows.map(({ e, i }) => (
              <tr key={e.id ?? i}>
                <td>{e.date}</td>
                <td>{e.category}<div className="muted" style={{ fontSize: 12 }}>{e.note}</div></td>
                <td>{e.paid_to}</td><td>{money(e.amount)}</td><td className="hm">{e.mode}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn sec sm" onClick={() => openExpense(i)}>Edit</button>{' '}
                  <button className="btn danger sm" aria-label="Delete expense" onClick={() => confirm('Delete this expense?', () => update((d) => { d.expenses.splice(i, 1) }))}>✕</button>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6} className="empty">{all.length ? 'No expenses match these filters.' : 'No expenses yet. Click “+ Add expense”.'}</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}

/** Expense drawer form (add / edit by index). */
export function ExpenseForm({ index }: { index: number | null }) {
  const { db, update, closeDrawer, toast } = useAdmin()
  const [e, setE] = useState(() => {
    const x = index == null ? { date: todayISO(), category: EXP_CATS[0], amount: '', mode: 'Cash', paid_to: '', note: '' } : db.expenses[index]
    return { date: x.date, category: x.category, amount: String(x.amount), mode: x.mode, paid_to: x.paid_to, note: x.note }
  })
  const set = (k: keyof typeof e) => (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setE({ ...e, [k]: ev.target.value })
  const save = () => {
    const a = +e.amount
    if (!(a > 0)) { toast('Enter a valid amount'); return }
    if (!e.date) { toast('Pick a date'); return }
    const r = { date: e.date, category: e.category, amount: a, mode: e.mode, paid_to: e.paid_to.trim(), note: e.note.trim() }
    update((d) => { if (index == null) d.expenses.push({ id: d.nextId.exp++, ...r }); else d.expenses[index] = { ...d.expenses[index], ...r } })
    closeDrawer(); toast('Saved')
  }
  return (
    <>
      <div className="hdr"><h2>{index == null ? 'Add' : 'Edit'} expense</h2><button className="btn sec" onClick={closeDrawer}>Close</button></div>
      <div className="grid2">
        <Field label="Date"><input type="date" value={e.date} onChange={set('date')} /></Field>
        <Field label="Amount (₹) *"><input type="number" min="0" value={e.amount} onChange={set('amount')} /></Field>
        <Field label="Category"><Select value={e.category} onChange={set('category')}>{EXP_CATS.map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Mode"><Select value={e.mode} onChange={set('mode')}>{['Cash', 'UPI', 'Bank'].map((m) => <option key={m}>{m}</option>)}</Select></Field>
        <Field label="Paid to" full><input value={e.paid_to} onChange={set('paid_to')} /></Field>
        <Field label="Note" full><input value={e.note} onChange={set('note')} /></Field>
      </div>
      <div className="actbar"><button className="btn" onClick={save}>Save</button><button className="btn sec" onClick={closeDrawer}>Cancel</button></div>
    </>
  )
}
