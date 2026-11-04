import { useState } from 'react'
import Carousel from '../components/Carousel'

export default function Banner() {
  const [shown, setShown] = useState(false)
  return (
    <section id="banner" aria-roledescription="carousel" aria-label="Featured videos and photos" hidden={!shown}>
      <Carousel tab="banner" wrapId="bn-wrap" dotsId="bn-dots" backdrop onStatus={setShown} />
    </section>
  )
}
