import { useAdmin } from './AdminContext'
import { AddDeekshaBox, DeekshaPill, Field } from './ui'
import { Deeksha, FamilyMember, THIS_YEAR } from './types'
import { batchOf, fmtPhone, normPhone, todayISO } from './utils'
import { Select } from './Select'
import { yatraText } from './yatraShare'
import { useShare } from './useShare'

export function DeekshaTab({ phone }: { phone: string }) {
  const { db, update, toast, showModal } = useAdmin()
  const list = db.deekshas.filter((x) => x.phone === phone).sort((a, b) => b.year - a.year)
  const upd = (year: number, k: keyof Deeksha, v: string | number) => {
    update((d) => { const r = d.deekshas.find((x) => x.phone === phone && x.year === year); if (r) (r as any)[k] = v })
    toast('Saved')
  }
  const add = (y: number) => {
    if (!(y > 0)) { toast('Enter a valid year'); return false }
    if (db.deekshas.some((x) => x.phone === phone && x.year === y)) { toast('Year already exists'); return false }
    update((d) => { d.deekshas.push({ phone, year: y, malai_date: '', end_date: '', mandala_days: 41, irumudi_date: '' }) })
    return true
  }
  return (
    <>
      {list.map((x) => (
        <div className="sub" key={x.year}>
          <b>{x.year}</b> <DeekshaPill dk={x} />
          <div className="grid2 mt8">
            <Field label="Malai date"><input type="date" value={x.malai_date} onChange={(e) => upd(x.year, 'malai_date', e.target.value)} /></Field>
            <Field label="Irumudi date"><input type="date" value={x.irumudi_date} onChange={(e) => upd(x.year, 'irumudi_date', e.target.value)} /></Field>
            <Field label="Mandala days">
              <Select value={x.mandala_days} onChange={(e) => upd(x.year, 'mandala_days', +e.target.value)}>
                {[41, 48, 21, 11].map((n) => <option key={n}>{n}</option>)}
              </Select>
            </Field>
            <Field label="Completed on"><input type="date" value={x.end_date} onChange={(e) => upd(x.year, 'end_date', e.target.value)} /></Field>
          </div>
          <button className="btn danger sm mt8"
            onClick={() => update((d) => { d.deekshas = d.deekshas.filter((r) => !(r.phone === phone && r.year === x.year)) })}>Remove</button>
        </div>
      ))}
      <button className="btn sec" onClick={() => showModal(<AddDeekshaBox onAdd={add} />)}>+ Add deeksha year</button>
    </>
  )
}

export function FamilyTab({ phone }: { phone: string }) {
  const { db, update } = useAdmin()
  const list = db.family.map((f, i) => ({ f, i })).filter((x) => x.f.phone === phone)
  const set = (i: number, patch: Partial<FamilyMember>) => update((d) => { Object.assign(d.family[i], patch) })
  return (
    <>
      {list.map(({ f, i }) => (
        // remounts when a committed value changes so uncontrolled inputs pick up normalised values
        <div className="sub" key={`${i}|${f.name}|${f.relation}|${f.member_phone}|${f.emergency}`}>
          <div className="grid2">
            <Field label="Name"><input defaultValue={f.name} onBlur={(e) => e.target.value !== f.name && set(i, { name: e.target.value })} /></Field>
            <Field label="Relation"><input defaultValue={f.relation} onBlur={(e) => e.target.value !== f.relation && set(i, { relation: e.target.value })} /></Field>
            <Field label="Phone (optional)"><input defaultValue={fmtPhone(f.member_phone)} onBlur={(e) => { const v = normPhone(e.target.value); v !== f.member_phone && set(i, { member_phone: v }) }} /></Field>
            <Field label="Emergency contact">
              <Select value={f.emergency === 'yes' ? 'yes' : 'no'} onChange={(e) => set(i, { emergency: e.target.value })}>
                <option value="no">No</option><option value="yes">Yes</option>
              </Select>
            </Field>
          </div>
          <button className="btn danger sm mt8" onClick={() => update((d) => { d.family.splice(i, 1) })}>Remove</button>
        </div>
      ))}
      <button className="btn sec" onClick={() => update((d) => { d.family.push({ phone, name: '', relation: '', member_phone: '', emergency: 'no' }) })}>+ Add family member</button>
      <div className="muted fs12 mt8">Kids / elders without own phone live here, under the family head.</div>
    </>
  )
}

export function YatraTab({ phone }: { phone: string }) {
  const { db, update, toast } = useAdmin()
  const share = useShare()
  const cur = batchOf(db, phone), bs = db.batches.filter((b) => b.year === THIS_YEAR)
  const past = db.batch_members.filter((m) => m.phone === phone).map((m) => db.batches.find((b) => b.id === m.batch_id)).filter((b) => b && b.year !== THIS_YEAR)
  const setBatch = (id: string) => {
    update((d) => {
      d.batch_members = d.batch_members.filter((m) => !(m.phone === phone && (d.batches.find((b) => b.id === m.batch_id) || ({} as any)).year === THIS_YEAR))
      if (id) d.batch_members.push({ batch_id: +id, phone })
    })
    toast('Batch updated')
  }
  return (
    <>
      <div className="sub">
        <Field label={`Sabarimala batch ${THIS_YEAR}`}>
          <Select value={cur ? cur.id : ''} onChange={(e) => setBatch(e.target.value)}>
            <option value="">Not assigned</option>
            {bs.map((b) => {
              const n = db.batch_members.filter((m) => m.batch_id === b.id).length
              return <option key={b.id} value={b.id}>{b.name} · {b.travel_date} ({n}/{b.capacity})</option>
            })}
          </Select>
        </Field>
      </div>
      {cur && (
        <div className="sub">
          <b>{cur.gurus.length > 1 ? 'Guru Swamys' : 'Guru Swamy'}</b>
          {cur.gurus.length ? cur.gurus.map((g, i) => (
            <div key={i}>{g.name}{g.phone && <> · <a href={'tel:+91' + g.phone.replace(/\D/g, '').slice(-10)}>{fmtPhone(g.phone)}</a></>}</div>
          )) : <div className="muted">None added. Add them on the Batches page.</div>}
          <button className="btn sec sm mt8" onClick={() => share({ title: 'Yatra ' + cur.name, text: yatraText(cur) }, 'Details copied')}>Share yatra details</button>
        </div>
      )}
      <div className="muted">Past batches</div>
      {past.length ? past.map((b) => <div className="sub" key={b!.id}>{b!.name} · {b!.year}</div>) : <div className="muted">None.</div>}
    </>
  )
}

/** Poojas this devotee is tagged to. Tag / untag from here, or from the pooja form. */
export function PoojasTab({ phone }: { phone: string }) {
  const { db, update, toast } = useAdmin()
  const today = todayISO()
  const mine = db.poojas.filter((p) => p.phones.includes(phone)).sort((a, b) => a.date.localeCompare(b.date))
  const untagged = db.poojas.filter((p) => !p.phones.includes(phone) && p.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const tag = (id: string) => {
    if (!id) return
    update((d) => { d.poojas.find((p) => p.id === +id)?.phones.push(phone) })
    toast('Tagged')
  }
  const untag = (id: number) => update((d) => { const p = d.poojas.find((x) => x.id === id); if (p) p.phones = p.phones.filter((x) => x !== phone) })
  return (
    <>
      {mine.length ? mine.map((p) => (
        <div className="sub" key={p.id}>
          <b>{p.kind}</b> <span className="pill gold">{p.date} · {p.session}</span>{p.date < today && <> <span className="pill">past</span></>}
          <div className="muted fs12">{[p.venue, p.notes].filter(Boolean).join(' · ')}</div>
          <button className="btn danger sm mt8" onClick={() => untag(p.id)}>Remove</button>
        </div>
      )) : <div className="muted">Not tagged to any pooja.</div>}
      <div className="sub mt12">
        <Field label="Tag to an upcoming pooja">
          <Select value="" onChange={(e) => tag(e.target.value)}>
            <option value="">{untagged.length ? 'Choose pooja…' : 'No upcoming poojas to tag'}</option>
            {untagged.map((p) => <option key={p.id} value={p.id}>{p.kind} · {p.date} · {p.session}</option>)}
          </Select>
        </Field>
      </div>
    </>
  )
}
