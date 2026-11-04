import { useState } from 'react'
import { useAdmin } from './AdminContext'
import { Avatar, DeekshaPill } from './ui'
import { NEW_TAG, THIS_YEAR } from './types'
import { batchOf, curDeeksha, duesOf, fmtPhone, money } from './utils'
import { exportXlsx } from './excel'
import { Select } from './Select'

const rowKey = (open: () => void) => ({
  tabIndex: 0,
  onClick: open,
  onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter') open() },
})

export default function DevoteeTable() {
  const { db, openDevotee, toast } = useAdmin()
  const [f, setF] = useState({ q: '', deeksha: '', batch: '', dues: '' })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })

  const q = f.q.toLowerCase().trim()
  const rows = db.devotees.filter((d) => {
    if (q && ![d.full_name, d.phone, d.gothram, d.address, d.email].join(' ').toLowerCase().includes(q)) return false
    const dk = db.deekshas.find((x) => x.phone === d.phone && x.year === THIS_YEAR)
    if (f.deeksha === 'active' && !dk) return false
    if (f.deeksha === 'none' && dk) return false
    const b = batchOf(db, d.phone)
    if (f.batch === 'none' && b) return false
    if (f.batch && f.batch !== 'none' && (!b || String(b.id) !== f.batch)) return false
    if (f.dues === 'due' && !duesOf(db, d.phone)) return false
    return true
  })

  return (
    <>
      <div className="top">
        <h1>Devotees</h1>
        <button className="btn sec" onClick={() => exportXlsx(db, toast, new Set(rows.map((d) => d.phone)))}>⬇ Excel ({rows.length})</button>
        <button className="btn" onClick={() => openDevotee()}>+ Add devotee</button>
      </div>
      <div className="filters">
        <input placeholder="Search name, phone, gothram, place…" aria-label="Search devotees" value={f.q} onChange={set('q')} />
        <Select aria-label="Deeksha filter" value={f.deeksha} onChange={set('deeksha')}>
          <option value="">All deeksha</option>
          <option value="active">In deeksha {THIS_YEAR}</option>
          <option value="none">Not in deeksha {THIS_YEAR}</option>
        </Select>
        <Select aria-label="Batch filter" value={f.batch} onChange={set('batch')}>
          <option value="">All batches</option>
          <option value="none">No batch</option>
          {db.batches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.year})</option>)}
        </Select>
        <Select aria-label="Dues filter" value={f.dues} onChange={set('dues')}>
          <option value="">Dues: any</option>
          <option value="due">Has pending dues</option>
        </Select>
      </div>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Devotee</th><th>Phone (ID)</th><th className="hm">Referred by</th><th>Deeksha</th><th className="hm">Batch</th><th>Dues</th></tr></thead>
          <tbody>
            {rows.map((d) => {
              const dues = duesOf(db, d.phone), b = batchOf(db, d.phone)
              return (
                <tr key={d.phone} className="row" {...rowKey(() => openDevotee(d.phone))}>
                  <td><Avatar photo={d.photo} name={d.full_name} />{d.full_name}{d.active === 'no' && <> <span className="pill warn">inactive</span></>}</td>
                  <td><a href={'tel:+91' + d.phone.replace(/\D/g, '').slice(-10)} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>{fmtPhone(d.phone)}</a></td>
                  <td className="hm">{d.referred_by && d.referred_by !== NEW_TAG ? d.referred_by : <span className="pill gold">{NEW_TAG}</span>}</td>
                  <td><DeekshaPill dk={curDeeksha(db, d.phone)} /></td>
                  <td className="hm">{b ? b.name : <span className="muted">—</span>}</td>
                  <td>{dues ? <span className="pill warn">{money(dues)}</span> : <span className="pill ok">Clear</span>}</td>
                </tr>
              )
            })}
            {!rows.length && (
              <tr><td colSpan={6} className="empty">{db.devotees.length ? 'No devotees match these filters.' : 'No devotees yet. Click “+ Add devotee” to start.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="muted mt8">{rows.length} of {db.devotees.length} devotees</div>
    </>
  )
}
