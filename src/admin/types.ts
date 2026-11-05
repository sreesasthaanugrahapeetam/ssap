export const STORAGE_KEY = 'ssap_admin_v1'
export const SESSION_KEY = 'ssap_in'
export const PASSCODE = 'swamiye'
export const THIS_YEAR = new Date().getFullYear()
/** Deeksha closes automatically this many days after the irumudi date. */
export const CLOSE_BUFFER_DAYS = 3
export const NEW_TAG = 'New to SSAP'
export const SVC_TYPES = ['Annadanam', 'Alpaharam', 'Pooja']
/** Allowed sessions per service: Annadanam is afternoon only; Alpaharam and Pooja are morning or evening. */
export const sessionsFor = (type: string) => (type === 'Annadanam' ? ['Afternoon'] : ['Morning', 'Evening'])
/** Seva kinds shown in their own dashboard panel. */
/** Default amount filled in when the Maintenance payment type is chosen. */
export const MAINTENANCE_AMOUNT = 10116
export const SEVA_KINDS = ['Annadanam', 'Alpaharam']
export const SESSION_ORDER = ['Morning', 'Afternoon', 'Evening']
export const POOJA_KINDS = ['Padi Pooja', 'Abhishekam', 'Annadanam', 'Alpaharam', 'Mandala Pooja', 'Ashta Kalasa Pooja', 'Other']
export const EXP_CATS = ['Annadanam supplies', 'Pooja items', 'Yatra / Transport', 'Utilities', 'Maintenance', 'Honorarium / Salaries', 'Events', 'Other']
/** Ayyappa deeksha levels by year; 1st year is Kanni Swamy (Kanney). 18th is Narikela Swamy; Guru Swamy (18+) is the separate mark beyond 18 years. */
export const SWAMY_YEARS = [
  '1st - Kanni Swamy', '2nd - Kathi Swamy', '3rd - Ganta Swamy', '4th - Gada Swamy', '5th - Peru Swamy', '6th - Jyothi Swamy',
  '7th - Surya Swamy', '8th - Chandra Swamy', '9th - Trishula Swamy', '10th - Vishnu Chakra Swamy', '11th - Shankadhara Swamy',
  '12th - Nagabharana Swamy', '13th - Srihari Swamy', '14th - Padma Swamy', '15th - Sri Swamy', '16th - Sri Sabari Swamy',
  '17th - Omkara Swamy', '18th - Narikela Swamy (Guruswamy)', 'Guru Swamy (18+)',
]
/** Map earlier saved values (e.g. 'Kanney (1st year)', '2nd year') to the current labels. */
export const migrateSwamyYear = (v: string) => {
  if (!v || SWAMY_YEARS.includes(v)) return v || ''
  const n = /^kanney/i.test(v) ? 1 : parseInt(v, 10)
  return SWAMY_YEARS[n - 1] || ''
}
export const GOTHRAMS = ['Achyuta','Agastya','Angirasa','Atreya','Aupamanyava','Badarayana','Bharadwaja','Bhargava','Bhrigu','Chyavana','Dhananjaya','Garga','Gargeya','Gautama','Haritasa','Jabali','Jamadagni','Kanva','Kapila','Kashyapa','Katyayana','Kaundinya','Kaushika','Krishnatreya','Kutsa','Lohita','Maitreya','Mandavya','Markandeya','Maudgalya','Mudgala','Naidhruva','Paingala','Parashara','Pulaha','Pulastya','Rathitara','Sandilya','Sankriti','Sathyakama','Shaunaka','Srivatsa','Upamanyu','Vadhula','Valmiki','Vamadeva','Vasishta','Vatsa','Vishnuvriddha','Vishwamitra','Vyaghrapada','Yaska']

export interface Devotee {
  phone: string; full_name: string; email: string; address: string; dob: string
  blood_group: string; gothram: string; swamy_year: string; referred_by: string; photo: string; notes: string; active: string
}
export interface FamilyMember { phone: string; name: string; relation: string; member_phone: string; emergency: string }
export interface Deeksha { phone: string; year: number; malai_date: string; end_date: string; mandala_days: number; irumudi_date: string }
export interface Payment {
  id?: number; phone: string; type: string; service_date?: string; session?: string; pooja_id?: number
  amount: number; date: string; mode: string; status: string; note: string
}
export interface Guru { name: string; phone: string }
export interface Batch { id: number; year: number; name: string; travel_date: string; vehicle: string; capacity: number; notes: string; gurus: Guru[] }
export interface BatchMember { batch_id: number; phone: string }
export interface Expense { id: number; date: string; category: string; amount: number; mode: string; paid_to: string; note: string }

export interface Pooja { id: number; kind: string; date: string; session: string; venue: string; notes: string; phones: string[] }

export interface DB {
  devotees: Devotee[]
  family: FamilyMember[]
  deekshas: Deeksha[]
  payments: Payment[]
  batches: Batch[]
  batch_members: BatchMember[]
  expenses: Expense[]
  poojas: Pooja[]
  nextId: { pay: number; batch: number; exp: number; pooja: number }
}

export type View = 'dash' | 'devotees' | 'batches' | 'payments' | 'expenses' | 'poojas' | 'excel'

export type DrawerState =
  | { kind: 'devotee'; phone?: string; nonce: number }
  | { kind: 'batch'; id: number | null; nonce: number }
  | { kind: 'expense'; index: number | null; nonce: number }
  | { kind: 'pooja'; index: number | null; nonce: number }
  | { kind: 'payment'; index: number; nonce: number }
  | null
