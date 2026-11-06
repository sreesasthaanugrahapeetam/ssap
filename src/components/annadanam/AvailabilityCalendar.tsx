import { useState } from 'react'
import { MONTHS } from '../../lib/annadanam'

const WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const pad = (n: number) => (n < 10 ? '0' : '') + n

interface Props {
  /** Selected "yyyy-mm-dd" or "". */
  value: string
  /** Earliest selectable "yyyy-mm-dd" (today). */
  min: string
  isTaken: (dateKey: string) => boolean
  onPick: (dateKey: string) => void
}

/** Month grid: green = available, red = already booked (disabled), grey = past. */
export default function AvailabilityCalendar({ value, min, isTaken, onPick }: Props) {
  const base = (value || min || new Date().toISOString().slice(0, 10)).split('-').map(Number)
  const [ym, setYm] = useState({ y: base[0], m: base[1] - 1 })
  const first = new Date(Date.UTC(ym.y, ym.m, 1)).getUTCDay()
  const count = new Date(Date.UTC(ym.y, ym.m + 1, 0)).getUTCDate()
  const go = (d: number) => setYm(({ y, m }) => { const t = new Date(Date.UTC(y, m + d, 1)); return { y: t.getUTCFullYear(), m: t.getUTCMonth() } })
  const minYm = min ? +min.slice(0, 4) * 12 + +min.slice(5, 7) - 1 : -Infinity
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)]

  return (
    <div className="ac">
      <div className="ac-head">
        <button type="button" aria-label="Previous month" disabled={ym.y * 12 + ym.m <= minYm} onClick={() => go(-1)}>‹</button>
        <strong>{MONTHS[ym.m]} {ym.y}</strong>
        <button type="button" aria-label="Next month" onClick={() => go(1)}>›</button>
      </div>
      <div className="ac-grid" role="grid">
        {WEEK.map(w => <span key={w} className="ac-w">{w}</span>)}
        {cells.map((d, i) => {
          if (!d) return <span key={'e' + i} />
          const k = ym.y + '-' + pad(ym.m + 1) + '-' + pad(d)
          const past = !!min && k < min
          const taken = !past && isTaken(k)
          const cls = 'ac-d ' + (past ? 'past' : taken ? 'taken' : 'free') + (k === value ? ' sel' : '')
          return (
            <button key={k} type="button" className={cls} disabled={past || taken} aria-pressed={k === value}
              aria-label={d + ' ' + MONTHS[ym.m] + (taken ? ', booked' : past ? ', past' : ', available')}
              onClick={() => onPick(k)}>{d}</button>
          )
        })}
      </div>
      <div className="ac-legend"><span className="free">Available</span><span className="taken">Booked</span></div>
    </div>
  )
}
