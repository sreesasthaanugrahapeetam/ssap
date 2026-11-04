import { useAdmin } from './AdminContext'
import { THIS_YEAR } from './types'
import { batchOf, curDeeksha, daysLeft, money } from './utils'

export default function Dashboard() {
  const { db, openDevotee } = useAdmin()
  const active = db.deekshas.filter((x) => x.year === THIS_YEAR && !x.end_date)
  const dues = db.payments.filter((p) => p.status === 'Pending').reduce((s, p) => s + (+p.amount || 0), 0)
  const paid = db.payments.filter((p) => p.status === 'Paid').reduce((s, p) => s + (+p.amount || 0), 0)
  const unassigned = active.filter((x) => !batchOf(db, x.phone)).length
  const spent = db.expenses.reduce((s, e) => s + (+e.amount || 0), 0)
  const upcoming = db.devotees
    .map((d) => ({ d, dk: curDeeksha(db, d.phone) }))
    .filter((x) => x.dk && !x.dk.end_date)
    .map((x) => ({ ...x, left: daysLeft(x.dk) }))
    .filter((x) => x.left != null && x.left >= 0)
    .sort((a, b) => (a.left as number) - (b.left as number))
    .slice(0, 5)
  const batches = db.batches.filter((b) => b.year === THIS_YEAR)

  return (
    <>
      <div className="top"><h1>Dashboard</h1><button className="btn" onClick={() => openDevotee()}>+ Add devotee</button></div>
      <div className="cards">
        <div className="stat"><b>{db.devotees.length}</b><span>Total devotees</span></div>
        <div className="stat"><b>{active.length}</b><span>In deeksha {THIS_YEAR}</span></div>
        <div className="stat"><b>{unassigned}</b><span>Not in any batch</span></div>
        <div className="stat"><b>{money(paid)}</b><span>Collected</span></div>
        <div className="stat"><b>{money(dues)}</b><span>Pending dues</span></div>
        <div className="stat"><b>{money(spent)}</b><span>Expenses</span></div>
        <div className="stat"><b>{money(paid - spent)}</b><span>Balance (collected − expenses)</span></div>
      </div>
      <div className="dgrid">
        <div className="panel">
          <h3>Deeksha ending soonest</h3>
          {upcoming.length ? (
            <div className="tablewrap"><table>
              <tbody>
                <tr><th>Devotee</th><th>Mandala</th><th>Days left</th></tr>
                {upcoming.map((x) => (
                  <tr key={x.d.phone} className="row" tabIndex={0} onClick={() => openDevotee(x.d.phone)}>
                    <td>{x.d.full_name}</td><td>{x.dk.mandala_days} days</td><td>{x.left}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          ) : <span className="muted">None running right now.</span>}
        </div>
        <div className="panel">
          <h3>Batches {THIS_YEAR}</h3>
          {batches.length ? batches.map((b) => {
            const n = db.batch_members.filter((m) => m.batch_id === b.id).length
            return (
              <div key={b.id} style={{ marginBottom: 10 }}>
                <b>{b.name}</b> <span className="muted">· {b.travel_date} · {n}/{b.capacity}</span>
                <div className="bar"><i style={{ width: Math.min(100, (n / b.capacity) * 100) + '%' }} /></div>
              </div>
            )
          }) : <span className="muted">No batches yet.</span>}
        </div>
      </div>
    </>
  )
}
