import { slotsFor, type Day, type Donors, type PopInfo } from '../../lib/annadanam'

interface Props { day: Day; donors: Donors; fallback: string; onOpen: (o: PopInfo) => void }

/** The three slot tiles for a day, or a fallback line when none is filled. */
export default function SlotCards({ day, donors, fallback, onOpen }: Props) {
  const items = slotsFor(day, donors)
  if (!items) return <p className="as-open">{fallback}</p>
  return (
    <div className="as-slots">
      {items.map(it => {
        const go = () => onOpen({ date: day.date, day: day.day, label: it.label, list: it.list, name: it.name, free: !it.filled })
        return (
          <div key={it.label} className={'as-slot' + (it.filled ? '' : ' as-free')} role="button" tabIndex={0}
            onClick={go} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go() } }}>
            <h4 aria-level={3}>{it.label.toUpperCase()}</h4>
            <p>{it.filled ? it.name : 'Open for sponsorship'}</p>
            <span className="as-more">{it.filled ? 'VIEW DETAILS ›' : 'SPONSOR THIS SLOT ›'}</span>
          </div>
        )
      })}
    </div>
  )
}
