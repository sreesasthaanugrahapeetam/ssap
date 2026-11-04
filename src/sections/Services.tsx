import { useSheetRows } from '../hooks/useSheet'
import { useReveal } from '../hooks/useReveal'

const DEFAULT = [
  ['🪷', 'Abhishekam', 'అభిషేకం', 'Sacred bathing of the Lord with Panchamrita — milk, curd, honey, ghee and sugar — accompanied by Vedic hymns'],
  ['🌺', 'Archana', 'అర్చన', 'Offering flowers with 108 or 1008 divine names of Lord Ayyappa chanted with reverence and bhakti'],
  ['🔥', 'Homam', 'హోమం', 'Sacred fire rituals — Ganapathi Homam, Ayyappa Homam, Mrityunjaya Homam — for health, prosperity and liberation'],
  ['🪔', 'Deeparadhana', 'దీపారాధన', 'The evening lamp ceremony — the Lord is honoured with camphor flames, conch blows and devotional singing'],
  ['🕉️', 'Padi Pooja', 'పడి పూజ', "Sacred worship of the eighteen holy steps (Padi) with lamps, flowers, Ayyappa bhajans and Harivarasanam, performed at the Peetam or at devotees' homes"],
  ['🎗️', 'Deeksha Guidance', 'దీక్ష మార్గదర్శనం', 'Complete guidance and initiation for the 41-day Sabarimala Deeksha, including Irumudi preparation and Vratha rules'],
  ['🌙', 'Mandala Poojas', 'మండల పూజలు', 'Grand 41-day Mandala season celebrations with special rituals, annadanam and community gatherings'],
  ['🏺', 'Ashta Kalasa Pooja', 'అష్ట కలశ పూజ', 'Eight sacred kalasams filled with holy water are invoked and offered to the Lord with Vedic mantras for peace, prosperity and well-being'],
]

export default function Services() {
  const rows = useSheetRows('poojas')
  const cms = rows && rows.length > 1 ? rows.slice(1) : null
  const list = cms ?? DEFAULT
  useReveal([cms])
  return (
    <section className="section section--alt" id="services">
      <div className="container">
        <header className="sec-head reveal">
          <span className="sec-icon" aria-hidden="true">🌸</span>
          <h2 className="sec-en">Poojas &amp; Sevas</h2>
          <div className="sec-te">పూజలు మరియు సేవలు</div>
          <div className="sec-rule"></div>
          <p style={{ color: 'var(--cream-2)', maxWidth: 580, margin: '.8rem auto 0', fontSize: '1.05rem' }}>
            Sacred rituals performed with full Vedic tradition, devotion and purity for the welfare of every devotee
          </p>
        </header>

        <div className="services-grid">
          {list.map(([icon, nameEn, nameTe, desc], i) => (
            <div className="svc-card reveal" key={cms ? 'c' + i : 'd' + i}>
              <div className="svc-icon">{icon || '🌸'}</div>
              <h3 dangerouslySetInnerHTML={{ __html: nameEn || '' }} />
              <div className="svc-te" dangerouslySetInnerHTML={{ __html: nameTe || '' }} />
              <p dangerouslySetInnerHTML={{ __html: desc || '' }} />
            </div>
          ))}
        </div>

        <div className="svc-cta reveal">
          <a href="#contact" className="btn-primary">Book a Pooja</a>
        </div>
      </div>
    </section>
  )
}
