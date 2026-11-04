import { useSheetRows } from '../hooks/useSheet'

export default function Events() {
  const rows = useSheetRows('events')
  const [badge, titleTe, titleEn, organiser] = rows && rows.length > 1 ? rows[1] : []
  const h = (v: string) => ({ __html: v })
  return (
    <section className="event-bg-section" id="events" aria-label="Upcoming events">
      <div className="event-bg-clip">
        <img className="event-bg-img" src="/assets/event-banner.webp" alt="" aria-hidden="true" loading="lazy" />
        <div className="event-overlay" aria-hidden="true"></div>
      </div>

      <div className="event-inner reveal">
        {badge ? <div className="event-badge" dangerouslySetInnerHTML={h(badge)} /> :
          <div className="event-badge">📢 Upcoming Event &nbsp;·&nbsp; రానున్న కార్యక్రమం</div>}

        {titleTe ? <div className="event-te-title" dangerouslySetInnerHTML={h(titleTe)} /> : (
          <div className="event-te-title">
            శ్రీ హరి హర పుత్ర అయ్యప్ప స్వామి<br />
            మండల కాల దీక్షా పూజలు
          </div>
        )}
        {titleEn ? <div className="event-en-title" dangerouslySetInnerHTML={h(titleEn)} /> : (
          <div className="event-en-title">
            Sri Hari Hara Putra Ayyappa Swamy<br />
            Mandala Kala Deeksha Poojas
          </div>
        )}

        {organiser ? <div className="event-organiser" dangerouslySetInnerHTML={h(organiser)} /> : (
          <div className="event-organiser">
            Organised under the divine guidance of<br />
            <strong>Manya Sri Ayyappa Indra Kumar Dev Guru Swamy</strong><br />
            <span style={{ fontFamily: 'var(--f-te)', fontSize: '.92rem', color: 'var(--cream-2)' }}>
              మాన్య శ్రీ అయ్యప్ప ఇంద్ర కుమార్ దేవ్ గురు స్వామి గారి ఆధ్వర్యంలో ఏర్పాటు చేయు
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
