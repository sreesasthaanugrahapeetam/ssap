import { CLOSE_BUFFER_DAYS, DB, migrateSwamyYear, SWAMY_YEARS, Deeksha, Devotee, NEW_TAG, THIS_YEAR, STORAGE_KEY, SESSION_ORDER, sessionsFor, POOJA_KINDS, Payment } from './types'

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
  phone: '', full_name: '', email: '', address: '', dob: '', blood_group: '', gothram: '', swamy_year: '',
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
/** Irumudi date = malai date + mandala days (same end-of-mandala rule as daysLeft). '' when no malai date. */
export function irumudiOf(malai: string, days: number | string): string {
  if (!malai) return ''
  const d = new Date(malai)
  if (isNaN(d.getTime())) return ''
  d.setUTCDate(d.getUTCDate() + (+days || 41))
  return d.toISOString().slice(0, 10)
}
/** Auto close date: irumudi date plus the buffer days. */
export const irumudiFor = (dk: Deeksha) => dk.irumudi_date || irumudiOf(dk.malai_date, dk.mandala_days)
export function closeDateFor(dk: Deeksha): string {
  const i = irumudiFor(dk)
  if (!i) return ''
  const d = new Date(i)
  if (isNaN(d.getTime())) return ''
  d.setUTCDate(d.getUTCDate() + CLOSE_BUFFER_DAYS)
  return d.toISOString().slice(0, 10)
}
/** A deeksha is closed once today is past its auto close date. Without a malai date, falls back to a stored end date. */
export function isClosed(dk: Deeksha): boolean {
  const close = closeDateFor(dk)
  return close ? todayISO() > close : !!dk.end_date
}
export function daysLeft(dk?: Deeksha): number | null {
  if (!dk || !dk.malai_date || isClosed(dk)) return null
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
    const kind = POOJA_KINDS.includes(p.type) ? p.type : 'Pooja'
    d.poojas.push({ id, kind, date: p.service_date as string, session: p.session || sessionsFor(kind)[0], venue: '', notes: p.note, phones: [p.phone] })
    p.pooja_id = id
  })
}

export function seed(): DB {
  const Y = THIS_YEAR
  const D = (phone: string, full_name: string, extra: Partial<Devotee>): Devotee =>
    Object.assign({ phone, full_name, email: '', address: '', dob: '', blood_group: '', gothram: '', swamy_year: '', referred_by: NEW_TAG, photo: '', notes: '', active: 'yes' }, extra)
  const ph = (n: number) => '+9198480' + String(70000 + n)
  const P0 = ['+919848011111', '+919848022222', '+919848033333', '+919848044444', '+919848055555', '+919848066666']

  const devotees: Devotee[] = [
    D(P0[0], 'Ramesh Kumar', { referred_by: 'Prasad Sharma', email: 'ramesh@example.com', address: 'Hyderabad', dob: '1985-04-12', blood_group: 'O+', gothram: 'Kashyapa' }),
    D(P0[1], 'Srinivas Rao', { referred_by: 'Prasad Sharma', address: 'Vijayawada', dob: '1978-09-03', blood_group: 'B+', gothram: 'Bharadwaja' }),
    D(P0[2], 'Venkata Reddy', { referred_by: 'Ramesh Kumar', address: 'Guntur', dob: '1990-01-21', blood_group: 'A+', gothram: 'Vasishta' }),
    D(P0[3], 'Anil Varma', { address: 'Warangal', dob: '1982-11-30', blood_group: 'AB+', gothram: 'Atreya' }),
    D(P0[4], 'Prasad Sharma', { address: 'Hyderabad', dob: '1969-06-15', blood_group: 'O-', gothram: 'Kaushika', notes: 'Senior guru swamy' }),
    D(P0[5], 'Mahesh Babu', { address: 'Nellore', dob: '1995-02-08', blood_group: 'B-', gothram: 'Gautama' }),
    D(ph(1), 'Krishna Murthy', { referred_by: 'Prasad Sharma', address: 'Secunderabad', dob: '1972-03-18', blood_group: 'O+', gothram: 'Srivatsa', notes: 'Guru swamy, 25 years of deeksha' }),
    D(ph(2), 'Raghava Rao', { referred_by: 'Krishna Murthy', address: 'Kukatpally', dob: '1980-07-25', blood_group: 'A+', gothram: 'Harita' }),
    D(ph(3), 'Sudhakar Reddy', { referred_by: 'Ramesh Kumar', address: 'Kurnool', dob: '1976-12-02', blood_group: 'B+', gothram: 'Kausika' }),
    D(ph(4), 'Naresh Goud', { address: 'Karimnagar', dob: '1988-05-14', blood_group: 'O+', gothram: 'Maudgalya' }),
    D(ph(5), 'Satish Kumar', { referred_by: 'Srinivas Rao', address: 'Eluru', dob: '1991-09-09', blood_group: 'AB-', gothram: 'Kutsa' }),
    D(ph(6), 'Balaji Naidu', { referred_by: 'Prasad Sharma', address: 'Tirupati', dob: '1983-01-30', blood_group: 'A-', gothram: 'Agastya' }),
    D(ph(7), 'Chandra Sekhar', { referred_by: 'Krishna Murthy', address: 'Visakhapatnam', dob: '1974-10-11', blood_group: 'B+', gothram: 'Jamadagni', notes: 'Annadanam regular donor' }),
    D(ph(8), 'Durga Prasad', { address: 'Rajahmundry', dob: '1986-08-21', blood_group: 'O+', gothram: 'Parashara' }),
    D(ph(9), 'Eswar Rao', { referred_by: 'Raghava Rao', address: 'Kakinada', dob: '1993-04-04', blood_group: 'A+', gothram: 'Shandilya' }),
    D(ph(10), 'Gopal Krishna', { referred_by: 'Venkata Reddy', address: 'Nizamabad', dob: '1979-06-27', blood_group: 'B-', gothram: 'Upamanyu' }),
    D(ph(11), 'Hari Prasad', { referred_by: 'Prasad Sharma', address: 'Ongole', dob: '1968-02-16', blood_group: 'O+', gothram: 'Vishwamitra', notes: 'Senior guru swamy' }),
    D(ph(12), 'Jagadeesh Babu', { address: 'Khammam', dob: '1990-11-05', blood_group: 'AB+', gothram: 'Bhrigu' }),
    D(ph(13), 'Kiran Kumar', { referred_by: 'Ramesh Kumar', address: 'Anantapur', dob: '1997-03-23', blood_group: 'A+', gothram: 'Gargeya', active: 'no', notes: 'Moved abroad' }),
    D(ph(14), 'Lakshmi Narayana', { referred_by: 'Hari Prasad', address: 'Machilipatnam', dob: '1971-12-19', blood_group: 'B+', gothram: 'Dhananjaya' }),
  ]
  // sample deeksha year: mostly Kanney (1st year) so reports have data
  const YEARS = [0, 0, 1, 0, 17, 2, 3, 0, 4, 1, 0, 11, 2, 0, 6, 5, 8].map((i) => SWAMY_YEARS[i])
  devotees.forEach((d, i) => { d.swamy_year = YEARS[i % YEARS.length] })
  // mock Kanni Swamy (1st year) list: new devotees on their first deeksha
  const K = SWAMY_YEARS[0]
  const kanni: [number, string, string, string, string, string, string][] = [
    [15, 'Aravind Reddy', 'Prasad Sharma', 'Hyderabad', '2001-05-09', 'Bharadwaja', 'O+'],
    [16, 'Bhaskar Rao', 'Krishna Murthy', 'Secunderabad', '1994-08-19', 'Kashyapa', 'A+'],
    [17, 'Charan Teja', 'Hari Prasad', 'Ongole', '2003-01-14', 'Vasishta', 'B+'],
    [18, 'Dinesh Kumar', NEW_TAG, 'Warangal', '1998-12-02', 'Atreya', 'AB+'],
    [19, 'Ganesh Naidu', 'Prasad Sharma', 'Tirupati', '1989-03-27', 'Kaushika', 'O-'],
    [20, 'Harsha Vardhan', 'Krishna Murthy', 'Kukatpally', '2000-07-11', 'Gautama', 'A-'],
    [21, 'Ismail Raju', NEW_TAG, 'Vijayawada', '1996-10-30', 'Achyuta', 'B-'],
    [22, 'Jaya Chandra', 'Hari Prasad', 'Guntur', '1992-02-22', 'Srivatsa', 'O+'],
    [23, 'Karthik Goud', 'Ramesh Kumar', 'Karimnagar', '2002-09-05', 'Maudgalya', 'A+'],
    [24, 'Laxman Rao', NEW_TAG, 'Nizamabad', '1985-06-16', 'Kutsa', 'B+'],
    [25, 'Mohan Krishna', 'Prasad Sharma', 'Eluru', '1997-04-08', 'Agastya', 'AB-'],
    [26, 'Nagendra Babu', 'Krishna Murthy', 'Khammam', '1991-11-25', 'Parashara', 'O+'],
  ]
  kanni.forEach(([n, name, ref, address, dob, gothram, blood_group]) => devotees.push(D(ph(n), name, { referred_by: ref, address, dob, gothram, blood_group, swamy_year: K })))
  // senior swamys so every level from 1st to Guru Swamy (18+) has at least one devotee
  const seniors: [number, string, number, string, string][] = [
    [27, 'Narasimha Rao', 7, 'Rajahmundry', 'Kaundinya'], [28, 'Om Prakash', 9, 'Kakinada', 'Garga'],
    [29, 'Pavan Kalyan', 10, 'Anantapur', 'Haritasa'], [30, 'Rajesh Varma', 12, 'Nellore', 'Jabali'],
    [31, 'Sai Kiran', 13, 'Kurnool', 'Angirasa'], [32, 'Tirumala Rao', 14, 'Machilipatnam', 'Vatsa'],
    [33, 'Uday Kumar', 15, 'Visakhapatnam', 'Pulastya'], [34, 'Venu Gopal', 16, 'Hyderabad', 'Sandilya'],
    [35, 'Yadagiri Rao', 18, 'Hyderabad', 'Kapila'],
  ]
  seniors.forEach(([n, name, lvl, address, gothram]) => devotees.push(D(ph(n), name, { referred_by: 'Prasad Sharma', address, gothram, swamy_year: SWAMY_YEARS[lvl], dob: '19' + (50 + lvl) + '-06-15' })))
  const fam = (phone: string, name: string, relation: string, member_phone = '', emergency = 'no') => ({ phone, name, relation, member_phone, emergency })
  const family = [
    fam(P0[0], 'Lakshmi Kumar', 'Wife', '+919848077777', 'yes'), fam(P0[0], 'Arjun Kumar', 'Son'),
    fam(P0[1], 'Padma Rao', 'Wife', '+919848088888', 'yes'), fam(P0[2], 'Suresh Reddy', 'Brother', '+919848099999', 'yes'),
    fam(ph(1), 'Sarada Murthy', 'Wife', '+919848071001', 'yes'), fam(ph(1), 'Vamsi Murthy', 'Son'),
    fam(ph(3), 'Rajeswari Reddy', 'Wife', '+919848071003', 'yes'), fam(ph(7), 'Kamala Sekhar', 'Wife', '+919848071007', 'yes'),
    fam(ph(11), 'Annapurna Prasad', 'Wife', '+919848071011', 'yes'), fam(ph(14), 'Sita Narayana', 'Wife', '+919848071014', 'yes'),
  ]
  const dk = (phone: string, malai: string, days = 41, extra: Partial<Deeksha> = {}): Deeksha =>
    ({ phone, year: Y, malai_date: malai, end_date: '', mandala_days: days, irumudi_date: '', ...extra })
  const deekshas: Deeksha[] = [
    dk(P0[0], inDays(-5)), dk(P0[1], inDays(-5)), dk(P0[2], inDays(3), 48), dk(P0[4], inDays(-5)),
    dk(ph(1), inDays(-12)), dk(ph(2), inDays(-5)), dk(ph(3), inDays(3)), dk(ph(5), inDays(8), 21),
    dk(ph(7), inDays(-12)), dk(ph(9), inDays(3)), dk(ph(11), inDays(-12)), dk(ph(14), inDays(8), 48),
    { phone: P0[0], year: Y - 1, malai_date: (Y - 1) + '-11-17', end_date: (Y - 1) + '-12-28', mandala_days: 41, irumudi_date: (Y - 1) + '-12-27' },
    { phone: P0[3], year: Y - 1, malai_date: (Y - 1) + '-11-17', end_date: (Y - 1) + '-12-28', mandala_days: 41, irumudi_date: (Y - 1) + '-12-27' },
    { phone: ph(4), year: Y - 1, malai_date: (Y - 1) + '-11-20', end_date: (Y - 1) + '-12-30', mandala_days: 41, irumudi_date: (Y - 1) + '-12-29' },
  ]

  deekshas.push(
    ...[27, 28, 29, 30, 31, 32, 33, 34, 35].map((n) => dk(ph(n), inDays(-12))),
    dk(ph(15), inDays(-10)), dk(ph(16), inDays(-10)), dk(ph(17), inDays(-3)), dk(ph(18), inDays(-3), 48), dk(ph(19), inDays(0)), dk(ph(20), inDays(0)),
    dk(ph(21), inDays(2), 21), dk(ph(22), inDays(2)), dk(ph(23), inDays(5)), dk(ph(24), inDays(5), 48), dk(ph(25), inDays(9)), dk(ph(26), inDays(9)),
  )

  // ── payments (money records) ──
  let pid = 1
  type Extra = Partial<Payment>
  const pay = (phone: string, type: string, amount: number, status: 'Paid' | 'Pending', extra: Extra = {}): Payment => ({
    id: pid++, phone, type, amount, status, date: status === 'Paid' ? inDays(-((pid * 3) % 20) - 1) : '', mode: status === 'Paid' ? (pid % 3 ? 'UPI' : 'Cash') : '', note: '', ...extra,
  })
  // service-dated payments become Poojas & Seva activities (migrateServices); kind = payment type
  const svc = (phone: string, type: string, day: number, session: string, amount: number, status: 'Paid' | 'Pending', note = '') =>
    pay(phone, type, amount, status, { service_date: inDays(day), session, note })
  const payments: Payment[] = [
    // Annadanam – afternoon only
    svc(ph(7), 'Annadanam', 0, 'Afternoon', 15000, 'Paid', 'Wedding anniversary'),
    svc(P0[0], 'Annadanam', 1, 'Afternoon', 5000, 'Paid', 'Lunch'),
    svc(P0[4], 'Annadanam', 2, 'Afternoon', 10000, 'Paid', 'Full day'),
    svc(ph(3), 'Annadanam', 4, 'Afternoon', 7500, 'Paid', 'Birthday seva'),
    svc(P0[3], 'Annadanam', 6, 'Afternoon', 5000, 'Pending', 'In memory of father'),
    svc(ph(14), 'Annadanam', 8, 'Afternoon', 12000, 'Paid', 'House warming'),
    svc(P0[5], 'Annadanam', 11, 'Afternoon', 7500, 'Paid', 'Birthday seva'),
    svc(ph(1), 'Annadanam', 14, 'Afternoon', 20000, 'Paid', 'Guru swamy mandala seva'),
    svc(ph(11), 'Annadanam', 18, 'Afternoon', 15000, 'Pending', ''),
    svc(P0[2], 'Annadanam', 22, 'Afternoon', 5000, 'Paid', ''),
    svc(ph(9), 'Annadanam', 27, 'Afternoon', 6000, 'Paid', 'Thanksgiving'),
    // Alpaharam – morning or evening
    svc(P0[1], 'Alpaharam', 0, 'Morning', 2000, 'Paid', 'Tiffin for devotees'),
    svc(ph(2), 'Alpaharam', 1, 'Evening', 2500, 'Paid', 'Fruits and milk'),
    svc(P0[4], 'Alpaharam', 3, 'Morning', 2000, 'Paid', ''),
    svc(ph(5), 'Alpaharam', 5, 'Evening', 3000, 'Pending', 'Sweet pongal'),
    svc(ph(8), 'Alpaharam', 7, 'Morning', 2000, 'Paid', ''),
    svc(P0[0], 'Alpaharam', 10, 'Evening', 2500, 'Paid', 'Kesari and tea'),
    svc(ph(10), 'Alpaharam', 13, 'Morning', 2000, 'Pending', ''),
    svc(ph(12), 'Alpaharam', 17, 'Evening', 3000, 'Paid', 'Fruits'),
    svc(ph(6), 'Alpaharam', 21, 'Morning', 2000, 'Paid', ''),
    svc(P0[3], 'Alpaharam', 25, 'Evening', 2500, 'Paid', ''),
    // Poojas sponsored by devotees
    svc(P0[5], 'Abhishekam', 0, 'Evening', 1500, 'Paid', 'Ksheerabhishekam'),
    svc(ph(4), 'Abhishekam', 3, 'Morning', 1500, 'Paid', 'Panchamrita abhishekam'),
    svc(ph(2), 'Abhishekam', 6, 'Evening', 1500, 'Paid', 'Pushpabhishekam'),
    svc(ph(7), 'Abhishekam', 12, 'Morning', 1500, 'Pending', ''),
    svc(P0[1], 'Abhishekam', 19, 'Evening', 1500, 'Paid', 'Honey abhishekam'),
    svc(ph(1), 'Padi Pooja', 1, 'Evening', 3000, 'Paid', '18 steps, bhajans, Harivarasanam'),
    svc(P0[4], 'Padi Pooja', 9, 'Evening', 3000, 'Paid', 'Saturday padi pooja'),
    svc(ph(11), 'Padi Pooja', 16, 'Evening', 3000, 'Paid', ''),
    svc(P0[0], 'Padi Pooja', 23, 'Evening', 3000, 'Pending', ''),
    svc(ph(14), 'Padi Pooja', 30, 'Evening', 3000, 'Paid', ''),
    svc(P0[2], 'Mandala Pooja', 13, 'Evening', 1500, 'Paid', 'Mandala season start'),
    svc(ph(3), 'Ashta Kalasa Pooja', 21, 'Morning', 2500, 'Paid', ''),
    // Maintenance (default 10116)
    ...[P0[0], P0[1], P0[4], ph(1), ph(7), ph(11)].map((x) => pay(x, 'Maintenance', 10116, 'Paid', { note: 'Annual maintenance' })),
    ...[P0[2], ph(3), ph(14)].map((x) => pay(x, 'Maintenance', 10116, 'Pending', { note: 'Annual maintenance' })),
    // Yatra seats
    ...[P0[0], P0[1], P0[4], ph(1), ph(2), ph(7), ph(11)].map((x) => pay(x, 'Yatra', 6000, 'Paid', { note: 'Bus seat' })),
    ...[P0[2], ph(3), ph(5), ph(9), ph(14)].map((x) => pay(x, 'Yatra', 6000, 'Pending', { note: 'Bus seat' })),
    // Kanni Swamy: first-year maintenance and yatra seats
    ...[ph(15), ph(16), ph(17), ph(19), ph(20), ph(22), ph(25)].map((x) => pay(x, 'Maintenance', 10116, 'Paid', { note: 'Annual maintenance' })),
    ...[ph(18), ph(21), ph(23), ph(24), ph(26)].map((x) => pay(x, 'Maintenance', 10116, 'Pending', { note: 'Annual maintenance' })),
    ...[ph(15), ph(16), ph(19), ph(22), ph(25)].map((x) => pay(x, 'Yatra', 6000, 'Paid', { note: 'Bus seat' })),
    ...[ph(17), ph(18), ph(20), ph(23)].map((x) => pay(x, 'Yatra', 6000, 'Pending', { note: 'Bus seat' })),
    // Donations
    pay(ph(7), 'Donation', 25000, 'Paid', { note: 'Temple fund' }), pay(ph(12), 'Donation', 5000, 'Paid', { note: 'Annadanam fund' }),
    pay(ph(6), 'Donation', 2000, 'Paid', { note: '' }),
  ]

  // ── poojas without a payment record, incl. custom "Other" kinds ──
  let oid = 1
  const act = (kind: string, day: number, session: string, notes: string, phones: string[] = []) =>
    ({ id: oid++, kind, date: inDays(day), session, venue: 'Peetam hall', notes, phones })
  const poojas = [
    act('Padi Pooja', 37, 'Evening', 'Karthika masam padi pooja', [ph(1), ph(2)]),
    act('Abhishekam', 26, 'Morning', 'Pushpabhishekam', []),
    act('Abhishekam', 33, 'Evening', '', [ph(8)]),
    act('Satyanarayana Vratham', 15, 'Morning', 'Monthly vratham', [ph(3), ph(10)]),
    act('Ganapathi Homam', 5, 'Morning', 'Before mandala season', [P0[4], ph(11)]),
    act('Sahasranama Archana', 2, 'Evening', 'Harihara sahasranama', [ph(2)]),
  ]

  // ── batches ──
  const batches = [
    { id: 1, year: Y, name: 'Batch 1 – Bus A', travel_date: Y + '-12-26', vehicle: 'Bus A (45 seats)', capacity: 45, notes: 'Depart 5 AM from Peetam', gurus: [{ name: 'Prasad Sharma', phone: P0[4] }, { name: 'Krishna Murthy', phone: ph(1) }] },
    { id: 2, year: Y, name: 'Batch 2 – Tempo', travel_date: Y + '-12-28', vehicle: 'Tempo Traveller', capacity: 14, notes: 'Depart 6 AM from Peetam', gurus: [{ name: 'Hari Prasad', phone: ph(11) }] },
    { id: 3, year: Y, name: 'Batch 3 – Bus B', travel_date: (Y + 1) + '-01-04', vehicle: 'Bus B (45 seats)', capacity: 45, notes: 'Makara Jyothi darshan batch', gurus: [{ name: 'Ramesh Kumar', phone: P0[0] }, { name: 'Chandra Sekhar', phone: ph(7) }] },
  ]
  const members: [number, string[]][] = [
    [1, [P0[0], P0[1], P0[4], ph(1), ph(2), ph(7), ph(15), ph(16), ph(19), ph(20), ph(22)]],
    [2, [P0[2], ph(3), ph(9), ph(14), ph(17), ph(18), ph(21), ph(23)]],
    [3, [ph(5), ph(11), ph(12), ph(24), ph(25)]],
  ]
  const batch_members = members.flatMap(([batch_id, list]) => list.map((phone) => ({ batch_id, phone })))

  const ex = (day: number, category: string, amount: number, mode: string, paid_to: string, note: string, id: number) =>
    ({ id, date: inDays(day), category, amount, mode, paid_to, note })
  const expenses = [
    ex(-30, 'Annadanam supplies', 8200, 'Cash', 'Sri Lakshmi Provisions', 'Rice, dal, oil', 1),
    ex(-27, 'Pooja items', 2400, 'UPI', 'Flower market', 'Garlands, camphor, ghee', 2),
    ex(-21, 'Utilities', 3100, 'Bank', 'TSSPDCL', 'Electricity bill', 3),
    ex(-14, 'Yatra / Transport', 12000, 'UPI', 'Bus operator', 'Advance for Bus A', 4),
    ex(-12, 'Annadanam supplies', 6400, 'Cash', 'Sri Lakshmi Provisions', 'Vegetables and milk', 5),
    ex(-10, 'Maintenance', 4500, 'Cash', 'Ravi Electricals', 'Hall lights repair', 6),
    ex(-8, 'Honorarium / Salaries', 9000, 'Bank', 'Pujari', 'Monthly honorarium', 7),
    ex(-6, 'Pooja items', 3200, 'UPI', 'Ayyappa Stores', 'Abhishekam materials', 8),
    ex(-4, 'Events', 5500, 'Cash', 'Sound and lighting', 'Padi pooja arrangements', 9),
    ex(-2, 'Utilities', 1200, 'UPI', 'Water board', 'Water bill', 10),
    ex(-1, 'Annadanam supplies', 7300, 'Cash', 'Sri Lakshmi Provisions', 'Rice and groceries', 11),
    ex(-1, 'Prasadam printing', 1800, 'UPI', 'Print shop', 'Booklets', 12),
  ]

  const db: DB = {
    devotees, family, deekshas, payments, batches, batch_members, expenses, poojas,
    nextId: { pay: pid, batch: 4, exp: 13, pooja: oid },
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
      d.devotees.forEach((x: any) => { x.swamy_year = migrateSwamyYear(x.swamy_year); if (!x.referred_by) x.referred_by = NEW_TAG; delete x.guru_swamy })
      ;(d.deekshas || []).forEach((k: any) => { if (k.malai_date) { if (!k.irumudi_date) k.irumudi_date = irumudiOf(k.malai_date, k.mandala_days); k.end_date = closeDateFor(k) } })
      if (!d.expenses) d.expenses = []
      if (!d.poojas) d.poojas = []
      d.batches.forEach((b: any) => { if (!Array.isArray(b.gurus)) b.gurus = [] })
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
