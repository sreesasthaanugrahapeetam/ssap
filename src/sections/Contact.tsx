import { useSheetKV } from '../hooks/useSheet'
import { SocialIcons, YtButton, useSocial } from '../components/socialLinks'


export default function Contact() {
  const c = useSheetKV('contact')
  const social = useSocial(2)
  const has = Object.keys(c).length > 0
  const nums = has ? [c.phone_1, c.phone_2].filter(Boolean) : []
  const addrHtml = has && c.address_1
    ? (c.address_1 || '') + '<br>' + (c.address_2 || '') + '<br>' +
      (c.address_te ? `<span class="te te-sm">${c.address_te}</span><br>` : '') + (c.address_3 || '')
    : null
  return (
    <section className="section" id="contact">
      <div className="container">
        <header className="sec-head reveal">
          <span className="sec-icon" aria-hidden="true">📞</span>
          <h2 className="sec-en">Contact Us</h2>
          <div className="sec-te">సంప్రదింపులు</div>
          <div className="sec-rule"></div>
        </header>

        <div className="contact-grid">
          <div className="reveal">
            <h3 className="contact-head">Get in Touch</h3>

            <div className="c-item">
              <span className="c-icon" aria-hidden="true">📍</span>
              <div>
                <h4>Address</h4>
                {addrHtml ? <p className="contact-address" dangerouslySetInnerHTML={{ __html: addrHtml }} /> : (
                  <p className="contact-address">Sree Sastha Anugraha Peetam<br />
                    Sri Srinivas Nagar Park (Shed)<br />
                    <span className="te te-sm">శ్రీ శ్రీనివాస్ నగర్ పార్క్ నందు ఉన్న షెడ్ వద్ద</span><br />
                    Andhra Pradesh / Telangana, India</p>
                )}
              </div>
            </div>

            <div className="c-item">
              <span className="c-icon" aria-hidden="true">📞</span>
              <div>
                <h4>Phone</h4>
                <p className="contact-phones">
                  {nums.length ? nums.map((n, i) => (
                    <span key={i}>{i > 0 && <br />}<a href={'tel:+91' + n.replace(/\D/g, '').replace(/^(91)?(\d{10})$/, '$2')}>{n}</a></span>
                  )) : (<><a href="tel:+918008493089">80084 93089</a><br /><a href="tel:+919989257444">99892 57444</a></>)}
                </p>
              </div>
            </div>

            <div className="c-item">
              <span className="c-icon" aria-hidden="true">📧</span>
              <div>
                <h4>Email</h4>
                <p className="contact-email">{(has && c.email) || 'contact@sreesasthapeetam.org'}</p>
              </div>
            </div>

            <div className="c-item">
              <span className="c-icon" aria-hidden="true">⏰</span>
              <div>
                <h4>Peetam Hours</h4>
                {has && c.hours ? <p className="contact-hours" dangerouslySetInnerHTML={{ __html: c.hours + (c.hours_2 ? '<br>' + c.hours_2 : '') }} /> :
                  <p className="contact-hours">Daily: 6:00 AM – 9:00 PM<br />Open all seven days</p>}
              </div>
            </div>
          </div>

          <div className="contact-box reveal">
            <h3>Find the Peetam</h3>
            <a href={(has && c.maps_url) || 'https://maps.app.goo.gl/Xwtto6qcNGQ3YYC57'} target="_blank" rel="noopener" className="btn-primary maps-btn">
              📍 Get Directions on Google Maps
            </a>
            <p className="map-note">Opens in Google Maps · Works on all devices</p>

            <div className="contact-sep">
              <h4 className="contact-hdr">Follow Us on YouTube</h4>
              <div className="yt-stack">
                <YtButton social={social} index={0} />
                <YtButton social={social} index={1} />
              </div>
            </div>

            <div className="contact-sep">
              <h4 className="contact-hdr">Follow Us on Social Media</h4>
              <SocialIcons social={social} className="start" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
