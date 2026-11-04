import { useEffect, useState } from 'react'

export default function Preloader() {
  const [fade, setFade] = useState(false)
  useEffect(() => {
    let done = false
    const hide = () => { if (!done) { done = true; setFade(true) } }
    let t1: number | undefined
    const onLoad = () => { t1 = window.setTimeout(hide, 500) }
    if (document.readyState === 'complete') onLoad()
    else window.addEventListener('load', onLoad)
    const t2 = window.setTimeout(hide, 2200)
    return () => { window.removeEventListener('load', onLoad); clearTimeout(t1); clearTimeout(t2) }
  }, [])
  return (
    <div id="preloader" className={fade ? 'fade' : undefined} aria-hidden="true">
      <img className="pre-logo" src="/assets/logo.webp" alt="" />
    </div>
  )
}
