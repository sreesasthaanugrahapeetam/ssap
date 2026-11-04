import { useMemo, useState } from 'react'
import { amountWords, dmy, downloadReceiptPdf, readReceiptLinkDetailed, receiptFields, receiptTitle, TRUST_REG } from '../admin/receipt'
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
        <div className="rc-sheet rc-center">
          <h1 className="rc-nf">Receipt not found</h1>
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
      <div className="rc-sheet">
        <header className="rc-head">
          <img className="rc-logo" src="/assets/logo.webp" alt="" />
          <div>
            <h1>Sree Sastha Anugraha Peetam</h1>
            <div className="rc-reg">({TRUST_REG})</div>
          </div>
        </header>
        <div className="rc-titlebar">
          <span>No. <b>{r.no}</b></span>
          <span className="rc-title">{receiptTitle(r)}</span>
          <span>Date <b>{dmy(r.date)}</b></span>
        </div>
        <div className="rc-lines">
          {receiptFields(r).map(([k, v]) => (<div key={k} className="rc-line"><span className="rc-k">{k} :</span><span className="rc-v">{v}</span></div>))}
        </div>
        <div className="rc-foot">
          <div className="rc-amt" aria-label={'Rupees ' + amountWords(r.amount)}><small>Rs.</small><b>{r.amount.toLocaleString('en-IN')}/-</b></div>
          <div className="rc-for">
            <b>For Sree Sastha Anugraha Peetam</b>
            <i>This is a computer generated receipt and does not require a signature.</i>
          </div>
        </div>
        <p className="rc-saranam">Swamiye Saranam Ayyappa</p>
      </div>
      <button className="rc-btn" onClick={download} disabled={busy}>{busy ? 'Preparing…' : 'Download PDF'}</button>
      {err && <p className="rc-err" role="alert">Could not create the PDF. Please try again.</p>}
    </div>
  )
}
