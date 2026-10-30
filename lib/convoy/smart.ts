// Smart defaults, "needs attention" warnings and the quick-add text reader. Pure functions.
import { blankSheet, calc, nextNo } from './calc'
import { CATS } from './constants'
import { inr, nf, num, T, today } from './format'
import type { CatKey, PaidBy, PayMode, Sheet } from './types'

const dateOf = (s: Sheet) => s.from || s.to || ''
export const daysSince = (iso: string) => Math.floor((Date.parse(today()) - Date.parse(iso)) / 864e5)

/** The truck's sheets, oldest first. */
export function truckSheets(reg: string, sheets: Sheet[]) {
  return sheets
    .filter((x) => reg && x.vehicle === reg)
    .sort((a, b) => dateOf(a).localeCompare(dateOf(b)) || (a.no || '').localeCompare(b.no || '') || (a.created || 0) - (b.created || 0))
}

export function lastSheetOf(reg: string, exceptId: string, sheets: Sheet[]) {
  const l = truckSheets(reg, sheets).filter((x) => x.id !== exceptId)
  return l[l.length - 1]
}

/**
 * Copy driver, cleaner, percentages, payers and start km from the truck's last sheet into
 * the fields of `s` that are still empty or at their default. Returns true if anything changed.
 */
export function fillFromLast(s: Sheet, last: Sheet): boolean {
  let n = 0
  ;(['driver', 'driver2', 'cleaner'] as const).forEach((k) => {
    if (!s[k] && last[k]) { s[k] = last[k]; n++ }
  })
  if (!s.loads.some((l) => num(l.rent))) {
    const isDef = (v: unknown, d: number) => v == null || v === '' || num(v) === d
    if (isDef(s.commPct, 5) && !isDef(last.commPct, 5)) { s.commPct = last.commPct; n++ }
    if (isDef(s.bataPct, 10) && !isDef(last.bataPct, 10)) { s.bataPct = last.bataPct; n++ }
    ;(['commBy', 'loadBy', 'unloadBy'] as const).forEach((k) => {
      if (s[k] === 'driver' && last[k] && last[k] !== 'driver') { s[k] = last[k]; n++ }
    })
  }
  if (!num(s.startKm) && num(last.endKm)) { s.startKm = last.endKm; n++ }
  return n > 0
}

/** Last diesel rate used for this truck, else for any truck; '' if none. */
export function lastDieselRate(reg: string, sheets: Sheet[]): number | '' {
  const rateIn = (list: Sheet[]) => {
    for (let i = list.length - 1; i >= 0; i--) {
      const ds = list[i].lines.diesel || []
      for (let j = ds.length - 1; j >= 0; j--) {
        const d = ds[j]
        if (num(d.rate)) return num(d.rate)
        if (num(d.litres) && num(d.amount)) return Math.round((num(d.amount) / num(d.litres)) * 100) / 100
      }
    }
    return ''
  }
  const all = [...sheets].sort((a, b) => dateOf(a).localeCompare(dateOf(b)) || (a.created || 0) - (b.created || 0))
  return rateIn(truckSheets(reg, sheets)) || rateIn(all)
}

/** A new sheet for the same vehicle, carrying driver, km and settings forward (not yet added to the book). */
export function nextSheetFor(s: Sheet, sheets: Sheet[]): Sheet {
  const c = blankSheet()
  Object.assign(c, {
    no: s.vehicle ? nextNo(s.vehicle, null, sheets) : '', vehicle: s.vehicle, driver: s.driver, driver2: s.driver2, cleaner: s.cleaner,
    commPct: s.commPct, bataPct: s.bataPct ?? 10, startKm: s.endKm || '', commBy: s.commBy, loadBy: s.loadBy, unloadBy: s.unloadBy, from: s.to || '',
  })
  return c
}

/** The same truck's next sheet that isn't settled, if any. */
export function nextOpenSheet(s: Sheet, sheets: Sheet[]) {
  const l = truckSheets(s.vehicle, sheets)
  return l.slice(l.findIndex((x) => x.id === s.id) + 1).find((x) => !x.settled)
}

// ---------- needs attention ----------
export type WarnKind = 'mileage' | 'startKm' | 'endKm' | 'kmGap' | 'rent' | 'dupDiesel' | 'driver'
export interface Warn {
  kind: WarnKind
  lvl: 'red' | 'orange'
  en: string
  ta: string
  detail: string
  sheetId: string
  vehicle: string
  no: string
  /** age in days, used for ordering and the combined driver-account line */
  days: number
  amount: number
}

export function warnings(sheets: Sheet[]): Warn[] {
  const out: Warn[] = []
  const add = (s: Sheet, w: Omit<Warn, 'sheetId' | 'vehicle' | 'no' | 'days' | 'amount'> & { days?: number; amount?: number }) =>
    out.push({ days: 0, amount: 0, ...w, sheetId: s.id, vehicle: s.vehicle, no: s.no })
  const calcs = new Map(sheets.map((s) => [s.id, calc(s)]))

  // per truck: mileage and km continuity
  new Set(sheets.map((s) => s.vehicle).filter(Boolean)).forEach((reg) => {
    const l = truckSheets(reg, sheets)
    const withM = l.filter((s) => calcs.get(s.id)!.mileage > 0)
    if (withM.length >= 2) {
      withM.forEach((s) => {
        const others = withM.filter((x) => x !== s).map((x) => calcs.get(x.id)!.mileage)
        const avg = others.reduce((a, b) => a + b, 0) / others.length
        const m = calcs.get(s.id)!.mileage
        if (m < avg * 0.88) {
          add(s, { kind: 'mileage', lvl: 'red', en: `Low mileage ${m.toFixed(2)} km/L`, ta: 'மைலேஜ் குறைவு',
            detail: T(`This truck usually gives ${avg.toFixed(2)} km/L. Check the diesel entries.`, 'டீசல் பதிவுகளை சரிபார்க்கவும்') })
        }
      })
    }
    for (let i = 1; i < l.length; i++) {
      const prevEnd = num(l[i - 1].endKm)
      const start = num(l[i].startKm)
      if (!prevEnd || !start) continue
      if (start < prevEnd) {
        add(l[i], { kind: 'startKm', lvl: 'red', en: 'Start km wrong', ta: 'ஆரம்ப கி.மீ தவறு',
          detail: T(`Start ${nf(start)} is below the last sheet's end ${nf(prevEnd)}`, 'முந்தைய ஷீட் முடிவு கி.மீ-ஐ விட குறைவு') })
      } else if (start - prevEnd > 100) {
        add(l[i], { kind: 'kmGap', lvl: 'orange', en: 'Km gap', ta: 'கி.மீ இடைவெளி', amount: start - prevEnd,
          detail: T(`${nf(start - prevEnd)} km not on any sheet`, 'எந்த ஷீட்டிலும் இல்லாத கி.மீ') })
      }
    }
  })

  sheets.forEach((s) => {
    const r = calcs.get(s.id)!
    if (num(s.startKm) && num(s.endKm) && num(s.endKm) < num(s.startKm)) {
      add(s, { kind: 'endKm', lvl: 'red', en: 'End km wrong', ta: 'முடிவு கி.மீ தவறு',
        detail: T(`End ${nf(num(s.endKm))} is less than start ${nf(num(s.startKm))}`, 'முடிவு கி.மீ ஆரம்பத்தை விட குறைவு') })
    }

    // rent unpaid 15+ days
    let oldest = -1
    s.loads.forEach((l) => {
      const due = num(l.rent) - (l.payments || []).reduce((a, p) => a + num(p.amount), 0)
      const d = l.date || dateOf(s)
      if (due > 0 && d) oldest = Math.max(oldest, daysSince(d))
    })
    if (r.pending > 0 && oldest >= 15) {
      add(s, { kind: 'rent', lvl: oldest >= 30 ? 'red' : 'orange', en: `Rent pending ${inr(r.pending)}`, ta: 'வாடகை வர வேண்டியது',
        days: oldest, amount: r.pending, detail: T(`Oldest due ${oldest} days`, `${oldest} நாள் ஆகிறது`) })
    }

    const seen = new Set<string>()
    for (const d of s.lines.diesel || []) {
      if (!num(d.amount) || !d.date) continue
      const k = d.date + '|' + num(d.amount)
      if (seen.has(k)) {
        add(s, { kind: 'dupDiesel', lvl: 'orange', en: 'Same diesel entered twice?', ta: 'ஒரே டீசல் இரண்டு முறை?',
          detail: T(`${d.date.split('-').reverse().join('/')} · ${inr(num(d.amount))}`, 'தேதி, தொகை ஒன்றே') })
        break
      }
      seen.add(k)
    }

    if (!s.settled && s.to && r.settle !== 0) {
      const age = daysSince(s.to)
      if (age >= 30) {
        add(s, { kind: 'driver', lvl: 'orange', en: 'Driver account open', ta: 'டிரைவர் கணக்கு முடியவில்லை', days: age, amount: r.settle,
          detail: r.settle > 0 ? T(`Pay driver ${inr(r.settle)} · ${age} days`, 'டிரைவருக்கு கொடுக்கணும்') : T(`Driver returns ${inr(-r.settle)} · ${age} days`, 'டிரைவர் திருப்பி தரணும்') })
      }
    }
  })

  return out.sort((a, b) => (a.lvl === b.lvl ? b.days - a.days : a.lvl === 'red' ? -1 : 1))
}

// ---------- quick add: the built-in text reader ----------
export type QType = CatKey | 'advance' | 'rent'
export interface QFill {
  type?: QType
  date?: string
  amount?: number
  litres?: number
  rate?: number
  place?: string
  by?: PaidBy
  advMode?: string
  payMode?: PayMode
}

const KW: [QType, string[]][] = [
  ['diesel', ['diesel', 'fuel', 'hsd', 'டீசல்']],
  ['toll', ['toll', 'fastag', 'bridge', 'பாலம்', 'டோல்']],
  ['advance', ['advance', 'adv', 'அட்வான்ஸ்']],
  ['rent', ['rent', 'வாடகை', 'வசூல்']],
  ['rto', ['rto', 'ஆர்.டி.ஓ', 'ஆர்டிஓ']],
  ['pc', ['pc', 'police', 'போலீஸ்', 'பி.சி']],
  ['naka', ['naka', 'checkpost', 'நாக்கா', 'செக்போஸ்ட்']],
  ['extra', ['பின்படி']],
  ['workshop', ['workshop', 'puncture', 'tyre', 'tire', 'repair', 'mechanic', 'பட்டறை', 'பஞ்சர்']],
  ['other', ['other', 'இதர']],
]
const DRIVER = ['driver', 'cash', 'டிரைவர்', 'கேஷ்', 'ரொக்கம்']
const OFFICE = ['office', 'card', 'fastag', 'ஆபிஸ்', 'கார்டு']
const UNIT = /^(l|ltr|ltrs|lit|litre|litres|liter|liters|லிட்டர்|லி)$/
const FILLER = new Set(['rs', 'rs.', '₹', 'inr', 'paid', 'by', 'at', 'in', 'to', 'for', 'the', 'and', 'bata', 'extra', 'check', 'post', 'today', 'yesterday', 'இன்று', 'நேற்று', 'gpay', 'ஜிபே', 'bank', 'neft', 'imps', 'transfer', 'cheque', 'chq', 'செக்', 'account', 'received'])

const has = (tok: string, kw: string) => tok === kw || (/[^\x00-\x7f]/.test(kw) && tok.startsWith(kw))

/** Read "diesel 150 L 94.5 Avinashi cash" style text into quick-add fields. */
export function readQuick(text: string): QFill {
  const f: QFill = {}
  let t = ' ' + text.toLowerCase().replace(/₹/g, ' ').replace(/(\d),(?=\d)/g, '$1') + ' '
  if (/\bextra\s+bata\b/.test(t)) { f.type = 'extra'; t = t.replace(/\bextra\s+bata\b/, ' ') }
  if (/\bcheck\s*post\b/.test(t)) { f.type = 'naka'; t = t.replace(/\bcheck\s*post\b/, ' ') }
  t = t.replace(/(\d)([a-z஀-௿])/g, '$1 $2')
  const toks = t.split(/\s+/).filter(Boolean)
  const used = new Set<number>()

  if (!f.type) {
    for (const [type, kws] of KW) {
      const i = toks.findIndex((x) => kws.some((k) => has(x, k)))
      if (i >= 0) { f.type = type; used.add(i); break }
    }
  }
  toks.forEach((x, i) => {
    if (KW.some(([, kws]) => kws.some((k) => has(x, k)))) used.add(i)
    if (DRIVER.some((k) => has(x, k))) { f.by = 'driver'; used.add(i) }
    else if (OFFICE.some((k) => has(x, k))) { f.by ||= 'office'; used.add(i) }
    if (x === 'today' || x === 'இன்று') f.date = today()
    if (x === 'yesterday' || x === 'நேற்று') f.date = new Date(Date.parse(today()) - 864e5).toISOString().slice(0, 10)
  })
  // FASTag is paid by the office even if "cash" isn't said
  if (toks.some((x) => x === 'fastag') && !toks.some((x) => DRIVER.some((k) => has(x, k)))) f.by = 'office'

  if (toks.some((x) => x === 'gpay' || has(x, 'ஜிபே'))) { f.advMode = 'GPay'; f.payMode = 'gpay' }
  else if (toks.some((x) => /^(bank|neft|imps|transfer|account)$/.test(x))) { f.advMode = 'Bank transfer'; f.payMode = 'account' }
  else if (toks.some((x) => /^(cheque|chq)$/.test(x) || has(x, 'செக்'))) f.payMode = 'cheque'
  else if (toks.some((x) => x === 'card')) f.advMode = 'Diesel card'
  if (toks.some((x) => DRIVER.some((k) => has(x, k)))) { f.advMode ||= 'Cash'; f.payMode ||= 'driver' }

  // dd/mm or dd/mm/yy dates
  toks.forEach((x, i) => {
    const m = x.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$/)
    if (!m) return
    const y = m[3] ? (m[3].length === 2 ? '20' + m[3] : m[3]) : today().slice(0, 4)
    f.date = `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
    used.add(i)
  })

  const nums: { i: number; v: number }[] = []
  toks.forEach((x, i) => { if (!used.has(i) && /^\d+(\.\d+)?$/.test(x)) nums.push({ i, v: parseFloat(x) }) })
  const take = (n: { i: number }) => { used.add(n.i); nums.splice(nums.indexOf(n as { i: number; v: number }), 1) }
  const lit = nums.find((n) => UNIT.test(toks[n.i + 1] || ''))
  if (lit) { f.litres = lit.v; used.add(lit.i + 1); take(lit) }
  if (f.type === 'diesel' || (!f.type && f.litres)) {
    f.type = 'diesel'
    const rate = nums.find((n) => n.v >= 60 && n.v <= 130)
    if (rate) { f.rate = rate.v; take(rate) }
  }
  if (nums.length) {
    const big = nums.reduce((a, b) => (b.v > a.v ? b : a))
    f.amount = big.v
    take(big)
  }
  if (!f.amount && f.litres && f.rate) f.amount = Math.round(f.litres * f.rate)
  toks.forEach((x, i) => { if (UNIT.test(x)) used.add(i) })

  const place = toks
    .filter((x, i) => !used.has(i) && !FILLER.has(x) && !/^\d/.test(x))
    .map((x) => x.replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu, ''))
    .filter(Boolean)
    .map((x) => (/^[a-z]/.test(x) ? x[0].toUpperCase() + x.slice(1) : x))
    .join(' ')
  if (place) f.place = place
  return f
}

export const catOf = (k: CatKey) => CATS.find((c) => c.k === k)!
