'use client'

import { useState } from 'react'
import { repGroups, type RepBy, type RepGroup, type RepKey } from '@/lib/convoy/calc'
import { inr, nf } from '@/lib/convoy/format'
import { useBook } from '@/components/convoy/BookProvider'
import { B, Head, MonthSelect, useMonth } from '@/components/convoy/ui'

type Opt<K extends string> = [K, string, string]
const RP_BY: Opt<RepBy>[] = [['vehicle', 'Vehicle', 'வண்டி'], ['driver', 'Driver', 'டிரைவர்'], ['month', 'Month', 'மாதம்']]
const RP_SORT: Opt<RepKey>[] = [
  ['bal', 'Balance', 'மீதி'], ['margin', 'Margin %', 'லாபம் %'], ['perKm', '₹ per km', '1 கி.மீ. மீதி'], ['mileage', 'Mileage km/L', 'மைலேஜ்'],
  ['rent', 'Rent', 'வரவு'], ['exp', 'Expense', 'செலவு'], ['diesel', 'Diesel', 'டீசல்'], ['toll', 'Toll', 'பாலம்'], ['pending', 'Rent due', 'வர வேண்டியது'],
  ['n', 'Trips', 'டிரிப்'], ['km', 'Distance km', 'கி.மீ'], ['perDay', '₹ per day', 'நாள் மீதி'],
]
const COST: [keyof RepGroup, string, string, string][] = [
  ['diesel', 'Diesel', 'டீசல்', '--c1'], ['toll', 'Toll', 'பாலம்', '--c2'], ['comm', 'Commission', 'கமிஷன்', '--c3'],
  ['bata', 'Bata', 'படி', '--c4'], ['rto', 'RTO / PC / naka', 'ஆர்.டி.ஓ / பி.சி', '--c5'], ['other', 'Other', 'இதர', '--c6'],
]
const CMP_ROWS: Opt<RepKey | 'bata' | 'rto'>[] = [
  ['n', 'Trips', 'டிரிப்'], ['km', 'Distance', 'தூரம்'], ['rent', 'Rent', 'வரவு'], ['exp', 'Expense', 'செலவு'], ['bal', 'Balance', 'மீதி'],
  ['margin', 'Margin %', 'லாபம் %'], ['perKm', '₹ per km', '1 கி.மீ. மீதி'], ['mileage', 'Mileage', 'மைலேஜ்'], ['diesel', 'Diesel', 'டீசல்'],
  ['toll', 'Toll', 'பாலம்'], ['bata', 'Bata', 'படி'], ['rto', 'RTO / PC / naka', 'ஆர்.டி.ஓ'], ['pending', 'Rent due', 'பாக்கி'], ['perDay', '₹ per day', 'நாள் மீதி'],
]
const LOWER_BETTER = new Set<string>(['exp', 'diesel', 'toll', 'pending', 'comm', 'bata', 'rto', 'other'])
const T_ = (o?: Opt<string>) => (o ? `${o[1]} / ${o[2]}` : '')
const repFmt = (k: string, v: number) =>
  k === 'margin' ? v.toFixed(1) + '%' : k === 'perKm' ? '₹' + v.toFixed(2) : k === 'mileage' ? (v ? v.toFixed(2) + ' km/L' : '—') : k === 'n' ? String(v) : k === 'km' ? nf(v) + ' km' : inr(v)
const val = (g: RepGroup, k: string) => (g[k as keyof RepGroup] as number) || 0

function Ring({ p }: { p: number }) {
  const v = Math.max(0, Math.min(100, p))
  return <div className="ring" style={{ '--p': v } as React.CSSProperties} role="img" aria-label={`Margin ${p.toFixed(1)} percent`}><span>{p.toFixed(0)}%</span></div>
}

function CostBar({ g }: { g: RepGroup }) {
  if (!g.rent) return <div className="note"><B en="No rent yet" ta="வரவு இல்லை" /></div>
  const bal = Math.max(0, g.bal)
  return (
    <div className="cbar" title="Out of every ₹100 rent">
      {COST.filter((c) => val(g, c[0]) > 0).map((c) => {
        const v = val(g, c[0])
        return <span key={c[0]} style={{ width: `${(v / g.rent) * 100}%`, background: `var(${c[3]})` }} title={`${c[1]} ${inr(v)} (${((v / g.rent) * 100).toFixed(1)}%)`} />
      })}
      <span style={{ width: `${(bal / g.rent) * 100}%`, background: 'var(--ok)' }} title={`Balance ${inr(g.bal)}`} />
    </div>
  )
}

export default function ReportsPage() {
  const { book } = useBook()
  const { inMonth, monthName } = useMonth()
  const [by, setBy] = useState<RepBy>('vehicle')
  const [sort, setSort] = useState<RepKey>('bal')
  const [dir, setDir] = useState<'asc' | 'desc'>('desc')
  const [ab, setAb] = useState({ a: '', b: '' })
  const [table, setTable] = useState(false)

  const list = book.sheets.filter(inMonth)
  const G = repGroups(list, by).sort((x, y) => (dir === 'desc' ? -1 : 1) * (val(x, sort) - val(y, sort)))
  const t: Record<string, number> = {}
  G.forEach((g) => ['n', 'km', 'lk', 'rent', 'exp', 'bal', 'pending', 'diesel', 'toll', 'comm', 'bata', 'rto', 'other', 'days'].forEach((k) => { t[k] = (t[k] || 0) + val(g, k) }))
  const margin = t.rent ? (t.bal / t.rent) * 100 : 0
  const perKm = t.km ? t.bal / t.km : 0
  const mileage = t.km && t.lk ? t.km / t.lk : 0

  const best = (k: RepKey) => G.filter((g) => val(g, k)).slice().sort((x, y) => val(y, k) - val(x, k))[0]
  const hi: [RepKey, string, string, string][] = [['bal', 'Most profit', 'அதிக லாபம்', '🏆'], ['perKm', 'Best ₹ per km', '1 கி.மீ.க்கு அதிகம்', '🛣️'], ['mileage', 'Best mileage', 'சிறந்த மைலேஜ்', '⛽'], ['pending', 'Most rent due', 'அதிக பாக்கி', '⏳']]
  const maxSort = Math.max(1, ...G.map((g) => Math.abs(val(g, sort))))

  const a = G.find((g) => g.k === ab.a) ? ab.a : G[0]?.k || ''
  const b = G.find((g) => g.k === ab.b) && ab.b !== a ? ab.b : G.find((g) => g.k !== a)?.k || ''
  const A = G.find((g) => g.k === a)
  const Bb = G.find((g) => g.k === b)
  const byOpt = RP_BY.find((o) => o[0] === by)!

  const pickSort = (k: RepKey) => {
    if (sort === k) setDir(dir === 'desc' ? 'asc' : 'desc')
    else { setSort(k); setDir(LOWER_BETTER.has(k) ? 'asc' : 'desc') }
  }
  const groupPick = (id: string, v: string, on: (v: string) => void) => (
    <select id={id} value={v} onChange={(e) => on(e.target.value)}>
      {G.map((g) => <option key={g.k} value={g.k}>{g.label}</option>)}
    </select>
  )

  return (
    <>
      <Head title={<B en="Reports" ta="அறிக்கை" />} sub={<>{G.length} {T_(byOpt)} · {list.length} <B en="trip sheets" ta="ஷீட்கள்" /> · {monthName}</>} />
      <div className="rp-ctl">
        <div className="seg" role="group" aria-label="Group by">
          {RP_BY.map((o) => (
            <button type="button" key={o[0]} className={by === o[0] ? 'on' : ''} onClick={() => { setBy(o[0]); setAb({ a: '', b: '' }) }}><B en={o[1]} ta={o[2]} /></button>
          ))}
        </div>
        <label className="note" htmlFor="rp-sort"><B en="Sort by" ta="வரிசை" /></label>
        <select id="rp-sort" value={sort} onChange={(e) => setSort(e.target.value as RepKey)}>
          {RP_SORT.map((o) => <option key={o[0]} value={o[0]}>{T_(o)}</option>)}
        </select>
        <button type="button" className="ghost" onClick={() => setDir(dir === 'desc' ? 'asc' : 'desc')}>
          {dir === 'desc' ? <B en="High → low" ta="அதிகம் → குறைவு" /> : <B en="Low → high" ta="குறைவு → அதிகம்" />}
        </button>
        <span className="actions"><MonthSelect id="m3" /></span>
      </div>

      <section className="hls">
        {hi.map(([k, en, ta, ic]) => {
          const g = best(k)
          return (
            <div className="hl" key={k}>
              <div className="hl-i" aria-hidden="true">{ic}</div>
              <div className="hl-b">
                <span className="lbl"><B en={en} ta={ta} /></span>
                <b>{g ? g.label : '—'}</b>
                <span className={`num ${k === 'pending' ? 'warn' : 'ok'}`}>{g ? repFmt(k, val(g, k)) : <B en="Not enough data" ta="தரவு போதவில்லை" />}</span>
              </div>
            </div>
          )
        })}
      </section>

      <section className="panel">
        <h2><B en="Totals for this view" ta="மொத்தம்" /></h2>
        <div className="tot-strip">
          <div><span className="lbl"><B en="Rent" ta="வரவு" /></span><b>{inr(t.rent || 0)}</b></div>
          <div><span className="lbl"><B en="Expense" ta="செலவு" /></span><b>{inr(t.exp || 0)}</b></div>
          <div><span className="lbl"><B en="Balance" ta="மீதி" /></span><b className={(t.bal || 0) < 0 ? 'bad' : 'ok'}>{inr(t.bal || 0)}</b></div>
          <div><span className="lbl"><B en="Margin" ta="லாபம்" /></span><b>{margin.toFixed(1)}%</b></div>
          <div><span className="lbl">₹ / km</span><b>{perKm ? '₹' + perKm.toFixed(2) : '—'}</b></div>
          <div><span className="lbl"><B en="Mileage" ta="மைலேஜ்" /></span><b>{mileage ? mileage.toFixed(2) : '—'}</b></div>
        </div>
        <div className="legend">
          {COST.map((c) => <span key={c[0]}><i style={{ background: `var(${c[3]})` }} /><B en={c[1]} ta={c[2]} /></span>)}
          <span><i style={{ background: 'var(--ok)' }} /><B en="Balance kept" ta="மீதி" /></span>
          <span className="note"><B en="Bars show where each ₹100 of rent went" ta="ஒவ்வொரு ₹100 வரவும் எங்கே போனது" /></span>
        </div>
      </section>

      <section className="rcards">
        {G.length ? G.map((g, i) => (
          <article className="rcard" key={g.k}>
            <div className="rc-top">
              <span className={`rank ${i < 3 ? 'r' + (i + 1) : ''}`}>{i + 1}</span>
              <div className="rc-name">
                {by === 'vehicle' ? <span className="reg">{g.label}</span> : <b>{g.label}</b>}
                <span className="note">{g.n} <B en="trips" ta="டிரிப்" />{g.km ? ' · ' + nf(g.km) + ' km' : ''}{by !== 'vehicle' && g.veh.size ? <> · {g.veh.size} <B en="vehicles" ta="வண்டி" /></> : null}</span>
              </div>
              <Ring p={g.margin} />
            </div>
            <div className="rc-big"><span className="lbl"><B en="Balance" ta="மீதி" /></span><span className={`num ${g.bal < 0 ? 'bad' : 'ok'}`}>{inr(g.bal)}</span></div>
            <div className="rc-sort">
              <span className="note">{T_(RP_SORT.find((o) => o[0] === sort))}</span>
              <div className="track"><span style={{ width: `${(Math.abs(val(g, sort)) / maxSort) * 100}%` }} /></div>
              <span className="num">{repFmt(sort, val(g, sort))}</span>
            </div>
            <CostBar g={g} />
            <dl className="rc-m">
              <div><dt><B en="Rent" ta="வரவு" /></dt><dd>{inr(g.rent)}</dd></div>
              <div><dt><B en="Expense" ta="செலவு" /></dt><dd>{inr(g.exp)}</dd></div>
              <div><dt>₹ / km</dt><dd>{g.perKm ? '₹' + g.perKm.toFixed(2) : '—'}</dd></div>
              <div><dt><B en="Mileage" ta="மைலேஜ்" /></dt><dd>{g.mileage ? g.mileage.toFixed(2) : '—'}</dd></div>
              <div><dt><B en="Rent due" ta="பாக்கி" /></dt><dd className={g.pending ? 'warn' : ''}>{g.pending ? inr(g.pending) : '✓'}</dd></div>
              <div><dt><B en="Per day" ta="நாள்" /></dt><dd>{g.perDay ? inr(g.perDay) : '—'}</dd></div>
            </dl>
          </article>
        )) : <div className="panel empty"><B en="No trip sheets in this period." ta="இந்த காலத்தில் ஷீட் இல்லை." /></div>}
      </section>

      <section className="panel">
        <h2><B en="Compare" ta="ஒப்பிடு" /></h2>
        <div className="rp-ctl in">
          {G.length > 1 && <>{groupPick('rp-a', a, (v) => setAb({ a: v, b }))}<span className="vs">vs</span>{groupPick('rp-b', b, (v) => setAb({ a, b: v }))}</>}
        </div>
        {A && Bb ? (
          <div className="tblwrap">
            <table className="cmp">
              <thead><tr><th><B en="Measure" ta="அளவு" /></th><th className="num">{A.label}</th><th className="num">{Bb.label}</th><th><B en="Better" ta="சிறந்தது" /></th></tr></thead>
              <tbody>
                {CMP_ROWS.map(([k, en, ta]) => {
                  const x = val(A, k)
                  const y = val(Bb, k)
                  const lower = LOWER_BETTER.has(k)
                  const w = x === y ? 0 : (x > y) !== lower ? 1 : 2
                  const pct = Math.max(x, y) ? (Math.abs(x - y) / Math.max(Math.abs(x), Math.abs(y))) * 100 : 0
                  return (
                    <tr key={k}>
                      <td><B en={en} ta={ta} /></td>
                      <td className={`num ${w === 1 ? 'win' : ''}`}>{repFmt(k, x)}</td>
                      <td className={`num ${w === 2 ? 'win' : ''}`}>{repFmt(k, y)}</td>
                      <td>{w ? <><span className="pill ok">{w === 1 ? A.label : Bb.label}</span> <span className="note">{pct.toFixed(0)}% {lower ? <B en="lower" ta="குறைவு" /> : <B en="higher" ta="அதிகம்" />}</span></> : <span className="note">=</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : <div className="empty"><B en="Need at least two to compare." ta="ஒப்பிட இரண்டு வேண்டும்." /></div>}
      </section>

      <section className="panel">
        <h2><B en="Full table" ta="முழு அட்டவணை" /> <button type="button" className="link" style={{ marginLeft: 'auto' }} onClick={() => setTable(!table)}>{table ? <B en="Hide" ta="மறை" /> : <B en="Show" ta="காட்டு" />}</button></h2>
        {table && (
          <div className="tblwrap">
            <table>
              <thead><tr>
                <th>#</th><th>{byOpt[1]}</th>
                {RP_SORT.map((o) => (
                  <th key={o[0]} className={`num ${o[0] === sort ? 'sorted' : ''}`}>
                    <button type="button" className="thbtn" onClick={() => pickSort(o[0])}>{o[1]}{o[0] === sort ? (dir === 'desc' ? ' ↓' : ' ↑') : ''}</button>
                    <span className="ta">{o[2]}</span>
                  </th>
                ))}
              </tr></thead>
              <tbody>
                {G.map((g, i) => (
                  <tr key={g.k}>
                    <td className="sl">{i + 1}.</td>
                    <td>{by === 'vehicle' ? <span className="reg">{g.label}</span> : g.label}</td>
                    {RP_SORT.map((o) => <td key={o[0]} className={`num ${o[0] === sort ? 'sorted' : ''} ${o[0] === 'bal' && g.bal < 0 ? 'bad' : ''}`}>{repFmt(o[0], val(g, o[0]))}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
