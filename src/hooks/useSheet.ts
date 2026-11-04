import { useEffect, useState } from 'react'
import { fetchSheet, getKV, type KV, type Row } from '../lib/sheets'

/** Rows of a sheet tab (null while loading or on failure). */
export function useSheetRows(name: string, sheetId?: string): Row[] | null {
  const [rows, setRows] = useState<Row[] | null>(null)
  useEffect(() => {
    let live = true
    fetchSheet(name, sheetId).then(r => { if (live) setRows(r) })
    return () => { live = false }
  }, [name, sheetId])
  return rows
}

/** Key/value tab as an object ({} while loading or on failure). */
export function useSheetKV(name: string, sheetId?: string): KV {
  const [kv, setKv] = useState<KV>({})
  useEffect(() => {
    let live = true
    getKV(name, sheetId).then(r => { if (live) setKv(r) })
    return () => { live = false }
  }, [name, sheetId])
  return kv
}
