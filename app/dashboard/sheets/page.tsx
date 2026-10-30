'use client'

import { useRouter } from 'next/navigation'
import { calc } from '@/lib/convoy/calc'
import { fmtD, inr, nf, T } from '@/lib/convoy/format'
import { useBook } from '@/components/convoy/BookProvider'
import { useNewSheet } from '@/components/convoy/useNewSheet'
import { B, ConfirmButton, Head, MonthSelect, SettledPill, SettleText, useMonth } from '@/components/convoy/ui'

export default function SheetsPage() {
  const { book, mutate, toast, vehicleF, setVehicleF } = useBook()
  const { inMonth } = useMonth()
  const router = useRouter()
  const newSheet = useNewSheet()
  const regs = [...new Set(book.sheets.map((s) => s.vehicle).filter(Boolean))].sort()
  const list = book.sheets.filter((s) => inMonth(s) && (!vehicleF || s.vehicle === vehicleF)).sort((a, b) => (b.from || '').localeCompare(a.from || ''))

  return (
    <>
      <Head title={<B en="Trip sheets" ta="டிரிப் ஷீட்" />} sub={<B en="One sheet per vehicle round, same as your paper book" ta="ஒவ்வொரு டிரிப்புக்கும் ஒரு ஷீட்" />}>
        <div className="actions">
          <MonthSelect id="m2" />
          <label className="note" htmlFor="v2"><B en="Vehicle" ta="வண்டி" /></label>
          <select id="v2" value={vehicleF} onChange={(e) => setVehicleF(e.target.value)}>
            <option value="">{T('All vehicles', 'எல்லா வண்டியும்')}</option>
            {regs.map((v) => <option key={v} value={v}>{v}</option>)}
            {vehicleF && !regs.includes(vehicleF) && <option value={vehicleF}>{vehicleF}</option>}
          </select>
        </div>
        <ConfirmButton onConfirm={() => { mutate((b) => { b.sheets = [] }); toast('All sheets deleted / எல்லா ஷீட்டும் நீக்கப்பட்டது') }}>
          <B en="Delete all sheets" ta="எல்லா ஷீட்டும் நீக்கு" />
        </ConfirmButton>
        <button type="button" className="btn" onClick={newSheet}><B en="New trip sheet" ta="புதிய ஷீட்" /></button>
      </Head>
      <section className="cards-ph">
        {list.map((s) => {
          const r = calc(s)
          return (
            <button type="button" className="scard" key={s.id} onClick={() => router.push(`/dashboard/sheets/${s.id}`)}>
              <span className="sc-t"><span className="reg">{s.vehicle || '—'}</span><span className="note">{s.no || '—'}</span><b className={`num ${r.balance < 0 ? 'bad' : ''}`}>{inr(r.balance)}</b></span>
              <span className="note">{fmtD(s.from)} – {fmtD(s.to)} · {s.driver || '—'}</span>
              <span className="sc-b">
                <span className="note">{r.pending ? <span className="warn"><B en={'Rent due ' + inr(r.pending)} ta="வர வேண்டியது" /></span> : <span className="ok"><B en="Rent ✓" ta="வந்தது" /></span>}</span>
                {s.settled ? <SettledPill /> : <SettleText v={r.settle} />}
              </span>
            </button>
          )
        })}
        {!list.length && <div className="panel empty"><B en="No trip sheets for this month." ta="இந்த மாதம் ஷீட் இல்லை." /></div>}
      </section>
      <section className="panel table-pc">
        <div className="tblwrap">
          {list.length ? (
            <table>
              <thead><tr>
                <th>No.<span className="ta">எண்</span></th><th>Vehicle<span className="ta">வண்டி</span></th><th>Driver<span className="ta">டிரைவர்</span></th>
                <th className="num">Dates<span className="ta">தேதி</span></th><th className="num">KM<span className="ta">கி.மீ</span></th>
                <th className="num">km/L<span className="ta">மைலேஜ்</span></th><th className="num">Rent<span className="ta">வரவு</span></th>
                <th className="num">Expense<span className="ta">செலவு</span></th><th className="num">Balance<span className="ta">மீதி</span></th>
                <th className="num">₹ / km<span className="ta">1 கி.மீ. மீதி</span></th><th className="num">Rent due<span className="ta">வர வேண்டியது</span></th>
                <th>Driver account<span className="ta">டிரைவர் கணக்கு</span></th><th />
              </tr></thead>
              <tbody>
                {list.map((s) => {
                  const r = calc(s)
                  return (
                    <tr key={s.id} className="click" onClick={() => router.push(`/dashboard/sheets/${s.id}`)}>
                      <td>{s.no || <span className="mute">—</span>}</td>
                      <td><span className="reg">{s.vehicle || '—'}</span></td>
                      <td>{s.driver || '—'}</td>
                      <td className="num">{fmtD(s.from)} – {fmtD(s.to)}</td>
                      <td className="num">{r.km ? nf(r.km) : '—'}</td>
                      <td className="num">{r.mileage ? r.mileage.toFixed(2) : '—'}</td>
                      <td className="num">{inr(r.rent)}</td>
                      <td className="num">{inr(r.expense)}</td>
                      <td className={`num ${r.balance < 0 ? 'bad' : ''}`} style={{ fontWeight: 600 }}>{inr(r.balance)}</td>
                      <td className="num">{r.perKm ? r.perKm.toFixed(2) : '—'}</td>
                      <td className="num">{r.pending ? <span className="warn">{inr(r.pending)}</span> : <span className="ok">✓</span>}</td>
                      <td>{s.settled ? <SettledPill /> : <SettleText v={r.settle} />}</td>
                      <td>
                        <ConfirmButton onConfirm={() => { mutate((b) => { b.sheets = b.sheets.filter((x) => x.id !== s.id) }); toast('Sheet deleted / ஷீட் நீக்கப்பட்டது') }}>
                          <B en="Delete" ta="நீக்கு" />
                        </ConfirmButton>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : <div className="empty"><B en="No trip sheets for this month." ta="இந்த மாதம் ஷீட் இல்லை." /></div>}
        </div>
      </section>
    </>
  )
}
