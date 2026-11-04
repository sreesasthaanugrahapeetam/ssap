import { useSheetKV } from '../hooks/useSheet'

const LIST = [
  'Daily poojas and archanas with authentic Vedic rituals',
  'Ayyappa Deeksha guidance for Sabarimala pilgrims',
  'Mandala and Makara Vilakku special celebrations',
  'Harivarasanam and bhajan sessions for the community',
  'Spiritual discourses and religious education',
]
const CARDS = [
  { t: '🕉 Presiding Deity', p: 'Lord Ayyappa Swamy (Sastha) — divine son of Shiva and Mohini, chief presiding deity of Sabarimala, embodiment of righteousness and grace' },
  { t: '🙏 Our Mission', p: 'To nurture bhakti, propagate spiritual wisdom, and create a sanctuary of peace where every devotee finds the Lord\'s anugraha (grace)' },
  { t: '🌟 Patron Deity Mantra', p: 'ఓం శాస్త్రే నమః · Om Sastre Namah · Swamiye Saranam Ayyappa' },
]

export default function About() {
  const a = useSheetKV('about')
  return (
    <section className="section section--alt2" id="about">
      <div className="container">
        <header className="sec-head reveal">
          <img className="sec-icon" src="/assets/logo.webp" alt="" aria-hidden="true" style={{ width: '2.2rem', height: '2.2rem', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(201,162,39,.5)', display: 'inline-block' }} />
          <h2 className="sec-en">About the Peetam</h2>
          <div className="sec-te">పీఠం గురించి</div>
          <div className="sec-rule"></div>
        </header>

        <div className="about-grid">
          <div className="about-body reveal">
            {a.para_1 ? <p dangerouslySetInnerHTML={{ __html: a.para_1 }} /> : (
              <p>
                Sree Sastha Anugraha Peetam is a sacred spiritual centre consecrated to Lord Ayyappa Swamy — Sastha — the eternal celibate deity who embodies dharma, devotion, and boundless compassion. Born of the divine union of Lord Shiva and Mohini (Lord Vishnu's feminine form), Ayyappa Swamy is worshipped across all communities, transcending caste and creed.
              </p>
            )}
            {a.para_2 ? <p dangerouslySetInnerHTML={{ __html: a.para_2 }} /> : (
              <p>
                Established with the divine blessings of Lord Sastha, this Peetam stands as a beacon of spiritual light — guiding devotees, conducting sacred rituals in full Vedic tradition, and nurturing the timeless bond between the devotee and the divine.
              </p>
            )}
            <ul className="about-list" aria-label="Features">
              {LIST.map((d, i) => <li key={i}>{a['list_' + (i + 1)] || d}</li>)}
            </ul>
          </div>

          <div className="info-cards reveal">
            {CARDS.map((c, i) => {
              const t = a['card' + (i + 1) + '_title'], p = a['card' + (i + 1) + '_text']
              return (
                <div className="info-card" key={i}>
                  {t ? <h4 aria-level={3} dangerouslySetInnerHTML={{ __html: t }} /> : <h4 aria-level={3}>{c.t}</h4>}
                  {p ? <p dangerouslySetInnerHTML={{ __html: p }} /> :
                    i === 2 ? <p style={{ fontFamily: 'var(--f-te)', fontSize: '.96rem', lineHeight: 1.7 }}>{c.p}</p> : <p>{c.p}</p>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
