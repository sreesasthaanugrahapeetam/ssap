// Captures the browser's install prompt as early as possible (it can fire before the lazy admin chunk loads).
export interface InstallEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: InstallEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferred = e as InstallEvent
  notify()
})
window.addEventListener('appinstalled', () => { deferred = null; notify() })

export const getInstallEvent = () => deferred
export const clearInstallEvent = () => { deferred = null; notify() }
export const subscribeInstall = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
