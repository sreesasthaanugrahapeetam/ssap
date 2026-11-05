// Tiny store so any component (Gallery) can open the Lightbox.
export type LbItem = { src: string; type: 'image' | 'video'; alt: string }
export type LbState = { open: boolean; items: LbItem[]; index: number }

let state: LbState = { open: false, items: [], index: 0 }
const listeners = new Set<() => void>()
const emit = () => listeners.forEach(l => l())

export const lightbox = {
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } },
  getState: () => state,
  isOpen: () => state.open,
  open(items: LbItem[], index: number) {
    if (!items.length) return
    state = { open: true, items, index }
    emit()
  },
  close() { if (state.open) { state = { ...state, open: false }; emit() } },
  go(delta: number) {
    const n = state.items.length
    if (!n) return
    state = { ...state, index: (state.index + delta + n) % n }
    emit()
  },
}
export const openLightbox = lightbox.open
