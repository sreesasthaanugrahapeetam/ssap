import { useSheetKV } from '../hooks/useSheet'
import { YtButton, useSocial } from '../components/socialLinks'

export default function Peetadhipati() {
  const s = useSheetKV('peetadhipati')
  const social = useSocial(0)
  const has = Object.keys(s).length > 0
  const name = (has && s.name_en) || 'Manya Sri Ayyappa Indra Kumar Dev Guru Swamy'
  const yt = (n: 1 | 2) => (has && s['yt' + n + '_url'])
    ? { href: s['yt' + n + '_url'], label: '▶ ' + (s['yt' + n + '_label'] || (n === 1 ? 'Chinmudra TV' : 'Devotional Culture')) }
    : null
  return (
    <section className="section" id="peetadhipati">
      <div className="container">
        <header className="sec-head reveal">
          <span className="sec-icon" aria-hidden="true">🙏</span>
          <h2 className="sec-en">Our Guru Swamy</h2>
          <div className="sec-te">మన గురు స్వామి</div>
          <div className="sec-rule"></div>
        </header>

        <div className="pth-grid">
          <div className="pth-photo-wrap reveal">
            <div className="pth-photo-outer" aria-hidden="true"></div>
            <div className="pth-photo">
              <img src="/assets/founder.webp" alt="Peetadhipati of Sree Sastha Anugraha Peetam" loading="lazy" />
              <div className="pth-label">
                <span className="p-title">Peetadhipati</span>
                <span className="p-name" style={{ fontSize: '.85rem' }}>{name}</span>
              </div>
            </div>
          </div>

          <div className="pth-content reveal">
            <h3>{name}</h3>
            <div className="p-sub">{(has && s.name_te) || 'మాన్య శ్రీ అయ్యప్ప ఇంద్ర కుమార్ దేవ్ గురు స్వామి'}</div>

            {has && s.bio_1 ? <p dangerouslySetInnerHTML={{ __html: s.bio_1 }} /> : (
              <p>Guru Swamy has been observing the sacred <strong style={{ color: 'var(--gold-hi)' }}>Ayyappa Deeksha for 27 continuous years</strong> — a deeply revered spiritual discipline undertaken in complete surrender and devotion to Lord Hari Hara Putra Ayyappa Swamy. This extraordinary commitment stands as a living testament to his unwavering faith at the Lord's lotus feet.</p>
            )}

            {has && s.bio_2 ? <p dangerouslySetInnerHTML={{ __html: s.bio_2 }} /> : (
              <p>Under his divine guidance, Sree Sastha Anugraha Peetam (Regd. No. 11/2026) was established — a sacred space where devotees receive spiritual guidance, Ayyappa Deeksha initiation, and participate in Mandala Kala Deeksha Poojas every season.</p>
            )}

            {has && s.quote ? <blockquote className="pth-quote" dangerouslySetInnerHTML={{ __html: '“' + s.quote + '”' }} /> : (
              <blockquote className="pth-quote">
                "Lord Ayyappa's grace is for every soul. Walk the path of deeksha with a pure heart and the Lord's anugraha will guide you always. Swamiye Saranam Ayyappa."
              </blockquote>
            )}

            <div className="social-row">
              <YtButton social={social} index={0} override={yt(1)} />
              <YtButton social={social} index={1} override={yt(2)} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
