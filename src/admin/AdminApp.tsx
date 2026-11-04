import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './admin.css'
import { AdminContext } from './AdminContext'
import { useLocalStore } from './useLocalStore'
import { ConfirmBox } from './ui'
import Login from './Login'
import Dashboard from './Dashboard'
import DevoteeTable from './DevoteeTable'
import DevoteeForm from './DevoteeForm'
import BatchesView, { BatchForm } from './BatchesView'
import PaymentsView from './ServicePayments'
import ExpensesPanel, { ExpenseForm } from './ExpensesPanel'
import ExcelPanel from './ExcelPanel'
import { DrawerState, SESSION_KEY, View } from './types'

const NAV: [View, string][] = [
  ['dash', 'Dashboard'], ['devotees', 'Devotees'], ['batches', 'Batches / Yatra'],
  ['payments', 'Payments'], ['expenses', 'Expenses'], ['excel', 'Excel Import / Export'],
]

const wasLoggedIn = () => { try { return sessionStorage.getItem(SESSION_KEY) === '1' } catch { return false } }

export default function AdminApp() {
  const [authed, setAuthed] = useState(wasLoggedIn)
  const [view, setView] = useState<View>('dash')
  const [navOpen, setNavOpen] = useState(false)
  const [drawer, setDrawer] = useState<DrawerState>(null)
  const [modal, setModal] = useState<ReactNode>(null)
  const [toastMsg, setToastMsg] = useState('')
  const [toastOn, setToastOn] = useState(false)
  const toastTimer = useRef<number | undefined>(undefined)
  const nonce = useRef(0)
  const burger = useRef<HTMLButtonElement>(null)
  const side = useRef<HTMLElement>(null)

  const toast = useCallback((m: string) => {
    setToastMsg(m); setToastOn(true)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToastOn(false), 2200)
  }, [])
  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  const onSaveError = useCallback(() => toast('Could not save (storage blocked)'), [toast])
  const { db, update, replace } = useLocalStore(onSaveError)

  const closeDrawer = useCallback(() => setDrawer(null), [])
  const closeModal = useCallback(() => setModal(null), [])
  const toggleNav = useCallback((on: boolean) => {
    setNavOpen(on)
    if (on) setTimeout(() => side.current?.querySelector<HTMLElement>('a.on')?.focus(), 0)
    else if (side.current?.contains(document.activeElement)) burger.current?.focus()
  }, [])
  const go = useCallback((v: View) => { toggleNav(false); setView(v) }, [toggleNav])

  const ctx = useMemo(() => ({
    db, update, replace, toast, view, go, closeDrawer, closeModal,
    showModal: (n: ReactNode) => setModal(n),
    confirm: (msg: string, onOk: () => void, label?: string) => setModal(<ConfirmBox msg={msg} label={label} onOk={onOk} />),
    openDevotee: (phone?: string) => setDrawer({ kind: 'devotee', phone, nonce: ++nonce.current }),
    openBatch: (id: number | null) => setDrawer({ kind: 'batch', id, nonce: ++nonce.current }),
    openExpense: (index: number | null) => setDrawer({ kind: 'expense', index, nonce: ++nonce.current }),
  }), [db, update, replace, toast, view, go, closeDrawer, closeModal])

  // Esc closes the topmost layer
  useEffect(() => {
    if (!authed) return
    const h = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (navOpen) toggleNav(false)
      else if (modal) setModal(null)
      else if (drawer) setDrawer(null)
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [authed, navOpen, modal, drawer, toggleNav])

  // lock page scroll while an overlay is open
  const locked = authed && (navOpen || !!drawer || !!modal)
  useEffect(() => {
    if (!locked) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [locked])

  // focus first field when a drawer opens (desktop only)
  useEffect(() => {
    if (drawer && matchMedia('(min-width:761px)').matches)
      document.querySelector<HTMLElement>('.admin-root .a-drawer .sheet input:not([type=file]),.admin-root .a-drawer .sheet select')?.focus()
  }, [drawer?.nonce]) // eslint-disable-line react-hooks/exhaustive-deps

  const logout = () => { try { sessionStorage.removeItem(SESSION_KEY) } catch { /* ignore */ } setDrawer(null); setModal(null); setNavOpen(false); setView('dash'); setAuthed(false) }
  const enter = () => { try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* ignore */ } setAuthed(true); setView('dash') }

  const navKey = (v: View) => (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(v) } }

  let page: ReactNode
  switch (view) {
    case 'devotees': page = <DevoteeTable />; break
    case 'batches': page = <BatchesView />; break
    case 'payments': page = <PaymentsView />; break
    case 'expenses': page = <ExpensesPanel />; break
    case 'excel': page = <ExcelPanel />; break
    default: page = <Dashboard />
  }

  let sheet: ReactNode = null
  if (drawer?.kind === 'devotee') sheet = <DevoteeForm key={drawer.nonce} phone={drawer.phone} />
  else if (drawer?.kind === 'batch') sheet = <BatchForm key={drawer.nonce} id={drawer.id} />
  else if (drawer?.kind === 'expense') sheet = <ExpenseForm key={drawer.nonce} index={drawer.index} />

  return (
    <AdminContext.Provider value={ctx}>
      <div className={'admin-root' + (navOpen ? ' navopen' : '')}>
        {!authed ? <Login onEnter={enter} /> : (
          <>
            <div className="a-app">
              <header className="mbar">
                <button ref={burger} className="burger" aria-label={navOpen ? 'Close menu' : 'Open menu'} aria-expanded={navOpen} aria-controls="admin-side" onClick={() => toggleNav(!navOpen)}>☰</button>
                <span>🕉 Peetam Admin</span>
              </header>
              <div className="scrim" onClick={() => toggleNav(false)} />
              <aside id="admin-side" ref={side} aria-label="Main navigation">
                <h2>🕉 Peetam Admin</h2>
                <div className="navlist" role="navigation">
                  {NAV.map(([v, label]) => (
                    <a key={v} className={view === v ? 'on' : undefined} tabIndex={0} role="button" aria-current={view === v ? 'page' : undefined}
                      onClick={() => go(v)} onKeyDown={navKey(v)}>{label}</a>
                  ))}
                </div>
                <div className="foot">Data saved in this browser. Use Excel export to back up.<br /><br />
                  <a href="#" onClick={(e) => { e.preventDefault(); logout() }} style={{ padding: 0, textDecoration: 'underline', display: 'inline-flex' }}>Log out</a>
                </div>
              </aside>
              <main tabIndex={-1}>{page}</main>
            </div>
            {drawer && (
              <div className="a-drawer" onMouseDown={(e) => { if (e.target === e.currentTarget) closeDrawer() }}>
                <div className="sheet" role="dialog" aria-modal="true" aria-label="Details">{sheet}</div>
              </div>
            )}
            {modal && <div className="a-modal">{modal}</div>}
          </>
        )}
        <div className={'a-toast' + (toastOn ? ' show' : '')} role="status" aria-live="polite">{toastMsg}</div>
      </div>
    </AdminContext.Provider>
  )
}
