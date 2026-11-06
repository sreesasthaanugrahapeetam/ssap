import { useCallback } from 'react'
import { useAdmin } from './AdminContext'

interface ShareOpts { title: string; text?: string; url?: string }
type Result = 'shared' | 'copied' | 'manual'

const payload = (o: ShareOpts) => [o.text, o.url].filter(Boolean).join('\n')

/** Legacy copy for pages served over plain http (e.g. testing on a LAN address), where the clipboard API is blocked. */
function legacyCopy(text: string): boolean {
  const ta = document.createElement('textarea')
  ta.value = text; ta.setAttribute('readonly', ''); ta.className = 'copy-scratch'
  document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length)
  let ok = false
  try { ok = document.execCommand('copy') } catch { ok = false }
  ta.remove()
  return ok
}

async function shareOrCopy(o: ShareOpts): Promise<Result> {
  const secure = window.isSecureContext
  if (secure && navigator.share) {
    try { await navigator.share({ title: o.title, text: o.text, url: o.url }); return 'shared' } catch (e) { if ((e as Error).name === 'AbortError') return 'shared' }
  }
  const text = payload(o)
  if (secure && navigator.clipboard) {
    try { await navigator.clipboard.writeText(text); return 'copied' } catch { /* try legacy */ }
  }
  return legacyCopy(text) ? 'copied' : 'manual'
}

/** Share helper for admin screens: share sheet, else copy, else a box to copy from by hand. Never throws. */
export function useShare() {
  const { toast, showModal, closeModal } = useAdmin()
  return useCallback(async (o: ShareOpts, copiedMsg = 'Copied') => {
    const r = await shareOrCopy(o)
    if (r === 'copied') toast(copiedMsg)
    else if (r === 'manual') {
      showModal(
        <div className="box" role="dialog" aria-modal="true">
          <h3>Copy and send</h3>
          <textarea readOnly rows={5} value={payload(o)} onFocus={(e) => e.currentTarget.select()} autoFocus />
          <div className="acts"><button className="btn" onClick={closeModal}>Done</button></div>
        </div>,
      )
    }
  }, [toast, showModal, closeModal])
}
