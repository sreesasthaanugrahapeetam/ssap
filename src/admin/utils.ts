import { DB, Deeksha, Devotee, NEW_TAG, THIS_YEAR, STORAGE_KEY, SESSION_ORDER, sessionsFor } from './types'

/* phone = devotee id, normalised to +91XXXXXXXXXX */
export function normPhone(p: unknown): string {
  let d = String(p || '').replace(/[^\d+]/g, '')
  if (d.startsWith('+')) return d.length >= 11 ? d : ''
  d = d.replace(/^0+/, '')
  if (d.length === 12 && d.startsWith('91')) return '+' + d
  if (d.length === 10) return '+91' + d
  return ''
}
export const fmtPhone = (p?: string) => (p && p.startsWith('+91') ? '+91 ' + p.slice(3, 8) + ' ' + p.slice(8) : p || '')
export const initials = (n?: string) => String(n || '?').trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join('').toUpperCase()
export const money = (n: unknown) => '₹' + (Number(n) || 0).toLocaleString('en-IN')
export const todayISO = () => new Date().toISOString().slice(0, 10)
export const inDays = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)
/** Upcoming poojas (today or later), soonest first. */
export const upcomingPoojas = (db: DB, kind?: string) =>
  db.poojas.filter((p) => p.date >= todayISO() && (!kind || p.kind === kind))
    .sort((a, b) => a.date.localeCompare(b.date) || SESSION_ORDER.indexOf(a.session) - SESSION_ORDER.indexOf(b.session))
export const daysUntil = (iso: string) => Math.round((Date.parse(iso) - Date.parse(todayISO())) / 864e5)

export const blankDevotee = (): Devotee => ({
  phone: '', full_name: '', email: '', address: '', dob: '', blood_group: '', gothram: '',
  referred_by: NEW_TAG, photo: '', notes: '', active: 'yes',
})

/* ───────── derived helpers ───────── */
export const findDevotee = (db: DB, p: string) => db.devotees.find((d) => d.phone === p)
/** "Name (Gothram)" label for a devotee phone. */
export const devoteeLabel = (db: DB, p: string) => {
  const d = findDevotee(db, p)
  return d ? d.full_name + (d.gothram ? ' (' + d.gothram + ')' : '') : p
}
export const curDeeksha = (db: DB, p: string) => db.deekshas.filter((x) => x.phone === p).sort((a, b) => b.year - a.year)[0]
/** Total of all Paid payments made by a devotee. */
export const donatedBy = (db: DB, p: string) =>
  db.payments.filter((x) => x.phone === p && x.status === 'Paid').reduce((s, x) => s + (+x.amount || 0), 0)
export const duesOf = (db: DB, p: string) =>
  db.payments.filter((x) => x.phone === p && x.status === 'Pending').reduce((s, x) => s + (+x.amount || 0), 0)
export function daysLeft(dk?: Deeksha): number | null {
  if (!dk || !dk.malai_date || dk.end_date) return null
  const end = new Date(dk.malai_date)
  end.setDate(end.getDate() + (+dk.mandala_days || 41))
  return Math.ceil((end.getTime() - Date.now()) / 864e5)
}
export const batchOf = (db: DB, p: string) => {
  const m = db.batch_members.find((x) => x.phone === p && (db.batches.find((b) => b.id === x.batch_id) || ({} as any)).year === THIS_YEAR)
  return m ? db.batches.find((b) => b.id === m.batch_id) : undefined
}

/* ───────── seed + load ───────── */
/** One-time move of service-dated payments (Annadanam / Alpaharam / Pooja) into the single Poojas & Seva list. Idempotent. */
export function migrateServices(d: DB) {
  d.payments.forEach((p) => {
    if (!p.service_date || p.pooja_id) return
    const id = d.nextId.pooja++
    const kind = ['Annadanam', 'Alpaharam'].includes(p.type) ? p.type : 'Pooja'
    d.poojas.push({ id, kind, date: p.service_date as string, session: p.session || sessionsFor(kind)[0], venue: '', notes: p.note, phones: [p.phone] })
    p.pooja_id = id
  })
}

export function seed(): DB {
  const D = (phone: string, full_name: string, extra: Partial<Devotee>): Devotee =>
    Object.assign({ phone, full_name, email: '', address: '', dob: '', blood_group: '', gothram: '', referred_by: NEW_TAG, photo: '', notes: '', active: 'yes' }, extra)
  const Y = THIS_YEAR
  const db: DB = {
    devotees: [
      D('+919848011111', 'Ramesh Kumar', { referred_by: 'Prasad Sharma', email: 'ramesh@example.com', address: 'Hyderabad', dob: '1985-04-12', blood_group: 'O+', gothram: 'Kashyapa' }),
      D('+919848022222', 'Srinivas Rao', { referred_by: 'Prasad Sharma', address: 'Vijayawada', dob: '1978-09-03', blood_group: 'B+', gothram: 'Bharadwaja' }),
      D('+919848033333', 'Venkata Reddy', { referred_by: 'Ramesh Kumar', address: 'Guntur', dob: '1990-01-21', blood_group: 'A+', gothram: 'Vasishta' }),
      D('+919848044444', 'Anil Varma', { address: 'Warangal', dob: '1982-11-30', blood_group: 'AB+', gothram: 'Atreya' }),
      D('+919848055555', 'Prasad Sharma', { address: 'Hyderabad', dob: '1969-06-15', blood_group: 'O-', gothram: 'Kaushika', notes: 'Senior guru swamy' }),
      D('+919848066666', 'Mahesh Babu', { address: 'Nellore', dob: '1995-02-08', blood_group: 'B-', gothram: 'Gautama' }),
    ],
    family: [
      { phone: '+919848011111', name: 'Lakshmi Kumar', relation: 'Wife', member_phone: '+919848077777', emergency: 'yes' },
      { phone: '+919848011111', name: 'Arjun Kumar', relation: 'Son', member_phone: '', emergency: 'no' },
      { phone: '+919848022222', name: 'Padma Rao', relation: 'Wife', member_phone: '+919848088888', emergency: 'yes' },
      { phone: '+919848033333', name: 'Suresh Reddy', relation: 'Brother', member_phone: '+919848099999', emergency: 'yes' },
    ],
    deekshas: [
      { phone: '+919848011111', year: Y, malai_date: Y + '-11-17', end_date: '', mandala_days: 41, irumudi_date: '' },
      { phone: '+919848022222', year: Y, malai_date: Y + '-11-17', end_date: '', mandala_days: 41, irumudi_date: '' },
      { phone: '+919848033333', year: Y, malai_date: Y + '-11-20', end_date: '', mandala_days: 48, irumudi_date: '' },
      { phone: '+919848055555', year: Y, malai_date: Y + '-11-17', end_date: '', mandala_days: 41, irumudi_date: '' },
      { phone: '+919848011111', year: Y - 1, malai_date: (Y - 1) + '-11-17', end_date: (Y - 1) + '-12-28', mandala_days: 41, irumudi_date: (Y - 1) + '-12-27' },
      { phone: '+919848044444', year: Y - 1, malai_date: (Y - 1) + '-11-17', end_date: (Y - 1) + '-12-28', mandala_days: 41, irumudi_date: (Y - 1) + '-12-27' },
    ],
    payments: [
      { id: 1, phone: '+919848011111', type: 'Annadanam', service_date: inDays(2), session: 'Afternoon', amount: 5000, date: Y + '-10-02', mode: 'UPI', status: 'Paid', note: 'Lunch' },
      { id: 2, phone: '+919848022222', type: 'Pooja', service_date: inDays(9), session: 'Evening', amount: 1500, date: Y + '-10-05', mode: 'Cash', status: 'Paid', note: 'Mandala pooja' },
      { id: 3, phone: '+919848033333', type: 'Yatra', amount: 6000, date: '', mode: '', status: 'Pending', note: 'Bus seat' },
      { id: 4, phone: '+919848055555', type: 'Annadanam', service_date: inDays(7), session: 'Afternoon', amount: 10000, date: Y + '-10-10', mode: 'UPI', status: 'Paid', note: 'Full day' },
      { id: 5, phone: '+919848011111', type: 'Yatra', amount: 6000, date: '', mode: '', status: 'Pending', note: 'Bus seat' },
      { id: 6, phone: '+919848044444', type: 'Annadanam', service_date: inDays(12), session: 'Afternoon', amount: 5000, date: '', mode: '', status: 'Pending', note: 'In memory of father' },
      { id: 7, phone: '+919848066666', type: 'Annadanam', service_date: inDays(19), session: 'Afternoon', amount: 7500, date: Y + '-10-20', mode: 'UPI', status: 'Paid', note: 'Birthday seva' },
      { id: 8, phone: '+919848033333', type: 'Annadanam', service_date: inDays(26), session: 'Afternoon', amount: 5000, date: Y + '-10-22', mode: 'Cash', status: 'Paid', note: '' },
      { id: 9, phone: '+919848022222', type: 'Alpaharam', service_date: inDays(1), session: 'Morning', amount: 2000, date: Y + '-10-25', mode: 'UPI', status: 'Paid', note: 'Tiffin for devotees' },
      { id: 10, phone: '+919848055555', type: 'Alpaharam', service_date: inDays(5), session: 'Evening', amount: 2500, date: Y + '-10-28', mode: 'Cash', status: 'Paid', note: 'Fruits and milk' },
      { id: 11, phone: '+919848011111', type: 'Alpaharam', service_date: inDays(10), session: 'Morning', amount: 2000, date: '', mode: '', status: 'Pending', note: '' },
      { id: 12, phone: '+919848066666', type: 'Alpaharam', service_date: inDays(15), session: 'Evening', amount: 3000, date: Y + '-11-01', mode: 'UPI', status: 'Paid', note: 'Sweet pongal' },
      { id: 13, phone: '+919848044444', type: 'Alpaharam', service_date: inDays(22), session: 'Morning', amount: 2000, date: '', mode: '', status: 'Pending', note: '' },
    ],
    batches: [
      { id: 1, year: Y, name: 'Batch 1 – Bus A', travel_date: Y + '-12-26', vehicle: 'Bus A (45 seats)', capacity: 45, notes: 'Depart 5 AM from Peetam' },
      { id: 2, year: Y, name: 'Batch 2 – Tempo', travel_date: Y + '-12-28', vehicle: 'Tempo Traveller', capacity: 14, notes: '' },
    ],
    batch_members: [
      { batch_id: 1, phone: '+919848011111' }, { batch_id: 1, phone: '+919848022222' },
      { batch_id: 1, phone: '+919848055555' }, { batch_id: 2, phone: '+919848033333' },
    ],
    expenses: [
      { id: 1, date: Y + '-10-03', category: 'Annadanam supplies', amount: 8200, mode: 'Cash', paid_to: 'Sri Lakshmi Provisions', note: 'Rice, dal, oil' },
      { id: 2, date: Y + '-10-06', category: 'Pooja items', amount: 2400, mode: 'UPI', paid_to: 'Flower market', note: 'Garlands, camphor, ghee' },
      { id: 3, date: Y + '-10-12', category: 'Utilities', amount: 3100, mode: 'Bank', paid_to: 'TSSPDCL', note: 'Electricity bill' },
      { id: 4, date: Y + '-10-20', category: 'Yatra / Transport', amount: 12000, mode: 'UPI', paid_to: 'Bus operator', note: 'Advance for Bus A' },
    ],
    poojas: [
      { id: 1, kind: 'Padi Pooja', date: inDays(9), session: 'Evening', venue: 'Peetam hall', notes: '18 steps, bhajans, Harivarasanam', phones: ['+919848011111', '+919848055555'] },
      { id: 2, kind: 'Abhishekam', date: inDays(3), session: 'Morning', venue: 'Peetam hall', notes: 'Panchamrita abhishekam', phones: ['+919848022222'] },
      { id: 3, kind: 'Padi Pooja', date: inDays(30), session: 'Evening', venue: 'Peetam hall', notes: '', phones: ['+919848033333'] },
      { id: 4, kind: 'Abhishekam', date: inDays(16), session: 'Morning', venue: 'Peetam hall', notes: '', phones: ['+919848011111'] },
      { id: 5, kind: 'Padi Pooja', date: inDays(16), session: 'Evening', venue: 'Peetam hall', notes: 'Saturday padi pooja', phones: ['+919848022222', '+919848044444'] },
      { id: 6, kind: 'Abhishekam', date: inDays(6), session: 'Evening', venue: 'Peetam hall', notes: 'Ksheerabhishekam', phones: ['+919848055555', '+919848066666'] },
      { id: 7, kind: 'Abhishekam', date: inDays(23), session: 'Morning', venue: 'Peetam hall', notes: 'Pushpabhishekam', phones: [] },
      { id: 8, kind: 'Mandala Pooja', date: inDays(13), session: 'Evening', venue: 'Peetam hall', notes: 'Mandala season start', phones: ['+919848011111', '+919848022222', '+919848033333'] },
      { id: 9, kind: 'Ashta Kalasa Pooja', date: inDays(21), session: 'Morning', venue: 'Peetam hall', notes: '', phones: ['+919848044444'] },
      { id: 10, kind: 'Padi Pooja', date: inDays(37), session: 'Evening', venue: 'Peetam hall', notes: '', phones: [] },
    ],
    nextId: { pay: 14, batch: 3, exp: 5, pooja: 11 },
  }
  migrateServices(db)
  return db
}

export function emptyDB(): DB {
  return { devotees: [], family: [], deekshas: [], payments: [], batches: [], batch_members: [], expenses: [], poojas: [], nextId: { pay: 1, batch: 1, exp: 1, pooja: 1 } }
}

export function loadDB(): DB {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (d && d.devotees) {
      d.devotees.forEach((x: any) => { if (!x.referred_by) x.referred_by = NEW_TAG; delete x.guru_swamy })
      if (!d.expenses) d.expenses = []
      if (!d.poojas) d.poojas = []
      d.poojas.forEach((p: any) => { if (!Array.isArray(p.phones)) p.phones = [] })
      d.payments.forEach((p: any) => { if (p.type === 'Annadanam' && p.service_date) p.session = 'Afternoon' })
      d.nextId = d.nextId || {}
      if (!d.nextId.pooja) d.nextId.pooja = d.poojas.reduce((m: number, p: any) => Math.max(m, +p.id || 0), 0) + 1
      migrateServices(d)
      if (!d.nextId.exp) d.nextId.exp = d.expenses.reduce((m: number, e: any) => Math.max(m, +e.id || 0), 0) + 1
      return d as DB
    }
  } catch { /* fall through to seed */ }
  const s = seed()
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* ignore */ }
  return s
}
