import {
  Children, isValidElement, KeyboardEvent, ReactElement, ReactNode, useEffect, useId, useLayoutEffect, useMemo, useRef, useState,
} from 'react'
import { createPortal } from 'react-dom'

/** Shows a search box inside the list once there are more options than this. */
const SEARCH_AT = 6

type Opt = { value: string; label: string }

function readOptions(children: ReactNode): Opt[] {
  const out: Opt[] = []
  Children.forEach(children, (c) => {
    if (!isValidElement(c)) return
    const el = c as ReactElement<{ value?: string | number; children?: ReactNode }>
    const label = Children.toArray(el.props.children).join('')
    out.push({ value: el.props.value != null ? String(el.props.value) : label, label })
  })
  return out
}

/** Position the popover under the field (or above it when there is no room). */
function usePopPosition(open: boolean, anchor: React.RefObject<HTMLElement | null>, deps: unknown[]) {
  const [pos, setPos] = useState<{ top: number; left: number; width: number; maxH: number; up: boolean } | null>(null)
  useLayoutEffect(() => {
    if (!open || !anchor.current) { setPos(null); return }
    const place = () => {
      const r = anchor.current!.getBoundingClientRect()
      const below = window.innerHeight - r.bottom - 8
      const above = r.top - 8
      const up = below < 200 && above > below
      const maxH = Math.max(140, Math.min(300, up ? above : below))
      setPos({ top: up ? r.top - 4 : r.bottom + 4, left: r.left, width: r.width, maxH, up })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ...deps])
  return pos
}

function useOutsideClose(open: boolean, close: () => void, ...refs: React.RefObject<HTMLElement | null>[]) {
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node
      if (refs.some((r) => r.current?.contains(t))) return
      close()
    }
    document.addEventListener('mousedown', h)
    document.addEventListener('touchstart', h)
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('touchstart', h) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
}

function Pop({ pos, children, popRef }: { pos: NonNullable<ReturnType<typeof usePopPosition>>; children: ReactNode; popRef: React.RefObject<HTMLDivElement | null> }) {
  // Rendered inside .admin-root so the scoped styles apply, but positioned against the viewport.
  const host = document.querySelector('.admin-root') || document.body
  return createPortal(
    <div
      ref={popRef}
      className="sel-pop"
      style={{ left: pos.left, width: pos.width, maxHeight: pos.maxH, ...(pos.up ? { bottom: window.innerHeight - pos.top } : { top: pos.top }) }}
    >{children}</div>,
    host,
  )
}

type SelectProps = {
  value?: string | number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange?: (e: any) => void
  children?: ReactNode
  id?: string
  className?: string
  disabled?: boolean
  placeholder?: string
  'aria-label'?: string
  'aria-required'?: boolean | 'true' | 'false'
}

/**
 * Drop-in replacement for a native <select> (same <option> children, onChange gets e.target.value).
 * Opens a styled list; a search box appears when there are many options.
 */
export function Select({ value, onChange, children, id, disabled, placeholder, className, ...aria }: SelectProps) {
  const opts = useMemo(() => readOptions(children), [children])
  const cur = opts.find((o) => o.value === String(value ?? ''))
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [hi, setHi] = useState(0)
  const btn = useRef<HTMLButtonElement>(null)
  const pop = useRef<HTMLDivElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const listId = useId()
  const searchable = opts.length > SEARCH_AT
  const shown = useMemo(() => (q ? opts.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : opts), [opts, q])
  const pos = usePopPosition(open, btn, [shown.length])

  const close = () => { setOpen(false); setQ('') }
  useOutsideClose(open, close, btn, pop)

  useEffect(() => {
    if (!open) return
    setHi(Math.max(0, shown.findIndex((o) => o.value === String(value ?? ''))))
    if (searchable) setTimeout(() => search.current?.focus(), 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  useEffect(() => { setHi(0) }, [q])
  useEffect(() => {
    if (!open) return
    pop.current?.querySelector<HTMLElement>('[data-hi="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [hi, open, pos])

  const pick = (o: Opt) => { onChange?.({ target: { value: o.value } }); close(); btn.current?.focus() }

  const onKey = (e: KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true) }
      return
    }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); btn.current?.focus() }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(shown.length - 1, h + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(0, h - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (shown[hi]) pick(shown[hi]) }
    else if (e.key === 'Tab') close()
  }

  return (
    <>
      <button
        ref={btn}
        type="button"
        id={id}
        className={'sel-btn' + (className ? ' ' + className : '')}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? close() : setOpen(true))}
        onKeyDown={onKey}
        {...aria}
      >
        <span className={cur ? undefined : 'sel-ph'}>{cur ? cur.label : placeholder || 'Select…'}</span>
      </button>
      {open && pos && (
        <Pop pos={pos} popRef={pop}>
          {searchable && (
            <div className="sel-search">
              <input ref={search} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Search…" aria-label="Search options" autoComplete="off" />
            </div>
          )}
          <div id={listId} role="listbox" className="sel-list">
            {shown.length === 0 && <div className="sel-empty">No matches</div>}
            {shown.map((o, i) => (
              <div
                key={o.value + i}
                role="option"
                aria-selected={o.value === String(value ?? '')}
                data-hi={i === hi}
                className={'sel-opt' + (i === hi ? ' hi' : '') + (o.value === String(value ?? '') ? ' on' : '')}
                onMouseEnter={() => setHi(i)}
                onClick={() => pick(o)}
              >{o.label}</div>
            ))}
          </div>
        </Pop>
      )}
    </>
  )
}

type ComboProps = {
  value: string
  onChange: (v: string) => void
  options: string[]
  id?: string
  placeholder?: string
  'aria-required'?: boolean | 'true' | 'false'
}

/** Text field with a suggestion list (replaces <input list=…>/<datalist>). Typing filters; any text is allowed. */
export function Combo({ value, onChange, options, id, placeholder, ...aria }: ComboProps) {
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(-1)
  const input = useRef<HTMLInputElement>(null)
  const pop = useRef<HTMLDivElement>(null)
  const listId = useId()
  const shown = useMemo(() => {
    const q = value.trim().toLowerCase()
    return q ? options.filter((o) => o.toLowerCase().includes(q) && o.toLowerCase() !== q) : options
  }, [options, value])
  const pos = usePopPosition(open && shown.length > 0, input, [shown.length])
  useOutsideClose(open, () => setOpen(false), input, pop)
  useEffect(() => { setHi(-1) }, [value])
  useEffect(() => {
    pop.current?.querySelector<HTMLElement>('[data-hi="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [hi])

  const pick = (o: string) => { onChange(o); setOpen(false) }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHi((h) => Math.min(shown.length - 1, h + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(0, h - 1)) }
    else if (e.key === 'Enter' && open && hi >= 0 && shown[hi]) { e.preventDefault(); pick(shown[hi]) }
    else if (e.key === 'Escape' && open) { e.preventDefault(); e.stopPropagation(); setOpen(false) }
  }

  return (
    <>
      <input
        ref={input}
        id={id}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-autocomplete="list"
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        {...aria}
      />
      {open && pos && shown.length > 0 && (
        <Pop pos={pos} popRef={pop}>
          <div id={listId} role="listbox" className="sel-list">
            {shown.map((o, i) => (
              <div
                key={o}
                role="option"
                aria-selected={o === value}
                data-hi={i === hi}
                className={'sel-opt' + (i === hi ? ' hi' : '') + (o === value ? ' on' : '')}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHi(i)}
                onClick={() => pick(o)}
              >{o}</div>
            ))}
          </div>
        </Pop>
      )}
    </>
  )
}
