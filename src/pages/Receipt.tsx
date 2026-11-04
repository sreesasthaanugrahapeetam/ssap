import { useMemo, useState } from 'react'
import { downloadReceiptPdf, readReceiptLinkDetailed, receiptRows, TRUST_REG } from '../admin/receipt'
import '../styles/receipt.css'

/** Public receipt page. Everything it shows comes from the link itself (URL fragment); nothing is looked up or stored. */
export default function Receipt() {
  const res = useMemo(() => readReceiptLinkDetailed(location.hash, location.search), [])
  const r = 'data' in res ? res.data : null
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(false)

  if (!r) {
    return (
      <div className="rc-page">
        <div className="rc-card">
          <h1>Receipt not found</h1>
          <p className="rc-muted">This receipt link is incomplete or damaged. Please ask the Peetam for a new link.</p>
          <p className="rc-hint">{'problem' in res && res.problem === 'missing' ? 'The link has no receipt data. It may have been cut short when it was shared; open the full link as it was sent.' : 'The receipt data in this link could not be read.'}</p>
        </div>
      </div>
    )
  }

  const download = () => {
    setBusy(true); setErr(false)
    downloadReceiptPdf(r).catch(() => setErr(true)).finally(() => setBusy(false))
  }

  return (
    <div className="rc-page">
      <div className="rc-card">
        <img className="rc-logo" src="/assets/logo.webp" alt="" />
        <h1>Sree Sastha Anugraha Peetam</h1>
        <div className="rc-reg">{TRUST_REG}</div>
        <div className="rc-sub">Payment Receipt</div>
        <dl className="rc-rows">
          {receiptRows(r).map(([k, v]) => (<div key={k} className="rc-row"><dt>{k}</dt><dd>{v}</dd></div>))}
        </dl>
        <div className="rc-amount"><span>Amount received</span><b>Rs. {r.amount.toLocaleString('en-IN')}/-</b></div>
        <button className="rc-btn" onClick={download} disabled={busy}>{busy ? 'Preparing…' : '⬇ Download PDF'}</button>
        {err && <p className="rc-err" role="alert">Could not create the PDF. Please try again.</p>}
        <p className="rc-thanks">Thank you. Swamiye Saranam Ayyappa.</p>
      </div>
    </div>
  )
}
