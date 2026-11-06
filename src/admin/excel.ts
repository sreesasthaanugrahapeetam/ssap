import * as XLSX from 'xlsx'
import { DB, NEW_TAG, THIS_YEAR, sessionsFor } from './types'
import { migrateServices, normPhone } from './utils'

export const SHEETS: Record<string, string[]> = {
  Devotees: ['phone', 'full_name', 'email', 'address', 'dob', 'blood_group', 'gothram', 'swamy_year', 'referred_by', 'active', 'notes'],
  Family: ['phone', 'name', 'relation', 'member_phone', 'emergency'],
  Deekshas: ['phone', 'year', 'malai_date', 'irumudi_date', 'mandala_days', 'end_date'],
  Payments: ['phone', 'type', 'service_date', 'session', 'pooja_id', 'amount', 'date', 'mode', 'status', 'note'],
  Expenses: ['id', 'date', 'category', 'amount', 'mode', 'paid_to', 'note'],
  Poojas: ['id', 'kind', 'date', 'session', 'venue', 'notes', 'phones'],
  Batches: ['id', 'year', 'name', 'travel_date', 'vehicle', 'capacity', 'notes', 'gurus'],
  BatchMembers: ['batch_id', 'phone'],
}
const KEYMAP: Record<string, keyof DB> = {
  Devotees: 'devotees', Family: 'family', Deekshas: 'deekshas', Payments: 'payments',
  Expenses: 'expenses', Poojas: 'poojas', Batches: 'batches', BatchMembers: 'batch_members',
}

function scoped(db: DB, phones: Set<string>): DB {
  const members = db.batch_members.filter((m) => phones.has(m.phone))
  const batchIds = new Set(members.map((m) => m.batch_id))
  return {
    ...db,
    poojas: [],
    devotees: db.devotees.filter((d) => phones.has(d.phone)),
    family: db.family.filter((x) => phones.has(x.phone)),
    deekshas: db.deekshas.filter((x) => phones.has(x.phone)),
    payments: db.payments.filter((x) => phones.has(x.phone)),
    batch_members: members,
    batches: db.batches.filter((b) => batchIds.has(b.id)),
  }
}

function workbook(db: DB | null) {
  const w = XLSX.utils.book_new()
  Object.keys(SHEETS).filter((n) => n !== 'Expenses').forEach((n) => {
    const cols = SHEETS[n]
    const cell = (r: any, c: string) => (c === 'gurus' ? (r.gurus || []).map((g: any) => g.name + (g.phone ? ':' + g.phone : '')).join('; ') : Array.isArray(r[c]) ? r[c].join(', ') : r[c] == null ? '' : r[c])
    const rows = db ? (db[KEYMAP[n]] as any[]).map((r) => cols.map((c) => cell(r, c))) : []
    const ws = XLSX.utils.aoa_to_sheet([cols as any[]].concat(rows))
    ws['!cols'] = cols.map(() => ({ wch: 18 }))
    XLSX.utils.book_append_sheet(w, ws, n)
  })
  return w
}

/** Pass `phones` to export only those devotees (and their related rows). */
export function exportXlsx(db: DB, toast: (m: string) => void, phones?: Set<string>) {
  XLSX.writeFile(workbook(phones ? scoped(db, phones) : db), 'peetam-devotees.xlsx')
  toast('Exported')
}
export function templateXlsx() {
  XLSX.writeFile(workbook(null), 'peetam-template.xlsx')
}

export interface ImportResult { added: number; updated: number; skipped: number; log: string[] }

/** Reads a workbook and merges it into the DB via `update`. Resolves with a summary. */
export function importXlsx(file: File, update: (fn: (d: DB) => void) => void): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onerror = () => reject(r.error)
    r.onload = () => {
      try {
        const w = XLSX.read(r.result, { type: 'array', cellDates: false, raw: false })
        const sheet = (n: string): any[] => (w.Sheets[n] ? XLSX.utils.sheet_to_json(w.Sheets[n], { defval: '', raw: false }) : [])
        const log: string[] = []
        let added = 0, updated = 0, skipped = 0
        update((DB) => {
          sheet('Devotees').forEach((row, i) => {
            const ph = normPhone(row.phone)
            if (!ph || !String(row.full_name).trim() || !String(row.gothram).trim()) {
              skipped++; log.push('Devotees row ' + (i + 2) + ': phone, name and gothram are required, skipped'); return
            }
            if (!row.referred_by && row.guru_swamy) row.referred_by = row.guru_swamy
            if (!String(row.referred_by).trim()) row.referred_by = NEW_TAG
            const rec: any = { photo: '', ...Object.fromEntries(SHEETS.Devotees.map((c) => [c, String(row[c] == null ? '' : row[c]).trim()])), phone: ph }
            if (!rec.active) rec.active = 'yes'
            const ix = DB.devotees.findIndex((d) => d.phone === ph)
            if (ix >= 0) { rec.photo = DB.devotees[ix].photo; DB.devotees[ix] = rec; updated++ } else { DB.devotees.push(rec); added++ }
          })
          const known = new Set(DB.devotees.map((d) => d.phone))
          const child = (sn: string, tk: 'family' | 'deekshas' | 'payments') => {
            const rows = sheet(sn)
            if (!rows.length) return
            const out: any[] = []
            rows.forEach((row, i) => {
              const ph = normPhone(row.phone)
              if (!ph || !known.has(ph)) { log.push(sn + ' row ' + (i + 2) + ': phone not in Devotees, skipped'); return }
              const rec: any = {}
              SHEETS[sn].forEach((c) => { rec[c] = row[c] == null ? '' : row[c] })
              rec.phone = ph
              if (sn === 'Payments' && !['Paid', 'Pending'].includes(String(rec.status).trim())) rec.status = 'Pending'
              if (sn === 'Payments' && rec.service_date && !sessionsFor(rec.type).includes(rec.session)) rec.session = sessionsFor(rec.type)[0]
              if (rec.member_phone) rec.member_phone = normPhone(rec.member_phone)
              ;['year', 'mandala_days', 'amount', 'pooja_id'].forEach((k) => { if (k in rec) rec[k] = +rec[k] || 0 })
              out.push(rec)
            })
            const phones = new Set(out.map((o) => o.phone))
            ;(DB as any)[tk] = (DB[tk] as any[]).filter((x) => !phones.has(x.phone)).concat(out)
            log.push(sn + ': ' + out.length + ' rows loaded')
          }
          child('Family', 'family'); child('Deekshas', 'deekshas'); child('Payments', 'payments')
          DB.payments.forEach((p) => { if (!p.id) p.id = DB.nextId.pay++ })
          const ex = sheet('Expenses')
          if (ex.length) {
            let n = 0
            ex.forEach((x, i) => {
              const amt = +String(x.amount).replace(/[^\d.]/g, '')
              if (!(amt > 0) || !String(x.date).trim()) { log.push('Expenses row ' + (i + 2) + ': date and amount required, skipped'); return }
              const rec = { id: 0, date: String(x.date).trim(), category: String(x.category || 'Other').trim(), amount: amt, mode: String(x.mode || '').trim(), paid_to: String(x.paid_to || '').trim(), note: String(x.note || '').trim() }
              const ix = +x.id > 0 ? DB.expenses.findIndex((e) => e.id === +x.id) : -1
              if (ix >= 0) { rec.id = DB.expenses[ix].id; DB.expenses[ix] = rec } else { rec.id = DB.nextId.exp++; DB.expenses.push(rec) }
              n++
            })
            log.push('Expenses: ' + n + ' rows loaded')
          }
          const ps = sheet('Poojas')
          if (ps.length) {
            let n = 0
            ps.forEach((x, i) => {
              if (!String(x.date).trim() || !String(x.kind).trim()) { log.push('Poojas row ' + (i + 2) + ': kind and date required, skipped'); return }
              const rec = { id: 0, kind: String(x.kind).trim(), date: String(x.date).trim(), session: String(x.session || 'Evening').trim(), venue: String(x.venue || '').trim(), notes: String(x.notes || '').trim(), phones: String(x.phones || '').split(/[,;]/).map((t) => normPhone(t)).filter((t) => known.has(t)) }
              const ix = +x.id > 0 ? DB.poojas.findIndex((p) => p.id === +x.id) : -1
              if (ix >= 0) { rec.id = DB.poojas[ix].id; DB.poojas[ix] = rec } else { rec.id = DB.nextId.pooja++; DB.poojas.push(rec) }
              n++
            })
            log.push('Poojas: ' + n + ' rows loaded')
          }
          migrateServices(DB)
          const bs = sheet('Batches')
          if (bs.length) {
            bs.forEach((b) => {
              const id = +b.id || DB.nextId.batch++
              const rec = { id, year: +b.year || THIS_YEAR, name: b.name, travel_date: b.travel_date, vehicle: b.vehicle, capacity: +b.capacity || 45, notes: b.notes, gurus: String(b.gurus || '').split(';').map((t) => normPhone(t.split(':')[1] || '')).map((ph) => DB.devotees.find((d) => d.phone === ph)).filter((d): d is NonNullable<typeof d> => !!d).map((d) => ({ name: d.full_name, phone: d.phone })) }
              const ix = DB.batches.findIndex((x) => x.id === id)
              if (ix >= 0) DB.batches[ix] = rec; else DB.batches.push(rec)
              DB.nextId.batch = Math.max(DB.nextId.batch, id + 1)
            })
            log.push('Batches: ' + bs.length + ' rows loaded')
          }
          const bm = sheet('BatchMembers')
          if (bm.length) {
            DB.batch_members = bm.map((m) => ({ batch_id: +m.batch_id, phone: normPhone(m.phone) })).filter((m) => m.phone && known.has(m.phone))
            log.push('BatchMembers: ' + DB.batch_members.length + ' rows loaded')
          }
        })
        resolve({ added, updated, skipped, log })
      } catch (e) { reject(e) }
    }
    r.readAsArrayBuffer(file)
  })
}
