import { ChangeEvent, ReactNode, useState } from 'react'
import { useAdmin } from './AdminContext'
import { Avatar, Field } from './ui'
import { DeekshaTab, FamilyTab, YatraTab } from './DevoteeTabs'
import { DevoteePaymentsTab } from './ServicePayments'
import { Devotee, GOTHRAMS, NEW_TAG } from './types'
import { blankDevotee, findDevotee, fmtPhone, normPhone } from './utils'

type Tab = 'basics' | 'spiritual' | 'family' | 'payments' | 'yatra'
const TABS: [Tab, string][] = [['basics', 'Basics'], ['spiritual', 'Deeksha'], ['family', 'Family'], ['payments', 'Payments'], ['yatra', 'Yatra']]
const BLOOD = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

type Errs = { nm?: string; gt?: string; ph?: ReactNode }

/** Devotee drawer content: header, tabs, Basics form + child tabs. */
export default function DevoteeForm({ phone }: { phone?: string }) {
  const { db, update, toast, confirm, closeDrawer, openDevotee } = useAdmin()
  const [isNew, setIsNew] = useState(!phone)
  const [orig, setOrig] = useState(phone || '')
  const [tab, setTab] = useState<Tab>('basics')
  const [draft, setDraft] = useState<Devotee>(() => {
    const d = phone ? { ...(findDevotee(db, phone) || blankDevotee()) } : blankDevotee()
    if (phone) d.phone = fmtPhone(d.phone)
    return d
  })
  const [errs, setErrs] = useState<Errs>({})
  const set = (k: keyof Devotee) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setDraft({ ...draft, [k]: e.target.value })

  const onPhoto = (ev: ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => {
      const im = new Image()
      im.onload = () => {
        const c = document.createElement('canvas'), s = 160, k = Math.min(1, s / Math.max(im.width, im.height))
        c.width = im.width * k; c.height = im.height * k
        c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height)
        setDraft((d) => ({ ...d, photo: c.toDataURL('image/jpeg', 0.7) }))
        toast('Photo ready, click Save')
      }
      im.src = r.result as string
    }
    r.readAsDataURL(f)
  }

  const focusId = (id: string) => (document.getElementById(id) as HTMLElement | null)?.focus()

  const save = () => {
    const ph = normPhone(draft.phone)
    const next: Errs = {}
    let bad: string | null = null
    const fail = (k: keyof Errs, msg: string, field: string) => { next[k] = msg; if (!bad) bad = field }
    if (!draft.full_name.trim()) fail('nm', 'Name is required', 'f_full_name')
    if (!(draft.gothram || '').trim()) fail('gt', 'Gothram is required (use Achyuta if unknown)', 'f_gothram')
    if (!ph) fail('ph', 'Enter a valid 10-digit phone', 'f_phone')
    if (bad) { setErrs(next); focusId(bad); return }
    const clash = db.devotees.find((d) => d.phone === ph && d.phone !== orig)
    if (clash) {
      setErrs({ ph: <>Already registered as <b>{clash.full_name}</b>. <a href="#" onClick={(e) => { e.preventDefault(); openDevotee(ph) }}>Open that record</a></> })
      return
    }
    setErrs({})
    const rec: Devotee = {
      phone: ph, full_name: draft.full_name.trim(), email: draft.email, address: draft.address, dob: draft.dob,
      blood_group: draft.blood_group, gothram: draft.gothram, referred_by: (draft.referred_by || '').trim() || NEW_TAG,
      photo: draft.photo, notes: draft.notes, active: draft.active,
    }
    update((d) => {
      if (isNew) d.devotees.push(rec)
      else {
        const i = d.devotees.findIndex((x) => x.phone === orig)
        d.devotees[i] = rec
        if (ph !== orig) { // change-phone cascade
          ;(['family', 'deekshas', 'payments', 'batch_members'] as const).forEach((t) => (d[t] as { phone: string }[]).forEach((r) => { if (r.phone === orig) r.phone = ph }))
        }
      }
    })
    if (!isNew && ph !== orig) toast('Phone changed, all linked records updated')
    closeDrawer()
    toast('Saved')
  }

  const del = () => confirm('Delete ' + draft.full_name + ' and all linked records? This cannot be undone.', () => {
    update((d) => {
      d.devotees = d.devotees.filter((x) => x.phone !== orig)
      ;(['family', 'deekshas', 'payments', 'batch_members'] as const).forEach((t) => { (d as any)[t] = (d[t] as { phone: string }[]).filter((r) => r.phone !== orig) })
    })
    closeDrawer(); toast('Deleted')
  })

  const others = db.devotees.filter((d) => d.phone !== orig).map((d) => d.full_name).sort((a, b) => a.localeCompare(b))

  return (
    <>
      <div className="hdr">
        <Avatar photo={draft.photo} name={draft.full_name} size={46} font={17} />
        <h2>{isNew ? 'New devotee' : draft.full_name}
          <div className="muted" style={{ fontSize: 13, fontWeight: 400 }}>{isNew ? 'Phone number becomes the devotee ID' : <>ID <a href={'tel:+91' + orig.replace(/\D/g, '').slice(-10)}>{fmtPhone(orig)}</a></>}</div>
        </h2>
        <button className="btn sec" onClick={closeDrawer}>Close</button>
      </div>
      <div className="tabs">
        {TABS.map(([k, label]) => (
          <button key={k} className={tab === k ? 'on' : ''} disabled={isNew && k !== 'basics'}
            style={isNew && k !== 'basics' ? { opacity: 0.4, cursor: 'not-allowed' } : undefined} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>
      <div>
        {tab === 'basics' && (
          <>
            <div className="grid2">
              <Field label="Full name *" after={errs.nm && <div className="err" role="alert">{errs.nm}</div>}>
                <input id="f_full_name" value={draft.full_name} onChange={set('full_name')} />
              </Field>
              <Field label="Phone (devotee ID) *" after={errs.ph && <div className="err" role="alert">{errs.ph}</div>}>
                <input id="f_phone" type="tel" inputMode="tel" autoComplete="off" placeholder="98480 11111" value={draft.phone} onChange={set('phone')} />
              </Field>
              <Field label="Email"><input type="email" inputMode="email" autoComplete="off" value={draft.email} onChange={set('email')} /></Field>
              <Field label="Date of birth"><input type="date" value={draft.dob} onChange={set('dob')} /></Field>
              <Field label="Blood group">
                <select value={draft.blood_group} onChange={set('blood_group')}>{BLOOD.map((b) => <option key={b}>{b}</option>)}</select>
              </Field>
              <Field label="Gothram *" after={<>
                <datalist id="gothramList">{GOTHRAMS.map((g) => <option key={g} value={g} />)}</datalist>
                {errs.gt && <div className="err" role="alert">{errs.gt}</div>}</>}>
                <input id="f_gothram" list="gothramList" autoComplete="off" placeholder="Pick or type" value={draft.gothram} onChange={set('gothram')} />
              </Field>
              <Field label="Referred by" after={
                <datalist id="swamyList"><option value={NEW_TAG} />{others.map((n) => <option key={n} value={n} />)}</datalist>}>
                <input list="swamyList" autoComplete="off" placeholder="Pick a swamy or type a name" value={draft.referred_by} onChange={set('referred_by')} />
              </Field>
              <Field label="Status">
                <select value={draft.active === 'no' ? 'no' : 'yes'} onChange={set('active')}>
                  <option value="yes">Active</option><option value="no">Inactive</option>
                </select>
              </Field>
              <Field label="Address" full><textarea rows={2} value={draft.address} onChange={set('address')} /></Field>
              <Field label="Photo" full after={<div className="muted" style={{ fontSize: 12 }}>Prototype stores a small resized copy in this browser.</div>}>
                <input type="file" accept="image/*" onChange={onPhoto} />
              </Field>
              <Field label="Notes" full><textarea rows={2} value={draft.notes} onChange={set('notes')} /></Field>
            </div>
            <div className="actbar">
              <button className="btn" onClick={save}>{isNew ? 'Create devotee' : 'Save changes'}</button>
              <button className="btn sec m-only" onClick={closeDrawer}>Cancel</button>
              {!isNew && <button className="btn danger push" onClick={del}>Delete</button>}
            </div>
          </>
        )}
        {tab === 'spiritual' && <DeekshaTab phone={orig} />}
        {tab === 'family' && <FamilyTab phone={orig} />}
        {tab === 'payments' && <DevoteePaymentsTab phone={orig} />}
        {tab === 'yatra' && <YatraTab phone={orig} />}
        {tab !== 'basics' && <div className="actbar m-only"><button className="btn sec" onClick={closeDrawer}>Close</button></div>}
      </div>
    </>
  )
}
