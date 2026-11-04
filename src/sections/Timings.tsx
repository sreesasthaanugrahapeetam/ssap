import { useSheetKV, useSheetRows } from '../hooks/useSheet'
import { useReveal } from '../hooks/useReveal'

const DEFAULT = [
  ['☀️', 'Morning Poojas', '5:00 AM – 10:00 AM', 'Morning rituals, Archana and Abhishekam for devotees. All are welcome to participate with devotion'],
  ['🌆', 'Evening Sevas', '6:00 PM – 9:00 PM', 'Deeparadhana, Athazhapuja, and Bhajans. Devotees may offer flower garlands and participate in arti'],
  ['🌙', 'Harivarasanam', '8:30 PM', 'The divine lullaby — Harivarasanam is sung as the Lord is put to rest. Sanctum closes after Thrippuka Pooja'],
]

export default function Timings() {
  const rows = useSheetRows('timings')
  const c = useSheetKV('contact')
  const cms = rows && rows.length > 1 ? rows.slice(1) : null
  const list = cms ?? DEFAULT
  useReveal([cms])
  const has = Object.keys(c).length > 0
  return (
    <section className="section section--alt2" id="timings">
      <div className="container">
        <header className="sec-head reveal">
          <span className="sec-icon" aria-hidden="true">🪔</span>
          <h2 className="sec-en">Darshan Timings</h2>
          <div className="sec-te">దర్శన సమయాలు</div>
          <div className="sec-rule"></div>
        </header>

        <div className="timing-location-note reveal" style={{ background: 'rgba(201,162,39,.07)', border: '1px solid rgba(201,162,39,.2)', borderRadius: 8, padding: '1rem 1.4rem', marginBottom: '1.8rem', textAlign: 'center' }}>
          <span style={{ fontFamily: 'var(--f-head)', color: 'var(--gold)', fontSize: '.82rem', letterSpacing: '.05em' }}>📍 PEETAM LOCATION</span>
          <p style={{ color: 'var(--cream-2)', fontSize: '.93rem', margin: '.5rem 0 0', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--gold-hi)' }}>During Mandala Kalam:</strong> <span className="mandala-location">{(has && c.mandala_location) || 'Sri Srinivas Nagar Park Shed'}</span> &nbsp;·&nbsp;{' '}
            <strong style={{ color: 'var(--gold-hi)' }}>Other Times:</strong> <span className="normal-location">{(has && c.normal_location) || 'Sreehomes Apartment Terrace'}</span>
          </p>
        </div>
        <div className="timings-grid">
          {list.map(([icon, title, time, desc], i) => (
            <div className="timing-card reveal" key={cms ? 'c' + i : 'd' + i}>
              <div className="t-icon">{icon || '🪔'}</div>
              {cms ? <h3 dangerouslySetInnerHTML={{ __html: title || '' }} /> : <h3>{title}</h3>}
              <div className="t-time" dangerouslySetInnerHTML={{ __html: time || '' }} />
              <p dangerouslySetInnerHTML={{ __html: desc || '' }} />
            </div>
          ))}
        </div>
        <p className="timing-note">{(has && c.timing_note) || '* Timings may vary on festival days, Mandala season and special occasions. Please call ahead to confirm.'}</p>
      </div>
    </section>
  )
}
