'use client'

import { useRouter } from 'next/navigation'
import { calc } from '@/lib/convoy/calc'
import { fmtD, inr, nf, num } from '@/lib/convoy/format'
import { useBook } from '@/components/convoy/BookProvider'
import { useNewSheet } from '@/components/convoy/useNewSheet'
import { B, Head, MonthSelect, SettledPill, SettleText, useMonth } from '@/components/convoy/ui'

export default function OverviewPage() {
  const { book } = useBook()
  const { inMonth, monthName } = useMonth()
  const router = useRouter()
  const newSheet = useNewSheet()

  const R = book.sheets.filter(inMonth).map((s) => ({ s, r: calc(s) }))
  const t = { rent: 0, exp: 0, bal: 0, l: 0, km: 0, lk: 0, comm: 0, lu: 0, bata: 0, pending: 0, loads: 0, cat: {} as Record<string, number> }
  R.forEach(({ s, r }) => {
    t.rent += r.rent; t.exp += r.expense; t.bal += r.balance; t.l += r.litres
    if (r.litres && r.km) t.km += r.km
    if (r.km) t.lk += r.litres
    Object.entries(r.cat).forEach(([k, v]) => { t.cat[k] = (t.cat[k] || 0) + v })
    t.comm += r.comm; t.lu += r.loading + r.unloading; t.bata += r.bata + r.cleanerBata; t.pending += r.pending
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
  const rows = R.sort((a, b) => (b.s.from || '').localeCompare(a.s.from || ''))

  return (
    <>
      <Head title={<B en="Overview" ta="மொத்த கணக்கு" />} sub={<>{R.length} <B en="trip sheets" ta="ஷீட்கள்" /> · {monthName}</>}>
        <div className="actions"><MonthSelect id="m1" /></div>
        <button type="button" className="btn" onClick={newSheet}><B en="New trip sheet" ta="புதிய ஷீட்" /></button>
      </Head>
      <section className="kpis">
        <div className="kpi">
          <span className="lbl"><B en="Total rent" ta="மொத்த வரவு" /></span><span className="val">{inr(t.rent)}</span>
          <span className="note">{t.loads} <B en="loads" ta="லோடுகள்" /> · {t.pending
            ? <span className="warn"><B en="Pending" ta="வர வேண்டியது" /> {inr(t.pending)}</span>
            : <span className="ok"><B en="All received" ta="முழுதும் வந்தது" /></span>}</span>
        </div>
        <div className="kpi">
          <span className="lbl"><B en="Total expense" ta="மொத்த செலவு" /></span><span className="val">{inr(t.exp)}</span>
          <span className="note">{t.rent ? Math.round((t.exp / t.rent) * 100) : 0}% <B en="of rent" ta="வரவில்" /></span>
        </div>
        <div className="kpi">
          <span className="lbl"><B en="Balance" ta="மீதி" /></span><span className={`val ${t.bal < 0 ? 'bad' : ''}`}>{inr(t.bal)}</span>
          <span className="note">{t.rent ? Math.round((t.bal / t.rent) * 100) : 0}% <B en="margin" ta="லாபம்" /></span>
        </div>
        <div className="kpi">
          <span className="lbl"><B en="Diesel" ta="டீசல்" /></span><span className="val">{nf(t.l)} L</span>
          <span className="note">{t.lk ? <>{(t.km / t.lk).toFixed(2)} km/L <B en="average" ta="சராசரி மைலேஜ்" /></> : <B en="Add km to see mileage" ta="மைலேஜுக்கு கி.மீ சேர்க்கவும்" />}</span>
        </div>
      </section>
      <section className="grid2">
        <div className="panel">
          <h2><B en="Trip sheets" ta="டிரிப் ஷீட்" /> <span className="meta"><B en="tap a row to open" ta="திறக்க தட்டவும்" /></span></h2>
          <div className="tblwrap">
            {rows.length ? (
              <table>
                <thead><tr>
                  <th>No.<span className="ta">எண்</span></th><th>Vehicle<span className="ta">வண்டி</span></th><th className="num">Dates<span className="ta">தேதி</span></th>
                  <th className="num">Rent<span className="ta">வரவு</span></th><th className="num">Expense<span className="ta">செலவு</span></th>
                  <th className="num">Balance<span className="ta">மீதி</span></th><th>Driver account<span className="ta">டிரைவர் கணக்கு</span></th>
                </tr></thead>
                <tbody>
                  {rows.map(({ s, r }) => (
                    <tr key={s.id} className="click" onClick={() => router.push(`/dashboard/sheets/${s.id}`)}>
                      <td>{s.no || <span className="mute">—</span>}</td>
                      <td><span className="reg">{s.vehicle || '—'}</span></td>
                      <td className="num">{fmtD(s.from)} – {fmtD(s.to)}</td>
                      <td className="num">{inr(r.rent)}</td>
                      <td className="num">{inr(r.expense)}</td>
                      <td className={`num ${r.balance < 0 ? 'bad' : ''}`} style={{ fontWeight: 600 }}>{inr(r.balance)}</td>
                      <td>{s.settled ? <SettledPill /> : <SettleText v={r.settle} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="empty"><B en="No trip sheets for this month." ta="இந்த மாதம் ஷீட் இல்லை." /></div>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <div className="panel">
            <h2><B en="Where the money went" ta="செலவு விவரம்" /></h2>
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
        </div>
      </section>
    </>
  )
}
