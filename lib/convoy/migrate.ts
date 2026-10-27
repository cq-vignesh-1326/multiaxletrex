// Brings any book — a backup copied from the old Convoy artifact (v1 or v2) or the
// sample paper sheets — into the current shape before it is uploaded.
import { CATS } from './constants'
import { blankSheet, emptyLines, nextNo } from './calc'
import { num, uid } from './format'
import type { Book, LedgerEntry, Line, Payment, Sheet } from './types'

type Loose = Record<string, any>

/** Fill every field a sheet needs, keeping what is already there. */
export function fullSheet(o: Loose): Sheet {
  const s = Object.assign(blankSheet(), o) as Sheet & Loose
  s.id = o.id || uid()
  s.lines = emptyLines()
  CATS.forEach((c) => { s.lines[c.k] = ((o.lines && o.lines[c.k]) || []) as Line[] })
  s.loads = (o.loads || []).map((l: Loose) => ({ payments: [], ...l }))
  s.advances = o.advances || []
  s.settled = !!o.settled
  return s
}

// v0 kept rent the driver collected as an advance; v1 kept two amounts on each load;
// v2 keeps a list of payments (date, how, amount, remarks) per load.
function normSheet(s: Loose, assumeReceived: boolean) {
  if (s.rentV === 2) return
  if (s.rentV !== 1) {
    s.loads = (s.loads || []).map((l: Loose) => Object.assign({ accRecv: '', drvRecv: '' }, l))
    const moved = (s.advances || []).filter((a: Loose) => a.mode === 'Rent collected by driver')
    if (moved.length) {
      let left = moved.reduce((a: number, x: Loose) => a + num(x.amount), 0)
      s.loads.forEach((l: Loose) => {
        if (left <= 0) return
        const take = Math.min(num(l.rent) - num(l.drvRecv), left)
        if (take > 0) { l.drvRecv = num(l.drvRecv) + take; left -= take }
      })
      if (left > 0 && s.loads.length) {
        const l = s.loads[s.loads.length - 1]
        l.drvRecv = num(l.drvRecv) + left
      }
      s.advances = s.advances.filter((a: Loose) => a.mode !== 'Rent collected by driver')
    }
    if (assumeReceived) {
      s.loads.forEach((l: Loose) => {
        if (l.accRecv === '' && num(l.rent)) l.accRecv = Math.max(0, num(l.rent) - num(l.drvRecv))
      })
    }
  }
  ;(s.loads || []).forEach((l: Loose) => {
    if (!Array.isArray(l.payments)) {
      const p: Payment[] = []
      if (num(l.accRecv)) p.push({ date: '', mode: 'account', amount: num(l.accRecv), note: '' })
      if (num(l.drvRecv)) p.push({ date: '', mode: 'driver', amount: num(l.drvRecv), note: '' })
      l.payments = p
    }
    delete l.accRecv
    delete l.drvRecv
  })
  s.rentV = 2
}

export function migrate(d: Loose, assumeReceived = false): Book {
  const raw: Loose[] = Array.isArray(d.sheets) ? d.sheets : []
  raw.forEach((x) => normSheet(x, assumeReceived))
  const sheets = raw.map((x) => {
    const s = fullSheet(x) as Sheet & Loose
    delete s.rentV
    return s
  })
  const ledger: LedgerEntry[] = (Array.isArray(d.ledger) ? d.ledger : []).map((e: Loose) => ({ ...e, id: e.id || uid() }) as LedgerEntry)

  let people = Array.isArray(d.people) ? d.people : null
  if (!people) {
    people = []
    const seen = new Set<string>()
    sheets.forEach((s) => ([[s.driver, 'driver'], [s.driver2, 'driver'], [s.cleaner, 'cleaner']] as const).forEach(([n, r]) => {
      if (n && !seen.has(n)) { seen.add(n); people!.push({ id: uid(), name: n, role: r, phone: '' }) }
    }))
    ledger.forEach((e: Loose) => {
      if (e.driver && !seen.has(e.driver)) { seen.add(e.driver); people!.push({ id: uid(), name: e.driver, role: 'driver', phone: '' }) }
    })
  }
  let vehicles = Array.isArray(d.vehicles) ? d.vehicles : null
  if (!vehicles) {
    vehicles = []
    const seen = new Set<string>()
    sheets.forEach((s) => {
      if (s.vehicle && !seen.has(s.vehicle)) { seen.add(s.vehicle); vehicles!.push({ id: uid(), reg: s.vehicle, model: '' }) }
    })
  }
  if (!d.numbered) {
    const done: Sheet[] = []
    sheets.slice().sort((a, b) => (a.from || '').localeCompare(b.from || '')).forEach((x) => {
      if (x.paperNo === undefined) x.paperNo = x.no || ''
      x.no = x.vehicle ? nextNo(x.vehicle, x.id, done) : ''
      done.push(x)
    })
  }
  return {
    sheets,
    ledger,
    people: people.map((p: Loose) => ({ id: p.id || uid(), name: p.name, role: p.role === 'cleaner' ? 'cleaner' : 'driver', phone: p.phone || '' })),
    vehicles: vehicles.map((v: Loose) => ({ id: v.id || uid(), reg: v.reg, model: v.model || '' })),
  }
}

// ---------- the five paper sheets the office started with ----------
const L = (amount: number, desc: string, by: 'driver' | 'office', extra?: Partial<Line>): Line =>
  ({ date: '', desc, amount, by, ...extra })
const P = 'Total from paper sheet / பேப்பர் ஷீட் மொத்தம்'
const ld = (date: string, ton: number, rent: number, loading: number | string, unloading: number | string, extra: Loose = {}) =>
  ({ date, from: '', to: '', goods: '', ton, rent, comm: '', loading, unloading, ...extra })
const adv = (date: string, mode: string, amount: number) => ({ date, mode, amount, note: '' })

export function sampleBook(): Book {
  const sheets: Loose[] = [
    { vehicle: 'TN 64 BB 9854', driver: 'Driver of TN64BB9854', from: '2026-03-06', to: '2026-03-20', startKm: 140238, endKm: 145387,
      loads: [ld('2026-03-06', 35, 134000, 3500, 2800), ld('2026-03-14', 35.45, 147000, 3300, 3500), ld('2026-03-18', 35, 38500, 2100, 2100)],
      lines: { diesel: [L(23134, '', 'office', { date: '2026-03-09', litres: 254 }), L(18178, '', 'office', { date: '2026-03-10', litres: 200 }), L(20835, '', 'office', { date: '2026-03-10', litres: 236 }), L(15000, '', 'driver', { date: '2026-03-15', litres: 165 }), L(28300, '', 'driver', { date: '2026-03-16', litres: 311 }), L(16500, '', 'driver', { date: '2026-03-16', litres: 181 })],
        other: [L(7120, P, 'driver')], rto: [L(9200, P, 'driver')], pc: [L(500, P, 'driver')], toll: [L(39620, 'FASTag', 'office')] },
      driverExtra: 3850,
      advances: [adv('2026-03-08', 'GPay', 30000), adv('2026-03-21', 'GPay', 5000), adv('', 'Rent collected by driver', 64000), adv('', 'Cash', 2100), adv('', 'Cash', 3000), adv('', 'Cash', 3500), adv('', 'Cash', 350)] },
    { no: '32', vehicle: 'TN 54 AB 9745', driver: 'Driver of TN54AB9745', from: '2026-03-11', to: '2026-03-21', startKm: 142046, endKm: 147730,
      loads: [ld('2026-03-11', 35, 170000, 3500, 2500), ld('2026-03-16', 35.8, 168000, 1300, 1500, { to: 'Avinashi' })],
      lines: { diesel: [L(9330, '', 'office', { date: '2026-03-11', litres: 100, rate: 93.3 }), L(25048, '', 'office', { date: '2026-03-12', litres: 275, rate: 91.08 }), L(18186, '', 'office', { date: '2026-03-13', litres: 200, rate: 90.93 }), L(18982, '', 'office', { date: '2026-03-14', litres: 215, rate: 88.33 }), L(6888, '', 'office', { date: '2026-03-17', litres: 75, rate: 91.84 }), L(24561, '', 'office', { date: '2026-03-17', litres: 278, rate: 88.33 }), L(14821, '', 'office', { date: '2026-03-18', litres: 163, rate: 90.93 }), L(26850, '', 'office', { date: '2026-03-19', litres: 295, rate: 91.01 })],
        other: [L(5215, P, 'driver')], rto: [L(13300, P, 'driver')], pc: [L(700, P, 'driver')], toll: [L(45093, 'FASTag', 'office')] },
      driverExtra: 3850,
      advances: [adv('', 'GPay', 30000), adv('', 'GPay', 10000), adv('', 'GPay', 10000), adv('', 'Cash', 2000)] },
    { no: '30', vehicle: 'TN 54 AB 9894', driver: 'Driver of TN54AB9894', from: '2026-05-14', to: '2026-05-27', totalKm: 5561,
      loads: [ld('2026-05-13', 35, 160000, 3300, '', { comm: 8000 }), ld('', 35.2, 165640, 1150, 3500, { comm: 8272 })],
      loadBy: 'office', unloadBy: 'office',
      lines: { diesel: [L(157826, P, 'office', { litres: 1693 })], other: [L(11482, P, 'driver')], rto: [L(11900, P, 'driver')], pc: [L(600, P, 'driver')], extra: [L(800, P, 'office')], toll: [L(49229, 'FASTag', 'office')] },
      advances: [adv('2026-05-14', 'GPay', 30000), adv('2026-05-19', 'GPay', 7000), adv('2026-05-25', 'GPay', 3000), adv('', 'Cash', 3000), adv('', 'Cash', 3200)] },
    { vehicle: 'TN 30 BB 0011', driver: 'Driver of TN30BB0011', from: '2026-05-09', to: '2026-05-21',
      loads: [ld('2026-05-09', 22, 176000, 2000, 5000), ld('2026-05-18', 21, 149000, 3150, 3430)],
      lines: { diesel: [L(121434, P, 'office', { litres: 1348 })], other: [L(15386, P, 'driver')], rto: [L(12300, P, 'driver')], pc: [L(200, P, 'driver')], toll: [L(58958, 'FASTag', 'office')] },
      advances: [adv('2026-05-09', 'GPay', 25000), adv('2026-05-14', 'GPay', 5000), adv('2026-05-17', 'GPay', 5000), adv('2026-05-18', 'GPay', 15000), adv('2026-05-28', 'GPay', 5000), adv('', 'Rent collected by driver', 49000)] },
    { vehicle: 'TN 64 AD 3466', driver: 'Driver of TN64AD3466', from: '2026-05-02', to: '2026-05-24', startKm: 37544, endKm: 45120,
      loads: [ld('2026-05-05', 25, 206300, 2200, 5000), ld('2026-05-14', 35, 200000, 1500, '')],
      lines: { diesel: [L(159722, 'Rest of the fills / மீதி', 'office', { litres: 1830 }), L(4589, '', 'driver', { date: '2026-05-06', litres: 50 })], other: [L(16826, P, 'driver')], rto: [L(11100, 'RTO & PC total / மொத்தம்', 'driver')], toll: [L(65114, 'FASTag', 'office')] },
      advances: [adv('2026-05-02', 'GPay', 10000), adv('2026-05-05', 'GPay', 20000), adv('', 'GPay', 20000), adv('', 'Cash', 5500), adv('', 'Cash', 11900), adv('', 'Cash', 4000)] },
  ]
  const ledger = [{ id: uid(), date: '2026-05-28', driver: 'Driver of TN30BB0011', type: 'salary', amount: 25000, note: 'Salary due (paper sheet)' }]
  return migrate({ sheets, ledger }, true)
}
