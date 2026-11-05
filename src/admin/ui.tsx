import { cloneElement, ReactElement, ReactNode, useEffect, useId, useRef, useState, FormEvent } from 'react'
import { useAdmin } from './AdminContext'
import { Deeksha, THIS_YEAR } from './types'
import { daysLeft, initials } from './utils'

/** Label linked to its single control child (id + aria-required). */
export function Field({ label, full, after, children }: { label: string; full?: boolean; after?: ReactNode; children: ReactElement }) {
  const gen = useId()
  const id = (children.props as { id?: string }).id || gen
  const extra: Record<string, unknown> = { id }
  if (/\*/.test(label)) extra['aria-required'] = 'true'
  return (
    <div className={full ? 'full' : undefined}>
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, extra)}
      {after}
    </div>
  )
}

export function Avatar({ photo, name, large }: { photo?: string; name?: string; large?: boolean }) {
  return <span className={large ? 'avatar lg' : 'avatar'}>{photo ? <img src={photo} alt="" /> : initials(name)}</span>
}

export function DeekshaPill({ dk }: { dk?: Deeksha }) {
  if (!dk) return <span className="pill">—</span>
  if (dk.end_date) return <span className="pill ok">Completed {dk.year}</span>
  const left = daysLeft(dk)
  if (left == null) return <span className="pill">—</span>
  if (new Date(dk.malai_date) > new Date()) return <span className="pill gold">Starts {dk.malai_date}</span>
  return left >= 0
    ? <span className="pill gold">Day {(+dk.mandala_days) - left} / {dk.mandala_days}</span>
    : <span className="pill warn">Overdue</span>
}

export function ConfirmBox({ msg, label, onOk }: { msg: string; label?: string; onOk: () => void }) {
  const { closeModal } = useAdmin()
  return (
    <div className="box" role="dialog" aria-modal="true">
      <h3>Please confirm</h3>
      <div>{msg}</div>
      <div className="acts">
        <button className="btn sec" onClick={closeModal}>Cancel</button>
        <button className="btn danger" onClick={() => { closeModal(); onOk() }}>{label || 'Delete'}</button>
      </div>
    </div>
  )
}

export function AddDeekshaBox({ onAdd }: { onAdd: (year: number) => boolean }) {
  const { closeModal } = useAdmin()
  const [year, setYear] = useState(String(THIS_YEAR))
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus() }, [])
  const submit = (e: FormEvent) => { e.preventDefault(); if (onAdd(+year)) closeModal() }
  return (
    <form className="box" role="dialog" aria-modal="true" onSubmit={submit}>
      <h3>Add deeksha year</h3>
      <Field label="Year"><input ref={ref} type="number" min="2000" value={year} onChange={(e) => setYear(e.target.value)} /></Field>
      <div className="acts">
        <button type="button" className="btn sec" onClick={closeModal}>Cancel</button>
        <button className="btn">Add</button>
      </div>
    </form>
  )
}

/** Props that make a whole table row (or card) open its editor on click / Enter. Clicks on inner buttons, links and pills are ignored. */
export const rowOpen = (open: () => void, className = 'row') => ({
  className,
  tabIndex: 0,
  onClick: (e: React.MouseEvent) => { if (!(e.target as HTMLElement).closest('button,a,input,select,.pill-link')) open() },
  onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' && e.target === e.currentTarget) open() },
})
