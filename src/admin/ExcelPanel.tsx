import { useState } from 'react'
import { useAdmin } from './AdminContext'
import { emptyDB, seed } from './utils'
import { exportXlsx, ImportResult, importXlsx, templateXlsx } from './excel'

export default function ExcelPanel() {
  const { db, update, replace, toast, confirm } = useAdmin()
  const [res, setRes] = useState<ImportResult | null>(null)

  const doImport = (file?: File) => {
    if (!file) return
    importXlsx(file, update).then((r) => { setRes(r); toast('Import done') }).catch(() => toast('Could not read that file'))
  }

  return (
    <>
      <div className="top"><h1>Excel Import / Export</h1></div>
      <div className="panel"><h3>1 · Export</h3>
        <p className="muted">One workbook, one sheet per table. Keep it as your master copy.</p>
        <button className="btn" onClick={() => exportXlsx(db, toast)}>⬇ Download peetam-devotees.xlsx</button>{' '}
        <button className="btn sec" onClick={templateXlsx}>⬇ Blank template</button>
      </div>
      <div className="panel"><h3>2 · Import</h3>
        <p className="muted">Sheets: Devotees, Family, Deekshas, Payments, Expenses, Batches, BatchMembers. <b>phone</b> column is the ID. Existing phones are updated, new ones added.</p>
        <div className="dropzone" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); doImport(e.dataTransfer.files[0]) }}>
          Drop .xlsx here or <input type="file" accept=".xlsx,.xls,.csv" aria-label="Choose Excel file" onChange={(e) => { doImport(e.target.files?.[0]); e.target.value = '' }} />
        </div>
        <div style={{ marginTop: 10 }}>
          {res && <>
            <div className="pill ok">Added {res.added} · Updated {res.updated} · Skipped {res.skipped}</div>
            <ul style={{ margin: '8px 0 0 18px', color: 'var(--mute)', fontSize: 13 }}>{res.log.map((l, i) => <li key={i}>{l}</li>)}</ul>
          </>}
        </div>
      </div>
      <div className="panel"><h3>3 · Reset</h3>
        <button className="btn danger" onClick={() => confirm('Replace everything with demo data?', () => { replace(seed()); toast('Demo data restored') }, 'Replace')}>Reset to demo data</button>{' '}
        <button className="btn danger" onClick={() => confirm('Delete ALL data?', () => { replace(emptyDB()); toast('Cleared') }, 'Delete all')}>Clear all</button>
      </div>
    </>
  )
}
