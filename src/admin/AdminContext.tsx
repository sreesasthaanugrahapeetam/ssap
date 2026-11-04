import { createContext, useContext, ReactNode } from 'react'
import { DB, View } from './types'

export interface AdminCtx {
  db: DB
  update: (fn: (d: DB) => void) => void
  replace: (d: DB) => void
  toast: (msg: string) => void
  confirm: (msg: string, onOk: () => void, label?: string) => void
  showModal: (node: ReactNode) => void
  closeModal: () => void
  view: View
  go: (v: View) => void
  openDevotee: (phone?: string) => void
  openBatch: (id: number | null) => void
  openExpense: (index: number | null) => void
  closeDrawer: () => void
}

export const AdminContext = createContext<AdminCtx>(null as unknown as AdminCtx)
export const useAdmin = () => useContext(AdminContext)
