'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { calc } from '@/lib/convoy/calc'
import { fmtD, inr, nf, num } from '@/lib/convoy/format'
import { warnings, type Warn } from '@/lib/convoy/smart'
import { useBook } from '@/components/convoy/BookProvider'
import { useNewSheet } from '@/components/convoy/useNewSheet'
import { B, Head, MonthSelect, SecHead, SettledPill, SettleText, useMonth } from '@/components/convoy/ui'

export default function OverviewPage() {
  const { book, setVehicleF } = useBook()
  const { inMonth, monthName } = useMonth()
  const router = useRouter()
  const newSheet = useNewSheet()
  const [allWarn, setAllWarn] = useState(false)

  const R = book.sheets.filter(inMonth).map((s) => ({ s, r: calc(s) }))
  const t = { rent: 0, exp: 0, bal: 0, l: 0, km: 0, lk: 0, comm: 0, lu: 0, bata: 0, pending: 0, waiting: 0, loads: 0, cat: {} as Record<string, number> }
  R.forEach(({ s, r }) => {
    t.rent += r.rent; t.exp += r.expense; t.bal += r.balance; t.l += r.litres
    if (r.litres && r.km) t.km += r.km
    if (r.km) t.lk += r.litres
    Object.entries(r.cat).forEach(([k, v]) => { t.cat[k] = (t.cat[k] || 0) + v })
    t.comm += r.comm; t.lu += r.loading + r.unloading; t.bata += r.bata + r.cleanerBata; t.pending += r.pending
    if (r.pending) t.waiting++
    t.loads += s.loads.filter((l) => num(l.rent)).length
  })
  const heads = ([
    ['Diesel', 'டீசல்', t.cat.diesel || 0], ['Toll', 'பாலம்', t.cat.toll || 0],
    ['Driver bata + commission', 'டிரைவர் படி + கமிஷன்', t.bata + t.comm],
    ['RTO & PC', 'ஆர்.டி.ஓ / பி.சி', (t.cat.rto || 0) + (t.cat.pc || 0)],
    ['Other expenses', 'இதர செலவு', (t.cat.other || 0) + (t.cat.extra || 0) + (t.cat.naka || 0)],
    ['Loading & unloading', 'ஏற்று / இறக்கு கூலி', t.lu], ['Workshop', 'பட்டறை', t.cat.workshop || 0],
  ] as [string, string, number][]).filter((h) => h[2] > 0).sort((a, b) => b[2] - a[2])
  const mx = Math.max(1, ...heads.map((h) => h[2]))

  // one row per truck, best balance first
  const trucks = Object.values(R.reduce((m, { s, r }) => {
    const k = s.vehicle || '—'
    const g = (m[k] ||= { reg: k, n: 0, bal: 0, km: 0, l: 0, due: 0, pay: 0 })
    g.n++; g.bal += r.balance; g.due += r.pending
    if (r.km && r.litres) { g.km += r.km; g.l += r.litres }
    if (!s.settled && r.settle > 0) g.pay += r.settle
    return m
  }, {} as Record<string, { reg: string; n: number; bal: number; km: number; l: number; due: number; pay: number }>)).sort((a, b) => b.bal - a.bal)
  const fleetKmL = t.lk ? t.km / t.lk : 0
  const openTruck = (reg: string) => { setVehicleF(reg === '—' ? '' : reg); router.push('/dashboard/sheets') }

  // needs attention: three or more open driver accounts collapse into one line
  const ws = warnings(book.sheets)
  const drv = ws.filter((w) => w.kind === 'driver')
  type Line = { w?: Warn; combined?: true }
  const lines: Line[] = drv.length >= 3
    ? [...ws.filter((w) => w.kind !== 'driver').map((w) => ({ w })), { combined: true as const }]
    : ws.map((w) => ({ w }))
  const shown = allWarn ? lines : lines.slice(0, 5)
  const payTotal = drv.reduce((a, w) => a + Math.max(0, w.amount), 0)

  const latest = [...R].sort((a, b) => (b.s.from || '').localeCompare(a.s.from || '') || (b.s.created || 0) - (a.s.created || 0)).slice(0, 5)

  return (
    <>
      <Head title={<B en="Overview" ta="மொத்த கணக்கு" />} sub={<>{R.length} <B en="trip sheets" ta="ஷீட்கள்" /> · {monthName}</>}>
        <div className="actions"><MonthSelect id="m1" /></div>
        <button type="button" className="btn" onClick={newSheet}><B en="New trip sheet" ta="புதிய ஷீட்" /></button>
      </Head>
      <section className="kpis">
        <div className="kpi">
          <span className="lbl"><B en="Total rent" ta="மொத்த வரவு" /></span><span className="val c-green">{inr(t.rent)}</span>
          <span className="note">{t.loads} <B en="loads" ta="லோடுகள்" /></span>
        </div>
        <div className="kpi">
          <span className="lbl"><B en="Total expense" ta="மொத்த செலவு" /></span><span className="val c-red">{inr(t.exp)}</span>
          <span className="note">{t.rent ? Math.round((t.exp / t.rent) * 100) : 0}% <B en="of rent" ta="வரவில்" /></span>
        </div>
        <div className="kpi">
          <span className="lbl"><B en="Balance" ta="மீதி" /></span><span className={`val ${t.bal < 0 ? 'bad' : 'c-blue'}`}>{inr(t.bal)}</span>
          <span className="note">{t.rent ? Math.round((t.bal / t.rent) * 100) : 0}% <B en="margin" ta="லாபம்" /></span>
        </div>
        <div className="kpi">
          <span className="lbl"><B en="Rent pending" ta="வர வேண்டியது" /></span>
          {t.pending ? <span className="val c-orange">{inr(t.pending)}</span> : <span className="val ok">✓ <B en="All received" ta="முழுதும் வந்தது" /></span>}
          <span className="note">{t.waiting ? <>{t.waiting} <B en="sheets waiting" ta="ஷீட் காத்திருக்கிறது" /> · </> : null}{nf(t.l)} L <B en="diesel" ta="டீசல்" /></span>
        </div>
      </section>

      {lines.length > 0 && (
        <section className="panel s-orange">
          <SecHead icon="warn" en="Needs attention" ta="கவனிக்க வேண்டியவை" meta={lines.length} />
          <ul className="warns click">
            {shown.map((x, i) => x.combined ? (
              <li key="drv" className="orange" onClick={() => router.push('/dashboard/sheets')}>
                <b><B en={`${drv.length} driver accounts not settled`} ta="டிரைவர் கணக்குகள் முடியவில்லை" /></b>
                <span className="note"><B en={`oldest ${Math.max(...drv.map((w) => w.days))} days · pay drivers ${inr(payTotal)} in total`} ta="பழைய கணக்கு · மொத்தம் கொடுக்க வேண்டியது" /></span>
              </li>
            ) : (
              <li key={i} className={x.w!.lvl} onClick={() => router.push(`/dashboard/sheets/${x.w!.sheetId}`)}>
                <b><B en={x.w!.en} ta={x.w!.ta} /></b>
                <span className="note"><span className="reg">{x.w!.vehicle || '—'}</span> {x.w!.no} · {x.w!.detail}</span>
              </li>
            ))}
          </ul>
          {lines.length > 5 && (
            <div className="secfoot"><button type="button" className="link" onClick={() => setAllWarn(!allWarn)}>{allWarn ? <B en="Show fewer" ta="குறைவாக" /> : <B en={`Show all ${lines.length}`} ta="அனைத்தும் காட்டு" />}</button></div>
          )}
        </section>
      )}

      <section className="grid2">
        <div className="panel s-green">
          <SecHead icon="truck" en="Trucks" ta="வண்டிகள்" meta={fleetKmL ? <>{fleetKmL.toFixed(2)} km/L <B en="fleet average" ta="சராசரி" /></> : ''} />
          {trucks.length ? (
            <div className="trucks">
              <div className="trow th"><span><B en="Vehicle" ta="வண்டி" /></span><span className="num"><B en="Balance" ta="மீதி" /></span><span className="num">km/L</span><span className="num"><B en="Rent due" ta="வர வேண்டியது" /></span><span className="num"><B en="Pay driver" ta="டிரைவருக்கு" /></span></div>
              {trucks.map((g) => (
                <button type="button" className="trow" key={g.reg} onClick={() => openTruck(g.reg)}>
                  <span><span className="reg">{g.reg}</span> <span className="note">{g.n} <B en={g.n === 1 ? 'trip' : 'trips'} ta="டிரிப்" /></span></span>
                  <span className={`num big ${g.bal < 0 ? 'bad' : ''}`}>{inr(g.bal)}</span>
                  <span className="num sm"><i>km/L </i>{g.l ? (g.km / g.l).toFixed(2) : '—'}</span>
                  <span className="num sm"><i><B en="Due" ta="பாக்கி" /> </i>{g.due ? <span className="warn">{inr(g.due)}</span> : <span className="ok">✓</span>}</span>
                  <span className="num sm"><i><B en="Pay driver" ta="டிரைவருக்கு" /> </i>{g.pay ? inr(g.pay) : '—'}</span>
                </button>
              ))}
            </div>
          ) : <div className="empty"><B en="No trip sheets for this month." ta="இந்த மாதம் ஷீட் இல்லை." /></div>}
        </div>
        <div className="panel s-blue">
          <SecHead icon="list" en="Latest trip sheets" ta="சமீபத்திய ஷீட்கள்" />
          <div className="mini">
            {latest.length ? latest.map(({ s, r }) => (
              <button type="button" className="minicard" key={s.id} onClick={() => router.push(`/dashboard/sheets/${s.id}`)}>
                <span className="mc-t"><span className="reg">{s.vehicle || '—'}</span><span className="note">{s.no}</span><b className={`num ${r.balance < 0 ? 'bad' : ''}`}>{inr(r.balance)}</b></span>
                <span className="mc-b"><span className="note">{fmtD(s.from)} – {fmtD(s.to)} · {s.driver || '—'}</span>{s.settled ? <SettledPill /> : <SettleText v={r.settle} />}</span>
              </button>
            )) : <div className="empty"><B en="No trip sheets for this month." ta="இந்த மாதம் ஷீட் இல்லை." /></div>}
          </div>
          <div className="secfoot"><button type="button" className="link" onClick={() => { setVehicleF(''); router.push('/dashboard/sheets') }}><B en="See all →" ta="எல்லாம் பார்" /></button></div>
        </div>
      </section>

      <div className="panel s-red">
        <SecHead icon="receipt" en="Where the money went" ta="செலவு விவரம்" />
        <div className="bars">
          {heads.length ? heads.map((h) => (
            <div className="barrow" key={h[0]}>
              <span>{h[0]}<br /><span className="ta">{h[1]}</span></span>
              <div className="track"><span style={{ width: `${(h[2] / mx) * 100}%` }} /></div>
              <span className="num">{inr(h[2])}</span>
            </div>
          )) : <div className="note"><B en="No expenses yet." ta="செலவு இல்லை." /></div>}
        </div>
      </div>
    </>
  )
}
