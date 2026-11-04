export const STORAGE_KEY = 'ssap_admin_v1'
export const SESSION_KEY = 'ssap_in'
export const PASSCODE = 'swamiye'
export const THIS_YEAR = new Date().getFullYear()
export const NEW_TAG = 'New to SSAP'
export const SVC_TYPES = ['Annadanam', 'Alpaharam', 'Pooja']
export const EXP_CATS = ['Annadanam supplies', 'Pooja items', 'Yatra / Transport', 'Utilities', 'Maintenance', 'Honorarium / Salaries', 'Events', 'Other']
export const GOTHRAMS = ['Achyuta','Agastya','Angirasa','Atreya','Aupamanyava','Badarayana','Bharadwaja','Bhargava','Bhrigu','Chyavana','Dhananjaya','Garga','Gargeya','Gautama','Haritasa','Jabali','Jamadagni','Kanva','Kapila','Kashyapa','Katyayana','Kaundinya','Kaushika','Krishnatreya','Kutsa','Lohita','Maitreya','Mandavya','Markandeya','Maudgalya','Mudgala','Naidhruva','Paingala','Parashara','Pulaha','Pulastya','Rathitara','Sandilya','Sankriti','Sathyakama','Shaunaka','Srivatsa','Upamanyu','Vadhula','Valmiki','Vamadeva','Vasishta','Vatsa','Vishnuvriddha','Vishwamitra','Vyaghrapada','Yaska']

export interface Devotee {
  phone: string; full_name: string; email: string; address: string; dob: string
  blood_group: string; gothram: string; referred_by: string; photo: string; notes: string; active: string
}
export interface FamilyMember { phone: string; name: string; relation: string; member_phone: string; emergency: string }
export interface Deeksha { phone: string; year: number; malai_date: string; end_date: string; mandala_days: number; irumudi_date: string }
export interface Payment {
  id?: number; phone: string; type: string; service_date?: string; session?: string
  amount: number; date: string; mode: string; status: string; note: string
}
export interface Batch { id: number; year: number; name: string; travel_date: string; vehicle: string; capacity: number; notes: string }
export interface BatchMember { batch_id: number; phone: string }
export interface Expense { id: number; date: string; category: string; amount: number; mode: string; paid_to: string; note: string }

export interface DB {
  devotees: Devotee[]
  family: FamilyMember[]
  deekshas: Deeksha[]
  payments: Payment[]
  batches: Batch[]
  batch_members: BatchMember[]
  expenses: Expense[]
  nextId: { pay: number; batch: number; exp: number }
}

export type View = 'dash' | 'devotees' | 'batches' | 'payments' | 'expenses' | 'excel'

export type DrawerState =
  | { kind: 'devotee'; phone?: string; nonce: number }
  | { kind: 'batch'; id: number | null; nonce: number }
  | { kind: 'expense'; index: number | null; nonce: number }
  | null
