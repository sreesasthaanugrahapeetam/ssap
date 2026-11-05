import { useEffect } from 'react'

/** While open: lock page scroll; on close restore scroll and focus to the previously focused element. */
export function useModalLock(open: boolean) {
  useEffect(() => {
    if (!open) return
    const last = document.activeElement as HTMLElement | null
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = ''
      if (last && last.focus) last.focus()
    }
  }, [open])
}
