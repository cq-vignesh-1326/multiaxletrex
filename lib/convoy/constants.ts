import type { CatKey, LedgerType, PaidBy, PayMode } from './types'

export interface Cat {
  k: CatKey
  en: string
  ta: string
  by: PaidBy
  place?: boolean
}

export const CATS: Cat[] = [
  { k: 'diesel', en: 'Diesel', ta: 'டீசல்', by: 'office' },
  { k: 'other', en: 'Other expenses', ta: 'இதர செலவு', by: 'driver' },
  { k: 'rto', en: 'RTO', ta: 'ஆர்.டி.ஓ', by: 'driver', place: true },
  { k: 'pc', en: 'PC (police)', ta: 'பி.சி', by: 'driver', place: true },
  { k: 'extra', en: 'Extra bata', ta: 'பின்படி', by: 'driver' },
  { k: 'toll', en: 'Toll', ta: 'பாலம்', by: 'office' },
  { k: 'naka', en: 'Naka / checkpost', ta: 'நாக்கா / செக்போஸ்ட்', by: 'driver', place: true },
  { k: 'workshop', en: 'Workshop', ta: 'பட்டறை செலவு', by: 'office' },
]
export const CAT_KEYS = CATS.map((c) => c.k)
/** Every head except diesel, which has its own litres/rate table. */
export const OTHER_CATS = CATS.slice(1)

export const ADV_MODES: [string, string][] = [
  ['GPay', 'ஜிபே'],
  ['Cash', 'ரொக்கம்'],
  ['Bank transfer', 'வங்கி'],
  ['Diesel card', 'டீசல் கார்டு'],
]

export const PMODES: [PayMode, string, string][] = [
  ['account', 'Account transfer', 'அக்கவுண்ட்'],
  ['cheque', 'Cheque', 'செக்'],
  ['gpay', 'GPay to office', 'ஜிபே'],
  ['driver', 'Driver collected cash', 'டிரைவர் வசூல்'],
]

export const LEDGER_TYPES: Record<LedgerType, [string, string]> = {
  salary: ['Salary due', 'சம்பளம்'],
  paid: ['Paid to driver', 'கொடுத்தது'],
  returned: ['Driver returned money', 'திரும்ப வந்தது'],
  adj: ['Adjustment (+ owe driver / − driver owes)', 'சரிசெய்தல்'],
}
