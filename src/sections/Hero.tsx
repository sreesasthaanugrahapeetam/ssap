import { useSheetKV } from '../hooks/useSheet'

export default function Hero() {
  const hero = useSheetKV('hero')
  return (
    <section id="hero" aria-label="Temple hero">
      <div className="hero-bg-glow" aria-hidden="true"></div>
      <div className="hero-content">
        <div className="deity-wrap" aria-hidden="true">
          <div className="deity-halo"></div>
          <div className="deity-outer-ring"></div>
          <div className="deity-mid-ring"></div>
          <div className="deity-circle">
            <img className="deity-img" src="/assets/logo.webp" alt="Sree Sastha Anugraha Peetam — Lord Sastha Swamy" />
          </div>
        </div>
        <div className="lotus-row" aria-hidden="true">🪷&nbsp;🪔&nbsp;🪷&nbsp;🪔&nbsp;🪷</div>

        <h1 className="hero-name-en">{hero.name_en || 'Sree Sastha Anugraha Peetam'}</h1>
        <div className="hero-name-te">{hero.name_te || 'శ్రీ శాస్త్ర అనుగ్రహ పీఠం'}</div>

        <div className="orn" aria-hidden="true">✦ ✦ ✦</div>

        <div className="hero-mantra-en">{hero.mantra_en || 'Swamiye Saranam Ayyappa'}</div>
        <div className="hero-mantra-te">{hero.mantra_te || 'స్వామియే శరణం అయ్యప్ప'}</div>

        <div className="hero-cta">
          <a href="#services" className="btn-primary">View Poojas &amp; Sevas</a>
          <a href="#contact" className="btn-outline">Visit the Peetam</a>
        </div>
      </div>

      <div className="scroll-hint" aria-hidden="true">
        <span>EXPLORE</span>
        <span>↓</span>
      </div>
    </section>
  )
}
