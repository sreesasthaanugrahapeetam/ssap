import { ReactNode } from 'react'
import { useAdmin } from './AdminContext'
import { SEVA_KINDS, THIS_YEAR } from './types'
import { batchOf, curDeeksha, daysLeft, daysUntil, devoteeLabel, money, upcomingPoojas } from './utils'
import { whenLabel } from './PoojasView'

/** Scrollable list split into Today / Tomorrow / Later groups. Each group has its own heading; empty groups are skipped. */
function Grouped<T extends { date: string }>({ list, label, row }: { list: T[]; label: string; row: (item: T) => ReactNode }) {
  const groups: [string, string, T[]][] = [
    ['today', 'Today', list.filter((x) => daysUntil(x.date) === 0)],
    ['tomorrow', 'Tomorrow', list.filter((x) => daysUntil(x.date) === 1)],
    ['later', 'Later', list.filter((x) => daysUntil(x.date) > 1)],
  ]
  return (
    <div className="scrolllist" tabIndex={0} aria-label={label}>
      {groups.filter(([, , items]) => items.length).map(([key, title, items]) => (
        <div key={key} className={'sgroup ' + key}>
          <div className="sgroup-h">{title} <span>{items.length}</span></div>
          {items.map(row)}
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { db, openDevotee, openPooja, go } = useAdmin()
  const active = db.deekshas.filter((x) => x.year === THIS_YEAR && !x.end_date)
  const dues = db.payments.filter((p) => p.status === 'Pending').reduce((s, p) => s + (+p.amount || 0), 0)
  const unassigned = active.filter((x) => !batchOf(db, x.phone)).length
  const upcoming = db.devotees
    .map((d) => ({ d, dk: curDeeksha(db, d.phone) }))
    .filter((x) => x.dk && !x.dk.end_date)
    .map((x) => ({ ...x, left: daysLeft(x.dk) }))
    .filter((x) => x.left != null && x.left >= 0)
    .sort((a, b) => (a.left as number) - (b.left as number))
    .slice(0, 5)
  const batches = db.batches.filter((b) => b.year === THIS_YEAR)
  const nextPadi = upcomingPoojas(db, 'Padi Pooja')[0]
  const nextAbhi = upcomingPoojas(db, 'Abhishekam')[0]
  // one chronological list (today first, then tomorrow…); the next Padi Pooja and next Abhishekam get a "Next" tag
  const poojaList = upcomingPoojas(db).filter((p) => !SEVA_KINDS.includes(p.kind))
  const idx = (p: typeof nextPadi) => db.poojas.indexOf(p)

  return (
    <>
      <div className="top"><h1>Dashboard</h1><button className="btn" onClick={() => openDevotee()}>+ Add devotee</button></div>
      <div className="cards">
        <div className="stat"><b>{active.length}</b><span>In deeksha {THIS_YEAR}</span></div>
        <div className="stat"><b>{unassigned}</b><span>Not in any batch</span></div>
        <div className="stat"><b>{money(dues)}</b><span>Pending dues</span></div>
      </div>
      <div className="dgrid tri">
      <div className="panel">
        <h3>Upcoming poojas</h3>
        {poojaList.length ? (
          <Grouped list={poojaList} label="Upcoming poojas" row={(p) => (
            <div key={p.id} className="srow" role="button" tabIndex={0}
              onClick={() => openPooja(idx(p))} onKeyDown={(e) => { if (e.key === 'Enter') openPooja(idx(p)) }}>
              <div><b>{p.date}</b> <span className="pill gold">{p.session}</span> <span className="when">{whenLabel(p.date)}</span></div>
              <div>{p.kind}{(p === nextPadi || p === nextAbhi) && <> <span className="pill ok">Next</span></>}</div>
              {p.phones.length > 0 && <div className="muted fs12">{p.phones.map((ph) => devoteeLabel(db, ph)).join(', ')}</div>}
            </div>
          )} />
        ) : <span className="muted">None scheduled.</span>}
        <button className="btn sec sm mt8" onClick={() => go('poojas')}>All poojas</button>
      </div>
        {SEVA_KINDS.map((type) => {
          const list = upcomingPoojas(db, type)
          return (
            <div key={type} className="panel">
              <h3>Upcoming {type}</h3>
              <div className="muted fs12">All devotees are invited to attend and bless the donors.</div>
              {list.length ? (
                <Grouped list={list} label={'Upcoming ' + type} row={(p) => (
                  <div key={p.id} className="srow" role="button" tabIndex={0}
                    onClick={() => openPooja(idx(p))} onKeyDown={(e) => { if (e.key === 'Enter') openPooja(idx(p)) }}>
                    <div><b>{p.date}</b> <span className="pill gold">{p.session}</span> <span className="when">{whenLabel(p.date)}</span></div>
                    <div>{'Donor' + (p.phones.length > 1 ? 's' : '')}: <b>{p.phones.length ? p.phones.map((ph) => devoteeLabel(db, ph)).join(', ') : 'To be announced'}</b>{p.notes && <span className="muted"> · {p.notes}</span>}</div>
                  </div>
                )} />
              ) : <span className="muted">None scheduled.</span>}
            </div>
          )
        })}
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
              <div key={b.id} className="mb10">
                <b>{b.name}</b> <span className="muted">· {b.travel_date} · {n}/{b.capacity}</span>
                <progress className="bar" value={Math.min(n, b.capacity)} max={b.capacity} />
              </div>
            )
          }) : <span className="muted">No batches yet.</span>}
        </div>
      </div>
    </>
  )
}
