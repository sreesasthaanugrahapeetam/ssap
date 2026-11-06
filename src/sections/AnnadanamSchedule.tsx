import { useCallback, useEffect, useMemo, useState } from 'react'
import DonorForm from '../components/annadanam/DonorForm'
import DonorPopup from '../components/annadanam/DonorPopup'
import SlotCards from '../components/annadanam/SlotCards'
import {
  DONOR_FORM_URL, MONTHS, SCHEDULE_GID, UPCOMING_DAYS, istToday, parseDonors, parseSchedule,
  type Day, type Donor, type Donors, type PopInfo
} from '../lib/annadanam'
import { ANNADANAM_SHEET_ID, fetchSheet, parseCSV } from '../lib/sheets'

function DateHead({ d }: { d: Day }) {
  return (
    <div className="as-date">
      {d.date.getUTCDate() + ' ' + MONTHS[d.date.getUTCMonth()] + ' ' + d.date.getUTCFullYear()}
      {d.day && <small>{d.day}</small>}
    </div>
  )
}

export default function AnnadanamSchedule() {
  const [days, setDays] = useState<Day[] | null>(null) // null = no schedule data -> section stays hidden
  const [donors, setDonors] = useState<Donors>({})
  const [pop, setPop] = useState<PopInfo | null>(null)
  const [popOpen, setPopOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [pre, setPre] = useState<{ date?: string; slot?: string }>({})

  useEffect(() => {
    let live = true
    ;(async () => {
      const dp = fetchSheet('donors', ANNADANAM_SHEET_ID).then(parseDonors)
      try {
        const r = await fetch('https://docs.google.com/spreadsheets/d/' + ANNADANAM_SHEET_ID + '/gviz/tq?tqx=out:csv&headers=0&gid=' + SCHEDULE_GID)
        if (!r.ok) throw new Error(String(r.status))
        const text = await r.text()
        const dn = await dp
        if (live) { setDonors(dn); setDays(parseSchedule(parseCSV(text))) }
      } catch {
        if (live) setDays(null)
      }
    })()
    return () => { live = false }
  }, [])

  const openPop = useCallback((o: PopInfo) => { setPop(o); setPopOpen(true) }, [])
  const closePop = useCallback(() => setPopOpen(false), [])
  const openForm = useCallback((p?: { date?: string; slot?: string }) => {
    if (!DONOR_FORM_URL) return
    setPre(p || {}); setFormOpen(true)
  }, [])
  const closeForm = useCallback(() => setFormOpen(false), [])
  const onSaved = useCallback((key: string, d: Donor | null) => {
    if (d) setDonors(m => ({ ...m, [key]: [...(m[key] || []), d] }))
  }, [])

  const { todayDay, upcoming } = useMemo(() => {
    const t = istToday(), dayMs = 86400000
    const byTime: Record<number, Day> = {}
    ;(days || []).forEach(d => { byTime[d.date.getTime()] = d })
    const pick = (ms: number): Day => byTime[ms] || { date: new Date(ms), day: '', cols: [] }
    return { todayDay: pick(t), upcoming: Array.from({ length: UPCOMING_DAYS }, (_, i) => pick(t + (i + 1) * dayMs)) }
  }, [days])

  return (
    <section className="section" id="annadanam-schedule" aria-label="Annadanam schedule" hidden={!days}>
      <div className="container">
        <header className="sec-head reveal in">
          <span className="sec-icon" aria-hidden="true">🍽️</span>
          <h2 className="sec-en">Annadathalu</h2>
          <div className="sec-te">అన్నదాతలు</div>
          <div className="sec-rule"></div>
        </header>
        <div id="as-today">
          {days && (
            <div className="as-today reveal in">
              <div className="as-badge">TODAY'S ANNADANAM</div>
              <DateHead d={todayDay} />
              <SlotCards day={todayDay} donors={donors} fallback="No donor listed for today yet." onOpen={openPop} />
            </div>
          )}
        </div>
        <h3 className="as-sub" id="as-upcoming-title">UPCOMING ANNADANAM</h3>
        <div className="as-upcoming" id="as-upcoming">
          {days && upcoming.map(d => (
            <div className="as-day reveal in" key={d.date.getTime()}>
              <DateHead d={d} />
              <SlotCards day={d} donors={donors} fallback="Open for sponsorship" onOpen={openPop} />
            </div>
          ))}
        </div>
        <p className="as-open">Want to sponsor Annadanam on a day with no donor? <a href="#contact">Contact us to book your slot</a>.</p>
        <div className="as-add" id="as-add" hidden={!DONOR_FORM_URL}>
          <button type="button" id="as-add-btn" onClick={() => openForm()}>+ ADD DONOR DETAILS</button>
        </div>
      </div>
      <DonorPopup info={pop} open={popOpen} onClose={closePop} onAddDonor={openForm} />
      {DONOR_FORM_URL && <DonorForm open={formOpen} pre={pre} days={days} donors={donors} onClose={closeForm} onSaved={onSaved} />}
    </section>
  )
}
