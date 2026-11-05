import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { DONOR_FORM_URL, REL, compress, dkey, famText, istToday, type Donor, type FamRow } from '../../lib/annadanam'
import Svg from './Svg'
import { useModalLock } from './useModalLock'

let fcfg: Promise<{ requirePasscode?: boolean }> | null = null
let famId = 0

interface Props {
  open: boolean
  pre: { date?: string; slot?: string }
  onClose: () => void
  /** Called after a successful save; donor is null when the entry is held for review. */
  onSaved: (key: string, donor: Donor | null) => void
}

export default function DonorForm({ open, pre, onClose, onSaved }: Props) {
  const popRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [date, setDate] = useState('')
  const [minDate, setMinDate] = useState('')
  const [slot, setSlot] = useState('Morning')
  const [nameEn, setNameEn] = useState('')
  const [nameTe, setNameTe] = useState('')
  const [gothEn, setGothEn] = useState('')
  const [gothTe, setGothTe] = useState('')
  const [fam, setFam] = useState<FamRow[]>([])
  const [preview, setPreview] = useState('')
  const [pass, setPass] = useState('')
  const [needPass, setNeedPass] = useState(false)
  const [hp, setHp] = useState('')
  const [msg, setMsg] = useState<{ t: string; c: string }>({ t: '', c: '' })
  const [saving, setSaving] = useState(false)

  useModalLock(open)

  useEffect(() => {
    if (!open || !DONOR_FORM_URL) return
    setNameEn(''); setNameTe(''); setGothEn(''); setGothTe(''); setFam([])
    if (fileRef.current) fileRef.current.value = ''
    setPreview(''); setMsg({ t: '', c: '' }); setHp(''); setSaving(false)
    const t = new Date(istToday())
    setDate(pre.date || dkey(t)); setMinDate(dkey(t))
    setSlot(pre.slot || 'Morning')
    if (!fcfg) fcfg = fetch(DONOR_FORM_URL).then(r => r.json()).catch(() => ({}))
    let live = true
    fcfg.then(c => { if (live) setNeedPass(!!(c && c.requirePasscode)) })
    nameRef.current?.focus()
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      const fpop = popRef.current; if (!fpop) return
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      else if (e.key === 'Tab') {
        const f = Array.from(fpop.querySelectorAll<HTMLElement>('input:not([tabindex="-1"]), select, button')).filter(x => !(x as HTMLInputElement).disabled && x.offsetParent && getComputedStyle(x).visibility !== 'hidden')
        if (!f.length) return
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && (document.activeElement === first || !fpop.contains(document.activeElement))) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && (document.activeElement === last || !fpop.contains(document.activeElement))) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const say = (t: string, c = '') => setMsg({ t, c })
  const upd = (id: number, k: 'rel' | 'en' | 'te', v: string) => setFam(rs => rs.map(r => (r.id === id ? { ...r, [k]: v } : r)))

  async function submit() {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
    if (!m) return say('Please choose a date.', 'err')
    const en = nameEn.trim(), te = nameTe.trim()
    if (!en && !te) return say('Please enter the donor name.', 'err')
    setSaving(true); say('Saving…')
    try {
      const body: Record<string, unknown> = {
        date: m[3] + '-' + m[2] + '-' + m[1], slot, name_en: en, name_te: te,
        gothram_en: gothEn.trim(), gothram_te: gothTe.trim(),
        family_en: famText(fam, 'en'), family_te: famText(fam, 'te'), passcode: pass, website: hp
      }
      const file = fileRef.current?.files?.[0]
      if (file) body.photo = { data: await compress(file), type: 'image/jpeg' }
      const r = await fetch(DONOR_FORM_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      const j = await r.json()
      if (!j.ok) throw new Error(j.error || 'Could not save.')
      const d: Donor = { name_en: en, name_te: te, gothram_en: body.gothram_en as string, gothram_te: body.gothram_te as string, family_en: body.family_en as string, family_te: body.family_te as string, photo: j.photo || '' }
      onSaved(date + '|' + slot.toLowerCase(), j.hidden === true ? null : d)
      say(j.hidden === true ? 'Saved. It will appear after review.' : 'Saved. Thank you!', 'ok')
      setTimeout(onClose, 1400)
    } catch (e) {
      setSaving(false)
      say(e instanceof Error && e.message ? e.message : 'Could not save. Please try again.', 'err')
    }
  }

  return createPortal(
    <div id="df-pop" ref={popRef} className={open ? 'open' : ''} role="dialog" aria-modal="true" aria-label="Add donor details"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="df-card">
        <button className="df-x" type="button" aria-label="Close" onClick={onClose}><Svg d="M6 6l12 12M18 6L6 18" /></button>
        <h3>Add Donor Details</h3>
        <div className="df-te">అన్నదాత వివరాలు నమోదు చేయండి</div>
        <div className="df-grid">
          <div className="df-f"><label>Date<i> *</i></label><input type="date" autoComplete="off" value={date} min={minDate} onChange={e => setDate(e.target.value)} /></div>
          <div className="df-f"><label>Meal<i> *</i></label>
            <select value={slot} onChange={e => setSlot(e.target.value)}>
              {['Morning', 'Afternoon', 'Evening'].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="df-f"><label>Donor name (English)<i> *</i></label><input type="text" autoComplete="off" placeholder="e.g. Ramesh Kumar" ref={nameRef} value={nameEn} onChange={e => setNameEn(e.target.value)} /></div>
          <div className="df-f"><label>Donor name (తెలుగు)</label><input type="text" autoComplete="off" className="te" placeholder="తెలుగులో పేరు" value={nameTe} onChange={e => setNameTe(e.target.value)} /></div>
          <div className="df-f"><label>Gothram (English)</label><input type="text" autoComplete="off" placeholder="e.g. Kaushika" value={gothEn} onChange={e => setGothEn(e.target.value)} /></div>
          <div className="df-f"><label>Gothram (తెలుగు)</label><input type="text" autoComplete="off" className="te" placeholder="గోత్రం" value={gothTe} onChange={e => setGothTe(e.target.value)} /></div>

          <div className="df-f full">
            <div className="df-h">Family members (optional)</div>
            <div>
              {fam.map(r => (
                <div className="df-fam" key={r.id}>
                  <select value={r.rel} onChange={e => upd(r.id, 'rel', e.target.value)}>
                    {REL.map(p => <option key={p[0]} value={p[0]}>{p[0]}</option>)}
                  </select>
                  <input type="text" autoComplete="off" placeholder="Name (English)" autoFocus value={r.en} onChange={e => upd(r.id, 'en', e.target.value)} />
                  <input type="text" autoComplete="off" className="te" placeholder="పేరు (తెలుగు)" value={r.te} onChange={e => upd(r.id, 'te', e.target.value)} />
                  <button type="button" aria-label="Remove" onClick={() => setFam(rs => rs.filter(x => x.id !== r.id))}>×</button>
                </div>
              ))}
            </div>
            <button type="button" className="df-btn df-btn-add" onClick={() => setFam(rs => [...rs, { id: ++famId, rel: REL[0][0], en: '', te: '' }])}>+ Add family member</button>
          </div>

          <div className="df-f full">
            <label>Donor photo (optional)</label>
            <div className="df-photo">
              <img alt="" src={preview || undefined} className={preview ? 'show' : undefined} />
              <input type="file" autoComplete="off" accept="image/*" ref={fileRef} onChange={e => {
                const f = e.target.files?.[0]
                setPreview(prev => { if (prev) URL.revokeObjectURL(prev); return f ? URL.createObjectURL(f) : '' })
              }} />
            </div>
          </div>

          <div className="df-f full" hidden={!needPass}><label>Passcode<i> *</i></label><input type="password" autoComplete="off" placeholder="Passcode" value={pass} onChange={e => setPass(e.target.value)} /></div>
        </div>
        <input type="text" className="df-hp" tabIndex={-1} aria-hidden="true" name="website" autoComplete="off" value={hp} onChange={e => setHp(e.target.value)} />
        <div className={'df-msg' + (msg.c ? ' ' + msg.c : '')} role="status">{msg.t}</div>
        <div className="df-actions">
          <button type="button" className="df-btn df-submit" disabled={saving} onClick={submit}>SAVE DONOR DETAILS</button>
          <button type="button" className="df-btn" onClick={onClose}>CANCEL</button>
        </div>
        <div className="df-note">Details are saved to the Peetam’s sheet and can be edited there later.</div>
      </div>
    </div>,
    document.body
  )
}
