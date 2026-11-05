import { useEffect, useState } from 'react'
import { clearInstallEvent, getInstallEvent, subscribeInstall } from '../pwaInstall'

const KEY = 'ssap-admin-install-dismissed'
const isStandalone = () =>
  matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
const wasDismissed = () => { try { return localStorage.getItem(KEY) === '1' } catch { return false } }

export default function InstallPrompt() {
  const [, force] = useState(0)
  const [hidden, setHidden] = useState(wasDismissed)
  useEffect(() => subscribeInstall(() => force((n) => n + 1)), [])

  if (hidden || isStandalone()) return null
  const ev = getInstallEvent()
  const ios = isIos()
  if (!ev && !ios) return null

  const dismiss = () => { try { localStorage.setItem(KEY, '1') } catch { /* ignore */ } setHidden(true) }
  const install = async () => {
    if (!ev) return
    await ev.prompt()
    await ev.userChoice
    clearInstallEvent()
  }

  return (
    <div className="a-install" role="dialog" aria-label="Install Peetam">
      <b>Install Peetam</b>
      <p>{ev ? 'Add the admin app to your device for quick access.' : 'Tap Share, then “Add to Home Screen” to install.'}</p>
      <div className="row">
        {ev && <button className="btn sm" onClick={install}>Install</button>}
        <button className="btn sec sm" onClick={dismiss}>{ev ? 'Not now' : 'Got it'}</button>
      </div>
    </div>
  )
}
