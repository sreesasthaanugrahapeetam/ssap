import { useState } from 'react'
import { useAdmin } from './AdminContext'
import { Field } from './ui'
import { THIS_YEAR } from './types'

export default function BatchesView() {
  const { db, openBatch, openDevotee, confirm, update } = useAdmin()
  const batches = db.batches.slice().sort((a, b) => b.year - a.year)
  return (
    <>
      <div className="top"><h1>Batches / Yatra</h1><button className="btn" onClick={() => openBatch(null)}>+ New batch</button></div>
      {batches.map((b) => {
        const mem = db.batch_members.filter((m) => m.batch_id === b.id).map((m) => db.devotees.find((d) => d.phone === m.phone)).filter(Boolean)
        return (
          <div className="panel" key={b.id}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, flex: 1 }}>{b.name} <span className="muted" style={{ fontWeight: 400 }}>· {b.year}</span></h3>
              <span className="pill gold">{mem.length}/{b.capacity}</span>
              <button className="btn sec sm" onClick={() => openBatch(b.id)}>Edit</button>
              <button className="btn danger sm" onClick={() => confirm('Delete batch? Members become unassigned.', () => update((d) => {
                d.batches = d.batches.filter((x) => x.id !== b.id); d.batch_members = d.batch_members.filter((m) => m.batch_id !== b.id)
              }))}>Delete</button>
            </div>
            <div className="muted" style={{ margin: '4px 0 8px' }}>{b.travel_date} · {b.vehicle} {b.notes ? '· ' + b.notes : ''}</div>
            {mem.length ? mem.map((d) => (
              <span key={d!.phone} className="pill" style={{ cursor: 'pointer', margin: 2 }} onClick={() => openDevotee(d!.phone)}>{d!.full_name}</span>
            )) : <span className="muted">No members yet. Assign from a devotee’s Yatra tab.</span>}
          </div>
        )
      })}
      {!batches.length && <div className="muted">No batches.</div>}
    </>
  )
}

/** Batch drawer form (new when id is null). */
export function BatchForm({ id }: { id: number | null }) {
  const { db, update, closeDrawer, toast } = useAdmin()
  const [f, setF] = useState(() => {
    const b = id == null ? { year: THIS_YEAR, name: 'Batch ' + (db.batches.length + 1), travel_date: '', vehicle: '', capacity: 45, notes: '' } : db.batches.find((x) => x.id === id)!
    return { name: b.name, year: String(b.year), travel_date: b.travel_date, vehicle: b.vehicle, capacity: String(b.capacity), notes: b.notes }
  })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    const name = f.name.trim(), cap = +f.capacity, yr = +f.year
    if (!name) { toast('Enter batch name'); return }
    if (!(cap > 0)) { toast('Enter a valid capacity'); return }
    if (!(yr > 0)) { toast('Enter a valid year'); return }
    const r = { year: yr, name, travel_date: f.travel_date, vehicle: f.vehicle.trim(), capacity: cap, notes: f.notes.trim() }
    update((d) => { if (id == null) d.batches.push({ id: d.nextId.batch++, ...r }); else Object.assign(d.batches.find((x) => x.id === id)!, r) })
    closeDrawer(); toast('Saved')
  }
  return (
    <>
      <div className="hdr"><h2>{id == null ? 'New' : 'Edit'} batch</h2><button className="btn sec" onClick={closeDrawer}>Close</button></div>
      <div className="grid2">
        <Field label="Batch name *" full><input value={f.name} onChange={set('name')} /></Field>
        <Field label="Year"><input type="number" min="2000" value={f.year} onChange={set('year')} /></Field>
        <Field label="Travel date"><input type="date" value={f.travel_date} onChange={set('travel_date')} /></Field>
        <Field label="Vehicle"><input placeholder="Bus A (45 seats)" value={f.vehicle} onChange={set('vehicle')} /></Field>
        <Field label="Capacity *"><input type="number" min="1" value={f.capacity} onChange={set('capacity')} /></Field>
        <Field label="Notes" full><input placeholder="Depart 5 AM from Peetam" value={f.notes} onChange={set('notes')} /></Field>
      </div>
      <div className="actbar"><button className="btn" onClick={save}>Save</button><button className="btn sec" onClick={closeDrawer}>Cancel</button></div>
    </>
  )
}
