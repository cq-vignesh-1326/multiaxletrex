// Shapes of the Convoy book. Number fields hold whatever the user typed ('' / string)
// on the client and are normalised to number | null by the API before storage.
export type Numish = number | string | null | undefined
export type PaidBy = 'driver' | 'office'
export type PayMode = 'account' | 'cheque' | 'gpay' | 'driver'

export type CatKey = 'diesel' | 'other' | 'rto' | 'pc' | 'extra' | 'toll' | 'naka' | 'workshop'

export interface Payment {
  date: string
  mode: PayMode
  amount: Numish
  note: string
}

export interface Load {
  date: string
  from: string
  to: string
  goods: string
  ton: Numish
  /** Rate per ton as typed on the paper sheet; not used in any total. */
  perTon?: Numish
  rent: Numish
  comm?: Numish
  loading: Numish
  unloading: Numish
  payments: Payment[]
}

export interface Line {
  date: string
  desc: string
  amount: Numish
  by: PaidBy
  litres?: Numish
  rate?: Numish
}

export interface Advance {
  date: string
  mode: string
  amount: Numish
  note: string
}

export interface Sheet {
  id: string
  no: string
  paperNo?: string
  vehicle: string
  driver: string
  driver2: string
  cleaner: string
  from: string
  to: string
  startKm: Numish
  endKm: Numish
  totalKm: Numish
  commPct: Numish
  bataPct: Numish
  loads: Load[]
  commBy: PaidBy
  loadBy: PaidBy
  unloadBy: PaidBy
  lines: Record<CatKey, Line[]>
  cleanerBata: Numish
  driverExtra: Numish
  advances: Advance[]
  settled: boolean
  /** id of the sheet this sheet's driver balance was carried to */
  carriedTo?: string
  created: number
}

export interface Person {
  id: string
  name: string
  role: 'driver' | 'cleaner'
  phone: string
}

export interface Vehicle {
  id: string
  reg: string
  model: string
}

export type LedgerType = 'salary' | 'paid' | 'returned' | 'adj'

export interface LedgerEntry {
  id: string
  date: string
  driver: string
  type: LedgerType
  amount: Numish
  note: string
}

export interface Book {
  sheets: Sheet[]
  ledger: LedgerEntry[]
  people: Person[]
  vehicles: Vehicle[]
}

export const COLS = ['sheets', 'ledger', 'people', 'vehicles'] as const
export type Col = (typeof COLS)[number]
