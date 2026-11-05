import { useReveal } from '../hooks/useReveal'

type Review = { name: string; rating?: number; text: string; date?: string }

// Paste real Google Maps reviews here; the section stays hidden while empty.
const REVIEWS: Review[] = [
  // { name: 'Reviewer Name', rating: 5, text: 'Review text…', date: 'Oct 2026' },
]

export default function Testimonials() {
  useReveal([])
  if (!REVIEWS.length) return null
  return (
    <section className="section" id="testimonials" aria-label="Devotee reviews from Google Maps">
      <div className="container">
        <header className="sec-head reveal in">
          <span className="sec-icon" aria-hidden="true">🙏</span>
          <h2 className="sec-en">Devotee Testimonials</h2>
          <div className="sec-te">భక్తుల అనుభవాలు</div>
          <div className="sec-rule"></div>
        </header>
        <div className="t-grid" id="t-grid">
          {REVIEWS.map((r, i) => {
            const n = Math.max(0, Math.min(5, +(r.rating ?? 5) || 5))
            return (
              <article className="t-card" key={i}>
                <div className="t-stars" role="img" aria-label={`${n} out of 5 stars`}>{'★'.repeat(n) + '☆'.repeat(5 - n)}</div>
                <p className="t-text">“{r.text}”</p>
                <div className="t-meta">{r.name}{r.date && <small>Google review · {r.date}</small>}</div>
              </article>
            )
          })}
        </div>
        <p className="t-more"><a href="https://maps.app.goo.gl/Xwtto6qcNGQ3YYC57" target="_blank" rel="noopener">Read all reviews on Google Maps →</a></p>
      </div>
    </section>
  )
}
