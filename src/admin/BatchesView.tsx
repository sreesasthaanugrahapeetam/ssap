import { useState } from 'react'
import { useAdmin } from './AdminContext'
import { Field, rowOpen } from './ui'
import { Guru } from './types'
import { yatraText } from './yatraShare'
import { useShare } from './useShare'
import { Select } from './Select'
import { fmtPhone } from './utils'
import { THIS_YEAR } from './types'

export default function BatchesView() {
  const { db, openBatch, openDevotee, confirm, update } = useAdmin()
  const share = useShare()
  const batches = db.batches.slice().sort((a, b) => b.year - a.year)
  return (
    <>
      <div className="top"><h1>Batches / Yatra</h1><button className="btn" onClick={() => openBatch(null)}>+ New batch</button></div>
      {batches.map((b) => {
        const mem = db.batch_members.filter((m) => m.batch_id === b.id).map((m) => db.devotees.find((d) => d.phone === m.phone)).filter(Boolean)
        return (
          <div key={b.id} {...rowOpen(() => openBatch(b.id), 'panel row')}>
            <div className="batch-head">
              <h3>{b.name} <span className="muted fw4">· {b.year}</span></h3>
              <span className="pill gold">{mem.length}/{b.capacity}</span>
              <button className="btn sec sm" onClick={() => share({ title: 'Yatra ' + b.name, text: yatraText(b) }, 'Details copied')}>Share</button>
              <button className="btn danger sm" onClick={() => confirm('Delete batch? Members become unassigned.', () => update((d) => {
                d.batches = d.batches.filter((x) => x.id !== b.id); d.batch_members = d.batch_members.filter((m) => m.batch_id !== b.id)
              }))}>Delete</button>
            </div>
            <div className="muted batch-meta">{b.travel_date} · {b.vehicle} {b.notes ? '· ' + b.notes : ''}</div>
            {b.gurus.length > 0 && <div className="batch-meta"><b>{b.gurus.length > 1 ? 'Guru Swamys' : 'Guru Swamy'}:</b> {b.gurus.map((g) => g.name + (g.phone ? ' (' + fmtPhone(g.phone) + ')' : '')).join(', ')}</div>}
            {mem.length ? mem.map((d) => (
              <span key={d!.phone} className="pill pill-link" onClick={() => openDevotee(d!.phone)}>{d!.full_name}</span>
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
    const b = id == null ? { year: THIS_YEAR, name: 'Batch ' + (db.batches.length + 1), travel_date: '', vehicle: '', capacity: 45, notes: '', gurus: [] as Guru[] } : db.batches.find((x) => x.id === id)!
    return { name: b.name, year: String(b.year), travel_date: b.travel_date, vehicle: b.vehicle, capacity: String(b.capacity), notes: b.notes, gurus: b.gurus.map((g) => ({ ...g })) }
  })
  const set = (k: 'name' | 'year' | 'travel_date' | 'vehicle' | 'capacity' | 'notes') => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })
  const addGuru = (g: Guru) => setF({ ...f, gurus: [...f.gurus, g] })
  const save = () => {
    const name = f.name.trim(), cap = +f.capacity, yr = +f.year
    if (!name) { toast('Enter batch name'); return }
    if (!(cap > 0)) { toast('Enter a valid capacity'); return }
    if (!(yr > 0)) { toast('Enter a valid year'); return }
    const r = { year: yr, name, travel_date: f.travel_date, vehicle: f.vehicle.trim(), capacity: cap, notes: f.notes.trim(), gurus: f.gurus }
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
      <div className="sub mt12">
        <b>Guru Swamys</b>
        {f.gurus.length > 0 && (
          <div className="mt8">
            {f.gurus.map((g, i) => (
              <div key={g.phone} className="guru-row">
                <div><b>{g.name}</b><div className="muted fs12">{fmtPhone(g.phone)}</div></div>
                <button className="btn danger sm" aria-label={'Remove ' + g.name} title="Remove" onClick={() => setF({ ...f, gurus: f.gurus.filter((_, j) => j !== i) })}>✕</button>
              </div>
            ))}
          </div>
        )}
        <div className="mt8">
          <Field label="Add Guru Swamy from devotees">
            <Select value="" onChange={(e) => { const d = db.devotees.find((x) => x.phone === e.target.value); if (d) addGuru({ name: d.full_name, phone: d.phone }) }}>
              <option value="">Choose devotee…</option>
              {db.devotees.filter((d) => !f.gurus.some((g) => g.phone === d.phone)).map((d) => <option key={d.phone} value={d.phone}>{d.full_name}</option>)}
            </Select>
          </Field>
        </div>
      </div>
      <div className="actbar"><button className="btn" onClick={save}>Save</button><button className="btn sec" onClick={closeDrawer}>Cancel</button></div>
    </>
  )
}
