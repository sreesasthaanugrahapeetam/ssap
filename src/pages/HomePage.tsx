import Preloader from '../components/Preloader'
import Nav from '../components/Nav'
import Particles from '../components/Particles'
import MusicButton from '../components/MusicButton'
import ScrollUtils from '../components/ScrollUtils'
import Footer from '../components/Footer'
import Lightbox from '../components/Lightbox'
import Banner from '../sections/Banner'
import Hero from '../sections/Hero'
import Peetadhipati from '../sections/Peetadhipati'
import About from '../sections/About'
import Annadanam from '../sections/Annadanam'
import AnnadanamSchedule from '../sections/AnnadanamSchedule'
import Gallery from '../sections/Gallery'
import Testimonials from '../sections/Testimonials'
import Timings from '../sections/Timings'
import Services from '../sections/Services'
import Events from '../sections/Events'
import Donate from '../sections/Donate'
import Contact from '../sections/Contact'
import { useReveal } from '../hooks/useReveal'

export default function HomePage() {
  useReveal([])
  return (
    <>
      <Preloader />
      <Particles />
      <Nav />
      <main id="main">
        <Banner />
        <Hero />
        <Peetadhipati />
        <About />
        <Annadanam />
        <AnnadanamSchedule />
        <Gallery />
        <Testimonials />
        <Timings />
        <Services />
        <Events />
        <Donate />
        <Contact />
      </main>
      <Footer />
      <Lightbox />
      <ScrollUtils />
      <MusicButton />
    </>
  )
}
