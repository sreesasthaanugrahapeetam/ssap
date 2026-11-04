import { useCallback, useRef, useState } from 'react'
import { DB, STORAGE_KEY } from './types'
import { loadDB } from './utils'

/** localStorage-backed DB. `update` mutates a deep copy, persists, and re-renders. */
export function useLocalStore(onSaveError: () => void) {
  const [db, setDb] = useState<DB>(loadDB)
  const ref = useRef(db)

  const persist = useCallback((next: DB) => {
    ref.current = next
    setDb(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { onSaveError() }
  }, [onSaveError])

  const update = useCallback((fn: (d: DB) => void) => {
    const next = structuredClone(ref.current)
    fn(next)
    persist(next)
  }, [persist])

  return { db, update, replace: persist }
}
