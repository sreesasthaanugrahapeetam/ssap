import { SocialIcons, YtButton, useSocial } from './socialLinks'

export default function Footer() {
  const social = useSocial(4)
  return (
    <footer>
      <img className="foot-om" src="/assets/logo.webp" alt="" aria-hidden="true" loading="lazy" />
      <div className="foot-en">Sree Sastha Anugraha Peetam</div>
      <div className="foot-te">శ్రీ శాస్త్ర అనుగ్రహ పీఠం</div>
      <div className="foot-mantra">✦ Swamiye Saranam Ayyappa · స్వామియే శరణం అయ్యప్ప ✦</div>
      <div style={{ display: 'flex', gap: '.7rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <YtButton social={social} index={0} />
        <YtButton social={social} index={1} />
      </div>
      <SocialIcons social={social} style={{ marginBottom: '1.5rem' }} />
      <div className="foot-rule"></div>
      <p className="foot-copy">© 2026 Sree Sastha Anugraha Peetam · All Rights Reserved</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', opacity: 0.35, marginTop: '.6rem', pointerEvents: 'none', userSelect: 'none' }} title="Giridhar">
        <img src="/assets/giridhar.webp" alt="" aria-hidden="true" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', filter: 'grayscale(1)' }} />
        <span style={{ fontSize: '.6rem', fontFamily: 'var(--f-head)', letterSpacing: '.06em', color: 'var(--cream)' }}>Giridhar</span>
      </div>
    </footer>
  )
}
