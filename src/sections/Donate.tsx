import { useSheetKV } from '../hooks/useSheet'

export default function Donate() {
  const don = useSheetKV('donations')
  return (
    <section className="section section--alt" id="donate">
      <div className="container">
        <header className="sec-head reveal">
          <span className="sec-icon" aria-hidden="true">🙏</span>
          <h2 className="sec-en">Support the Peetam</h2>
          <div className="sec-te">దానం మరియు సహకారం</div>
          <div className="sec-rule"></div>
          <p style={{ color: 'var(--cream-2)', maxWidth: 580, margin: '.8rem auto 0', fontSize: '1.05rem' }}>
            Your generous offerings help sustain the divine services, rituals and community programmes of Sree Sastha Anugraha Peetam
          </p>
        </header>

        <div style={{ maxWidth: 380, margin: '2.5rem auto 0' }}>
          <div className="donate-card" style={{ textAlign: 'center' }}>
            <div className="donate-icon">📱</div>
            <h3 style={{ textAlign: 'center' }}>UPI / QR Payment</h3>
            <img src="/assets/upi-qr.webp" alt="UPI QR Code" loading="lazy" decoding="async" style={{ display: 'block', width: 210, height: 210, objectFit: 'contain', borderRadius: 10, background: '#fff', padding: 10, margin: '1rem auto' }} />
            <p style={{ fontFamily: 'var(--f-head)', color: 'var(--gold)', fontSize: '.82rem', letterSpacing: '.06em', textTransform: 'uppercase', margin: '.6rem 0 .25rem' }}>UPI ID</p>
            <p className="upi-id-display" style={{ color: 'var(--cream)', fontSize: '1rem', marginBottom: '1.2rem', letterSpacing: '.02em', fontWeight: 600 }}>{don.upi_id || '9985554047.1@hdfc'}</p>
            <p className="donate-note">Scan the QR with PhonePe, GPay, Paytm or any UPI app</p>
          </div>
        </div>

        <div className="donate-msg reveal">
          <p>🌸 Every offering, however small, is received with divine grace. Donations support Annadanam, Vedic rituals and community spiritual programmes.</p>
          <p style={{ fontFamily: 'var(--f-te)', fontSize: '.92rem', color: 'var(--cream-2)', marginTop: '.5rem' }}>మీ ప్రతి సహకారం భగవంతుడి ఆశీర్వాదంతో వందనీయంగా స్వీకరించబడుతుంది</p>
        </div>
      </div>
    </section>
  )
}
