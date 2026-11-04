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
          <p className="sec-lead">
            Your generous offerings help sustain the divine services, rituals and community programmes of Sree Sastha Anugraha Peetam
          </p>
        </header>

        <div className="donate-wrap">
          <div className="donate-card">
            <div className="donate-icon">📱</div>
            <h3>UPI / QR Payment</h3>
            <img className="upi-qr" src="/assets/upi-qr.webp" alt="UPI QR Code" loading="lazy" decoding="async" />
            <p className="upi-label">UPI ID</p>
            <p className="upi-id-display">{don.upi_id || '9985554047.1@hdfc'}</p>
            <p className="donate-note">Scan the QR with PhonePe, GPay, Paytm or any UPI app</p>
          </div>
        </div>

        <div className="donate-msg reveal">
          <p>🌸 Every offering, however small, is received with divine grace. Donations support Annadanam, Vedic rituals and community spiritual programmes.</p>
          <p className="te te-note">మీ ప్రతి సహకారం భగవంతుడి ఆశీర్వాదంతో వందనీయంగా స్వీకరించబడుతుంది</p>
        </div>
      </div>
    </section>
  )
}
