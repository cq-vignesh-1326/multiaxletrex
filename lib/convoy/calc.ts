import { CATS, OTHER_CATS } from './constants'
import { fmtD, inr, monLbl, nf, num, uid } from './format'
import type { CatKey, Line, Sheet } from './types'

export type DriverItem = [en: string, ta: string, amount: number]

export interface SheetCalc {
  rent: number
  commPct: number
  comm: number
  loading: number
  unloading: number
  tons: number
  cat: Record<CatKey, number>
  catDriver: Record<CatKey, number>
  litres: number
  bataPct: number
  bata: number
  cleanerBata: number
  expense: number
  balance: number
  km: number
  mileage: number
  days: number
  perDay: number
  perKm: number
  driverItems: DriverItem[]
  driverSpent: number
  accRecv: number
  drvRecv: number
  pending: number
  advManual: number
  advance: number
  /** > 0: office pays driver; < 0: driver returns money. */
  settle: number
}

export const emptyLines = () =>
  Object.fromEntries(CATS.map((c) => [c.k, [] as Line[]])) as Record<CatKey, Line[]>

export function blankSheet(): Sheet {
  return {
    id: uid(), no: '', vehicle: '', driver: '', driver2: '', cleaner: '', from: '', to: '',
    startKm: '', endKm: '', totalKm: '', commPct: 5, bataPct: 10,
    loads: [blankLoad()],
    commBy: 'driver', loadBy: 'driver', unloadBy: 'driver',
    lines: emptyLines(), cleanerBata: '', driverExtra: '', advances: [], settled: false, created: Date.now(),
  }
}

export const blankLoad = () => ({
  date: '', from: '', to: '', goods: '', ton: '', rent: '', comm: '', loading: '', unloading: '', payments: [],
})

const pct = (v: unknown, dflt: number) => (v == null || v === '' ? dflt : num(v))

export function calc(s: Sheet): SheetCalc {
  const rent = s.loads.reduce((a, l) => a + num(l.rent), 0)
  const commPct = pct(s.commPct, 5)
  const comm = s.loads.reduce((a, l) => a + Math.round((num(l.rent) * commPct) / 100), 0)
  const loading = s.loads.reduce((a, l) => a + num(l.loading), 0)
  const unloading = s.loads.reduce((a, l) => a + num(l.unloading), 0)
  const tons = s.loads.reduce((a, l) => a + num(l.ton), 0)
  const cat = {} as Record<CatKey, number>
  const catDriver = {} as Record<CatKey, number>
  CATS.forEach((c) => {
    const ls = s.lines[c.k] || []
    cat[c.k] = ls.reduce((a, x) => a + num(x.amount), 0)
    catDriver[c.k] = ls.filter((x) => x.by === 'driver').reduce((a, x) => a + num(x.amount), 0)
  })
  const litres = (s.lines.diesel || []).reduce((a, x) => a + num(x.litres), 0)
  const bataPct = pct(s.bataPct, 10)
  const bata = Math.round((rent * bataPct) / 100)
  const cleanerBata = num(s.cleanerBata)
  const expense = comm + loading + unloading + CATS.reduce((a, c) => a + cat[c.k], 0) + bata + cleanerBata
  const balance = rent - expense
  const km = num(s.startKm) && num(s.endKm) ? num(s.endKm) - num(s.startKm) : num(s.totalKm)
  const mileage = km && litres ? km / litres : 0
  const days = s.from && s.to ? Math.round((+new Date(s.to) - +new Date(s.from)) / 864e5) : 0

  const d: DriverItem[] = []
  if (catDriver.diesel) d.push(['Diesel paid in cash', 'டீசல்', catDriver.diesel])
  if (s.commBy === 'driver' && comm) d.push(['Commission', 'கமிஷன்', comm])
  if (bata) d.push(['Driver bata', 'டிரைவர் படி', bata])
  if (cleanerBata) d.push(['Cleaner bata', 'கிளீனர் படி', cleanerBata])
  if (s.loadBy === 'driver' && loading) d.push(['Loading', 'ஏற்றுக்கூலி', loading])
  if (s.unloadBy === 'driver' && unloading) d.push(['Unloading', 'இறக்குக்கூலி', unloading])
  OTHER_CATS.forEach((c) => { if (catDriver[c.k]) d.push([c.en, c.ta, catDriver[c.k]]) })
  if (num(s.driverExtra)) d.push(['Extra to driver', 'கூடுதல்', num(s.driverExtra)])
  const driverSpent = d.reduce((a, x) => a + x[2], 0)

  const pays = s.loads.flatMap((l) => l.payments || [])
  const accRecv = pays.filter((p) => p.mode !== 'driver').reduce((a, p) => a + num(p.amount), 0)
  const drvRecv = pays.filter((p) => p.mode === 'driver').reduce((a, p) => a + num(p.amount), 0)
  const advManual = (s.advances || []).reduce((a, x) => a + num(x.amount), 0)
  // rent the driver collected counts as money he already holds
  const advance = advManual + drvRecv

  return {
    rent, commPct, comm, loading, unloading, tons, cat, catDriver, litres, bataPct, bata, cleanerBata,
    expense, balance, km, mileage, days,
    perDay: days > 0 ? balance / days : 0,
    perKm: km > 0 ? balance / km : 0,
    driverItems: d, driverSpent, accRecv, drvRecv,
    pending: Math.max(0, rent - accRecv - drvRecv),
    advManual, advance, settle: driverSpent - advance,
  }
}

export const monthOf = (s: Sheet) => (s.from || s.to || '').slice(0, 7) || 'Undated'

/** Sheet number = last 4 digits of the vehicle number + running count, e.g. 9854_001 */
export const vPrefix = (reg: string) => String(reg || '').replace(/\D/g, '').slice(-4) || '0000'
export function nextNo(reg: string, exceptId: string | null, pool: Sheet[]) {
  const pre = vPrefix(reg) + '_'
  let max = 0
  pool.forEach((x) => {
    if (x.id !== exceptId && x.no && x.no.startsWith(pre)) {
      const n = parseInt(x.no.slice(pre.length), 10)
      if (n > max) max = n
    }
  })
  return pre + String(max + 1).padStart(3, '0')
}

// ---------- reports ----------
export type RepBy = 'vehicle' | 'driver' | 'month'
export interface RepGroup {
  k: string
  label: string
  n: number; km: number; lk: number; l: number; rent: number; diesel: number; toll: number; comm: number
  bata: number; rto: number; other: number; exp: number; bal: number; pending: number; days: number
  margin: number; perKm: number; mileage: number; perDay: number
  veh: Set<string>
}
export type RepKey = 'bal' | 'margin' | 'perKm' | 'mileage' | 'rent' | 'exp' | 'diesel' | 'toll' | 'pending' | 'n' | 'km' | 'perDay'

export function repGroups(list: Sheet[], by: RepBy): RepGroup[] {
  const map: Record<string, RepGroup> = {}
  list.forEach((s) => {
    const k = by === 'vehicle' ? s.vehicle || '—' : by === 'driver' ? s.driver || '—' : monthOf(s)
    const r = calc(s)
    const g = (map[k] ||= {
      k, label: k, n: 0, km: 0, lk: 0, l: 0, rent: 0, diesel: 0, toll: 0, comm: 0, bata: 0, rto: 0, other: 0,
      exp: 0, bal: 0, pending: 0, days: 0, margin: 0, perKm: 0, mileage: 0, perDay: 0, veh: new Set(),
    })
    g.n++; g.km += r.km; g.l += r.litres; if (r.km) g.lk += r.litres
    g.rent += r.rent; g.diesel += r.cat.diesel; g.toll += r.cat.toll; g.comm += r.comm; g.bata += r.bata + r.cleanerBata
    g.rto += r.cat.rto + r.cat.pc + r.cat.naka; g.exp += r.expense; g.bal += r.balance; g.pending += r.pending; g.days += r.days
    if (s.vehicle) g.veh.add(s.vehicle)
  })
  return Object.values(map).map((g) => {
    g.other = g.exp - g.diesel - g.toll - g.comm - g.bata - g.rto
    g.margin = g.rent ? (g.bal / g.rent) * 100 : 0
    g.perKm = g.km ? g.bal / g.km : 0
    g.mileage = g.km && g.lk ? g.km / g.lk : 0
    g.perDay = g.days ? g.bal / g.days : 0
    g.label = by === 'month' ? monLbl(g.k) : g.k
    return g
  })
}

// ---------- typing suggestions from every sheet (most used first) ----------
const PAPER = /paper sheet|பேப்பர்|^FASTag$|Rest of the fills|RTO & PC total/i
export type SugKey = 'place' | 'goods' | 'dplace' | 'note' | 'pnote' | `c-${CatKey}`

export function suggestions(sheets: Sheet[]): Record<string, string[]> {
  const bag: Record<string, Record<string, { v: string; n: number; t: string }>> = {}
  const add = (key: string, v: unknown, w: string) => {
    const val = String(v || '').trim()
    if (!val || PAPER.test(val)) return
    const b = (bag[key] ||= {})
    const k = val.toLowerCase()
    const e = (b[k] ||= { v: val, n: 0, t: '' })
    e.n++
    if (w >= e.t) { e.t = w; e.v = val }
  }
  sheets.forEach((s) => {
    const w = s.from || s.to || ''
    s.loads.forEach((l) => {
      add('place', l.from, w); add('place', l.to, w); add('goods', l.goods, w)
      ;(l.payments || []).forEach((p) => add('pnote', p.note, w))
    })
    ;(s.lines.diesel || []).forEach((x) => add('dplace', x.desc, w))
    OTHER_CATS.forEach((c) => (s.lines[c.k] || []).forEach((x) => add('c-' + c.k, x.desc, w)))
    ;(s.advances || []).forEach((a) => add('note', a.note, w))
  })
  const out: Record<string, string[]> = {}
  Object.entries(bag).forEach(([k, b]) => {
    out[k] = Object.values(b).sort((x, y) => y.n - x.n || y.t.localeCompare(x.t)).map((e) => e.v)
  })
  return out
}

// ---------- WhatsApp text ----------
export function summaryText(s: Sheet) {
  const r = calc(s)
  const X: string[] = []
  X.push(`*${s.vehicle || 'Vehicle'}*${s.no ? ' · Sheet ' + s.no : ''}${s.paperNo ? ' (paper ' + s.paperNo + ')' : ''}`)
  if (s.driver) X.push(`Driver / டிரைவர்: ${s.driver}${s.driver2 ? ', ' + s.driver2 : ''}`)
  X.push(`${fmtD(s.from)} to ${fmtD(s.to)}${r.km ? ' · ' + nf(r.km) + ' km' : ''}${r.mileage ? ' · ' + r.mileage.toFixed(2) + ' km/L' : ''}`)
  X.push('')
  X.push(`Rent / வரவு: ${inr(r.rent)}`)
  expenseHeads(r).forEach((x) => X.push(`${x[0]} / ${x[1]}: ${inr(x[2])}`))
  X.push(`Total expense / மொத்த செலவு: ${inr(r.expense)}`)
  X.push(`*Balance / மீதி: ${inr(r.balance)}*`)
  if (r.pending) X.push(`Rent still to come / வர வேண்டியது: ${inr(r.pending)}`)
  X.push('')
  X.push('Driver account / டிரைவர் கணக்கு:')
  r.driverItems.forEach((x) => X.push(`${x[0]} / ${x[1]}: ${inr(x[2])}`))
  X.push(`Total / மொத்தம்: ${inr(r.driverSpent)}`)
  X.push(`Advance / அட்வான்ஸ்: ${inr(r.advManual)}`)
  if (r.drvRecv) X.push(`Rent collected by driver / டிரைவர் வசூல்: ${inr(r.drvRecv)}`)
  X.push(r.settle >= 0
    ? `*Pay to driver / டிரைவருக்கு கொடுக்கணும்: ${inr(r.settle)}*`
    : `*Driver returns / டிரைவர் திருப்பி தரணும்: ${inr(-r.settle)}*`)
  return X.join('\n')
}

/** Expense heads in sheet-total order, zero heads dropped. */
export function expenseHeads(r: SheetCalc): DriverItem[] {
  const all: DriverItem[] = [
    ['Diesel', 'டீசல்', r.cat.diesel], ['Commission', 'கமிஷன்', r.comm], ['Driver bata', 'டிரைவர் படி', r.bata],
    ['Cleaner bata', 'கிளீனர் படி', r.cleanerBata], ['Loading', 'ஏற்றுக்கூலி', r.loading], ['Unloading', 'இறக்குக்கூலி', r.unloading],
    ['Other', 'இதர செலவு', r.cat.other], ['RTO', 'ஆர்.டி.ஓ', r.cat.rto], ['PC', 'பி.சி', r.cat.pc],
    ['Extra bata', 'பின்படி', r.cat.extra], ['Toll', 'பாலம்', r.cat.toll], ['Naka / checkpost', 'நாக்கா', r.cat.naka],
    ['Workshop', 'பட்டறை செலவு', r.cat.workshop],
  ]
  return all.filter((x) => x[2])
}
