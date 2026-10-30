'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ADV_MODES, CATS, OTHER_CATS, PMODES, type Cat } from '@/lib/convoy/constants'
import { blankLoad, calc, monthOf, nextNo, suggestions, summaryText, type SheetCalc } from '@/lib/convoy/calc'
import { fmtD, fmtDate, inr, nf, num, T, today } from '@/lib/convoy/format'
import { downloadPdf } from '@/lib/convoy/pdf'
import { fillFromLast, lastDieselRate, lastSheetOf, nextSheetFor, warnings } from '@/lib/convoy/smart'
import type { CatKey } from '@/lib/convoy/types'
import { useBook } from './BookProvider'
import { DateInput, SuggestInput } from './inputs'
import { QuickAdd, type QuickKind } from './QuickAdd'
import { DriverRows, SettlePane, settleWords } from './Settle'
import { B, Drawer, Icon, Plate, SecHead } from './ui'

const getPath = (o: any, p: string): any => p.split('.').reduce((a, k) => a?.[k], o)
function setPath(o: any, p: string, v: unknown) {
  const ks = p.split('.')
  const last = ks.pop()!
  ks.reduce((a, k) => a[k], o)[last] = v
}
const str = (v: unknown) => (v == null ? '' : String(v))

// copy each column heading onto its cells so the narrow (card) layout can label them
function labelTables(root: HTMLElement) {
  root.querySelectorAll('table.grid-in').forEach((t) => {
    const hs = [...t.querySelectorAll('thead th')].map((th) => {
      const first = th.childNodes[0]
      const en = (first && first.nodeType === 3 ? first.textContent : th.textContent)!.trim()
      const ta = th.querySelector('.ta')
      return en + (ta ? ' / ' + ta.textContent!.trim() : '')
    })
    t.querySelectorAll('tbody tr,tfoot tr').forEach((tr) => {
      let c = 0
      ;[...tr.children].forEach((td) => {
        const lab = hs[c]
        const cell = td as HTMLTableCellElement
        if (lab && !cell.classList.contains('sl') && !cell.hasAttribute('colspan') && lab !== '#') cell.dataset.l = lab
        c += cell.colSpan || 1
      })
    })
  })
}

export function SheetEditor({ id }: { id: string }) {
  const { book, mutate, toast } = useBook()
  const router = useRouter()
  const s = book.sheets.find((x) => x.id === id)
  const root = useRef<HTMLDivElement>(null)
  const focusNext = useRef<string | null>(null)
  const [quick, setQuick] = useState<{ kind: QuickKind; path: string } | null>(null)
  const [copyText, setCopyText] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [settling, setSettling] = useState(false)
  const bar = useRef<HTMLDivElement>(null)

  // sticky totals bar height (0 when hidden on wide screens) so the + button and page padding clear it
  useEffect(() => {
    const el = bar.current
    if (!el) return
    const put = () => document.documentElement.style.setProperty('--totbar-h', getComputedStyle(el).display === 'none' ? '0px' : el.offsetHeight + 'px')
    const ro = new ResizeObserver(put)
    ro.observe(el)
    window.addEventListener('resize', put)
    put()
    return () => { ro.disconnect(); window.removeEventListener('resize', put); document.documentElement.style.setProperty('--totbar-h', '0px') }
  }, [id])

  useLayoutEffect(() => { if (root.current) labelTables(root.current) })
  useEffect(() => {
    if (!focusNext.current || !root.current) return
    const els = [...root.current.querySelectorAll<HTMLElement>(focusNext.current)]
    ;(els.find((e) => e.tagName === 'INPUT' && !e.classList.contains('dt')) || els[0])?.focus()
    focusNext.current = null
  })

  // ---------- drag rows to reorder (mouse and touch) ----------
  const drag = useRef<{ list: string; from: number; to: number; row: HTMLElement; id: number } | null>(null)
  const dgClear = () => root.current?.querySelectorAll('.drop-before,.drop-after').forEach((x) => x.classList.remove('drop-before', 'drop-after'))

  if (!s) {
    return <div className="panel empty"><B en="This trip sheet was not found. It may have been deleted." ta="இந்த ஷீட் இல்லை." /> <button className="link" onClick={() => router.push('/dashboard/sheets')}>← <B en="All trip sheets" ta="எல்லா ஷீட்" /></button></div>
  }
  const r = calc(s)

  const set = (path: string, v: unknown) => mutate(() => {
    setPath(s, path, v)
    if (path === 'vehicle') {
      s.no = v ? nextNo(String(v), s.id, book.sheets) : ''
      const last = v ? lastSheetOf(String(v), s.id, book.sheets) : undefined
      if (last && fillFromLast(s, last)) toast(`Sheet ${s.no} · filled from the last sheet of this truck / கடைசி ஷீட்டிலிருந்து நிரப்பப்பட்டது`)
      else if (v) toast('Sheet no. / ஷீட் எண் ' + s.no)
    }
    const m = path.match(/^lines\.diesel\.(\d+)\.(litres|rate)$/)
    if (m) {
      const x = s.lines.diesel[+m[1]]
      if (num(x.litres) && num(x.rate)) x.amount = Math.round(num(x.litres) * num(x.rate))
    }
  })
  const addRow = (list: string) => {
    mutate(() => {
      const arr = getPath(s, list) as any[]
      const k = list.split('.').pop() as CatKey
      if (list === 'loads') arr.push(blankLoad())
      else if (/\.payments$/.test(list)) arr.push({ date: today(), mode: 'account', amount: '', note: '' })
      else if (list === 'advances') arr.push({ date: today(), mode: 'GPay', amount: '', note: '' })
      else if (list === 'lines.diesel') arr.push({ date: today(), desc: '', amount: '', by: 'office', litres: '', rate: lastDieselRate(s.vehicle, book.sheets) })
      else arr.push({ date: '', desc: '', amount: '', by: CATS.find((c) => c.k === k)?.by || 'driver', litres: '', rate: '' })
      focusNext.current = `[data-p^="${list}.${arr.length - 1}."]`
    })
  }
  const delRow = (path: string) => {
    const ks = path.split('.')
    const i = +ks.pop()!
    mutate(() => { (getPath(s, ks.join('.')) as any[]).splice(i, 1) })
  }
  const sug = (key: string) => () => suggestions(book.sheets)[key] || []

  // ---------- small field builders ----------
  const inp = (path: string, o: { n?: boolean; ph?: string; al?: string; id?: string; sug?: string; onKeyDown?: React.KeyboardEventHandler<HTMLInputElement> } = {}) => {
    const common = { 'data-p': path } as Record<string, string>
    if (o.sug) {
      return <SuggestInput value={str(getPath(s, path))} onChange={(v) => set(path, v)} source={sug(o.sug)} placeholder={o.ph} label={o.al || path} inputProps={{ id: o.id, ...common }} />
    }
    return (
      <input
        {...common}
        id={o.id}
        value={str(getPath(s, path))}
        onChange={(e) => set(path, e.target.value)}
        className={o.n ? 'n' : undefined}
        inputMode={o.n ? 'decimal' : undefined}
        placeholder={o.ph}
        aria-label={o.al || path}
        onKeyDown={o.onKeyDown}
      />
    )
  }
  const date = (path: string, al: string, id?: string) => (
    <span data-p={path} style={{ display: 'contents' }}><DateInput id={id} value={str(getPath(s, path))} onChange={(v) => set(path, v)} label={al} /></span>
  )
  const bySel = (path: string, al: string) => (
    <select data-p={path} aria-label={al} value={getPath(s, path)} onChange={(e) => set(path, e.target.value)}>
      <option value="driver">{T('Driver', 'டிரைவர்')}</option>
      <option value="office">{T('Office', 'ஆபிஸ்')}</option>
    </select>
  )
  const pick = (path: 'vehicle' | 'driver' | 'driver2' | 'cleaner', kind: QuickKind, id: string) => {
    const val = s[path]
    const opts: [string, string][] = kind === 'vehicle'
      ? book.vehicles.map((v) => [v.reg, v.reg + (v.model ? ' · ' + v.model : '')])
      : book.people.filter((p) => kind === 'cleaner' || p.role === 'driver').map((p) => [p.name, p.name + (kind === 'cleaner' && p.role === 'driver' ? ' (driver)' : '')])
    const has = !val || opts.some((o) => o[0] === val)
    const ph = kind === 'vehicle' ? T('Select vehicle', 'வண்டி தேர்வு') : path === 'driver' ? T('Select driver', 'டிரைவர் தேர்வு') : T('None', 'இல்லை')
    const add = kind === 'vehicle' ? T('+ Add new vehicle', 'புதிய வண்டி') : kind === 'cleaner' ? T('+ Add new cleaner', 'புதிய கிளீனர்') : T('+ Add new driver', 'புதிய டிரைவர்')
    return (
      <select className="pick" id={id} value={val} onChange={(e) => {
        if (e.target.value === '__add') { setQuick({ kind, path }); return }
        set(path, e.target.value)
      }}>
        <option value="">{ph}</option>
        {opts.map((o) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}
        {!has && <option value={val}>{val}</option>}
        <option value="__add">{add}</option>
      </select>
    )
  }
  const F = (en: string, ta: string, html: React.ReactNode, f?: string) => (
    <div className="f"><label htmlFor={f}>{en} <span className="ta">{ta}</span></label>{html}</div>
  )
  const grip = (path: string) => <span className="grip" data-drag={path} aria-label="Drag to move row" title="Drag to move">⠿</span>
  const del = (path: string, al: string) => <button type="button" className="rowdel" onClick={() => delRow(path)} aria-label={al}>×</button>

  // ---------- header ----------
  const sk = num(s.startKm)
  const ek = num(s.endKm)
  const kmAuto = !!(sk && ek)
  const hdr = (
    <div className="hdr">
      {F('Sheet no. (auto)', 'ஷீட் எண் (தானாக)', <input id="h-no" value={s.no} readOnly placeholder={T('Select vehicle first', 'முதலில் வண்டி')} style={{ fontFamily: 'var(--mono)', fontWeight: 600 }} />, 'h-no')}
      {F('Paper sheet no.', 'பேப்பர் ஷீட் எண்', inp('paperNo', { al: 'Paper sheet number', id: 'h-pno', ph: T('Optional', 'விருப்பம்') }), 'h-pno')}
      {F('Vehicle', 'வண்டி எண்', pick('vehicle', 'vehicle', 'h-veh'), 'h-veh')}
      {F('Driver 1', 'டிரைவர் 1', pick('driver', 'driver', 'h-d1'), 'h-d1')}
      {F('Driver 2', 'டிரைவர் 2', pick('driver2', 'driver', 'h-d2'), 'h-d2')}
      {F('Cleaner', 'கிளீனர்', pick('cleaner', 'cleaner', 'h-cl'), 'h-cl')}
      {F('From date', 'ஆரம்ப தேதி', date('from', 'From date', 'h-from'), 'h-from')}
      {F('To date', 'முடிவு தேதி', date('to', 'To date', 'h-to'), 'h-to')}
      {F('Commission %', 'கமிஷன் %', inp('commPct', { n: true, id: 'h-cp', al: 'Commission percent' }), 'h-cp')}
      {F('Driver bata %', 'டிரைவர் படி %', inp('bataPct', { n: true, id: 'h-bp', al: 'Driver bata percent' }), 'h-bp')}
      {F('Start km', 'ஆரம்ப கி.மீ', inp('startKm', { n: true, id: 'h-sk', al: 'Start km' }), 'h-sk')}
      {F('End km', 'முடிவு கி.மீ', inp('endKm', { n: true, id: 'h-ek', al: 'End km' }), 'h-ek')}
      {F('Total km', 'மொத்த கி.மீ', <>
        {kmAuto
          ? <input id="h-tk" className="n" readOnly tabIndex={-1} value={nf(ek - sk)} aria-label="Total km" />
          : inp('totalKm', { n: true, id: 'h-tk', al: 'Total km' })}
        <span className="note">{kmAuto
          ? ek < sk ? <span className="bad"><B en="End km is less than start km" ta="முடிவு கி.மீ குறைவாக உள்ளது" /></span> : <B en="End km − start km" ta="முடிவு − ஆரம்பம்" />
          : <B en="Fills in when start and end km are typed" ta="ஆரம்ப, முடிவு கி.மீ போட்டால் தானாக வரும்" />}</span>
      </>, 'h-tk')}
      {F('Status', 'நிலை', (
        <select id="h-st" value={s.settled ? '1' : '0'} onChange={(e) => set('settled', e.target.value === '1')}>
          <option value="0">{T('Open', 'திறந்தது')}</option>
          <option value="1">{T('Settled with driver', 'டிரைவருடன் முடிந்தது')}</option>
        </select>
      ), 'h-st')}
    </div>
  )

  // ---------- loads ----------
  const loadPill = (i: number) => {
    const l = s.loads[i]
    const rent = num(l.rent)
    const got = (l.payments || []).reduce((a, p) => a + num(p.amount), 0)
    const left = rent - got
    const pill = !rent ? null : left <= 0
      ? <span className="pill ok"><B en="Received" ta="வந்தது" /></span>
      : <span className={`pill ${got ? 'info' : 'warn'}`}>{got ? <B en="Part" ta="பகுதி" /> : <B en="Pending" ta="வரவில்லை" />}</span>
    return { pill, left, rent, got }
  }
  const loads = (
    <div className="panel s-green">
      <SecHead icon="truck" en="Loads and rent" ta="லோடு / வாடகை" meta={inr(r.rent)} />
      <div className="tblwrap">
        <table className="grid-in loads-t">
          <colgroup>
            <col className="c-sl" /><col className="c-date" /><col /><col /><col /><col className="c-ton" /><col className="c-pt" />
            <col className="c-rent" /><col className="c-rcv" /><col className="c-amt" /><col className="c-amt" /><col className="c-amt" /><col className="c-del" />
          </colgroup>
          <thead><tr>
            <th className="sl">No.<span className="ta">எண்</span></th><th>Date<span className="ta">தேதி</span></th><th>From<span className="ta">புறப்படும் இடம்</span></th>
            <th>To<span className="ta">சேருமிடம்</span></th><th>Goods<span className="ta">லோடு</span></th><th className="num">Ton<span className="ta">டன்</span></th>
            <th className="num">₹ per ton<span className="ta">டன் விலை</span></th><th className="num">Rent<span className="ta">வாடகை</span></th>
            <th>Rent received<span className="ta">வந்த வாடகை</span></th><th className="num">Comm.<span className="ta">கமிஷன்</span></th>
            <th className="num">Loading<span className="ta">ஏ.கூலி</span></th><th className="num">Unload<span className="ta">இ.கூலி</span></th><th />
          </tr></thead>
          <tbody>
            {s.loads.map((l, i) => {
              const { rent, got } = loadPill(i)
              return (
                <tr key={i} data-row={`loads.${i}`}>
                  <td className="sl">{grip(`loads.${i}`)}{i + 1}.</td>
                  <td>{date(`loads.${i}.date`, 'Load date')}</td>
                  <td>{inp(`loads.${i}.from`, { ph: T('From', 'இடம்'), al: 'From', sug: 'place' })}</td>
                  <td>{inp(`loads.${i}.to`, { ph: T('To', 'சேருமிடம்'), al: 'To', sug: 'place' })}</td>
                  <td>{inp(`loads.${i}.goods`, { ph: T('Goods', 'லோடு'), al: 'Goods', sug: 'goods' })}</td>
                  <td>{inp(`loads.${i}.ton`, { n: true, al: 'Tons' })}</td>
                  <td>{inp(`loads.${i}.perTon`, { n: true, al: 'Rupees per ton' })}</td>
                  <td>{inp(`loads.${i}.rent`, { n: true, al: 'Rent' })}</td>
                  <td><RentGot rent={rent} got={got} /></td>
                  <td className="num">{nf(Math.round((num(l.rent) * r.commPct) / 100))}</td>
                  <td>{inp(`loads.${i}.loading`, { n: true, al: 'Loading' })}</td>
                  <td>{inp(`loads.${i}.unloading`, { n: true, al: 'Unloading' })}</td>
                  <td>{del(`loads.${i}`, 'Remove load')}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot><tr>
            <td colSpan={5}><B en="Total" ta="மொத்தம்" /></td>
            <td className="num">{r.tons ? r.tons.toFixed(2).replace(/\.00$/, '') + ' T' : ''}</td>
            <td />
            <td className="num">{nf(r.rent)}</td>
            <td><RentGot rent={r.rent} got={r.accRecv + r.drvRecv} /></td>
            <td className="num">{nf(r.comm)}</td><td className="num">{nf(r.loading)}</td><td className="num">{nf(r.unloading)}</td><td />
          </tr></tfoot>
        </table>
      </div>
      <div className="secfoot">
        <button type="button" className="ghost" onClick={() => addRow('loads')}><B en="Add load" ta="லோடு சேர்" /></button>
        <span className="note"><B en={`Commission is ${r.commPct}% of rent · change % in Sheet details`} ta={`கமிஷன் வரவில் ${r.commPct}%`} /></span>
      </div>
      <div className="byset">
        <span className="note"><B en="Who paid these from trip cash?" ta="யார் கொடுத்தார்?" /></span>
        <label><B en="Commission" ta="கமிஷன்" /> {bySel('commBy', 'Commission paid by')}</label>
        <label><B en="Loading" ta="ஏற்றுக்கூலி" /> {bySel('loadBy', 'Loading paid by')}</label>
        <label><B en="Unloading" ta="இறக்குக்கூலி" /> {bySel('unloadBy', 'Unloading paid by')}</label>
      </div>
    </div>
  )

  // ---------- rent payments ----------
  const payments = (
    <div className="panel pay s-dgreen">
      <SecHead icon="rupee" en="Rent payments" ta="வாடகை வசூல்" meta={<>{inr(r.accRecv + r.drvRecv)} / {inr(r.rent)}</>} />
      {s.loads.length ? s.loads.map((l, i) => {
        const ps = l.payments || []
        const { pill, left, rent } = loadPill(i)
        return (
          <div className="pblock" key={i}>
            <div className="phead">
              <span className="pno">{i + 1}.</span>
              <span className="proute">{l.from || '—'} → {l.to || '—'}{l.date && <> <span className="note">{fmtDate(l.date)}</span></>}</span>
              <span className="num prent"><B en="Rent" ta="வாடகை" /> {inr(rent)}</span>
              <span>{pill}{rent > 0 && left > 0 && <> <span className="note"><B en="Due" ta="பாக்கி" /> {inr(left)}</span></>}{left < 0 && <> <span className="note bad"><B en="More than rent" ta="வாடகையை விட அதிகம்" /> {inr(-left)}</span></>}</span>
            </div>
            {ps.length > 0 && (
              <div className="tblwrap">
                <table className="grid-in">
                  <thead><tr>
                    <th className="sl">No.<span className="ta">எண்</span></th><th>Date<span className="ta">தேதி</span></th><th>How received<span className="ta">எப்படி</span></th>
                    <th className="num">Amount<span className="ta">ரூ.</span></th><th>Remarks (cheque no., date, bank)<span className="ta">குறிப்பு (செக் எண், தேதி, வங்கி)</span></th><th />
                  </tr></thead>
                  <tbody>
                    {ps.map((p, j) => {
                      const base = `loads.${i}.payments.${j}`
                      return (
                        <tr key={j} data-row={base}>
                          <td className="sl">{grip(base)}{j + 1}.</td>
                          <td style={{ minWidth: 120 }}>{date(`${base}.date`, 'Payment date')}</td>
                          <td style={{ minWidth: 170 }}>
                            <select data-p={`${base}.mode`} aria-label="How received" value={p.mode} onChange={(e) => set(`${base}.mode`, e.target.value)}>
                              {PMODES.map((m) => <option key={m[0]} value={m[0]}>{T(m[1], m[2])}</option>)}
                            </select>
                          </td>
                          <td style={{ minWidth: 100 }}>{inp(`${base}.amount`, { n: true, ph: '0', al: 'Amount received' })}</td>
                          <td style={{ minWidth: 220 }}>{inp(`${base}.note`, { ph: T('e.g. Chq 004512, 12/9, SBI', 'உதா. செக் 004512, SBI'), al: 'Remarks', sug: 'pnote' })}</td>
                          <td>{del(base, 'Remove payment')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="secfoot">
              <button type="button" className="ghost" onClick={() => addRow(`loads.${i}.payments`)}><B en="Add payment" ta="வசூல் சேர்" /></button>
              {rent > 0 && left > 0 && (
                <button type="button" className="link" onClick={() => {
                  mutate(() => { l.payments = l.payments || []; l.payments.push({ date: today(), mode: 'account', amount: left, note: '' }) })
                  toast('Marked received / வந்தது')
                }}><B en="Mark rest received in account" ta="மீதி அக்கவுண்டில் வந்தது" /></button>
              )}
            </div>
          </div>
        )
      }) : <div className="empty"><B en="Add a load first. Each load appears here for its payments." ta="முதலில் லோடு சேர்க்கவும்." /></div>}
      <div className="note" style={{ padding: '8px 16px 12px' }}><B en="Cash the driver collects is added to his advance by itself." ta="டிரைவர் வசூல் பணம் அவர் அட்வான்ஸில் தானாக சேரும்." /></div>
    </div>
  )

  // ---------- diesel ----------
  const diesel = (
    <div className="panel s-orange">
      <SecHead icon="fuel" en="Diesel" ta="டீசல்" meta={<>{inr(r.cat.diesel)}{r.mileage ? ' · ' + r.mileage.toFixed(2) + ' km/L' : ''}</>} />
      <div className="tblwrap">
        <table className="grid-in">
          <thead><tr>
            <th className="sl">No.<span className="ta">எண்</span></th><th>Date<span className="ta">தேதி</span></th><th>Place<span className="ta">ஊர்</span></th>
            <th className="num">Litres<span className="ta">அளவு லி.</span></th><th className="num">Rate<span className="ta">விலை</span></th>
            <th className="num">Amount<span className="ta">ரூ.</span></th><th>Paid by<span className="ta">யார் கொடுத்தார்</span></th><th />
          </tr></thead>
          <tbody>
            {(s.lines.diesel || []).map((_, i) => {
              const base = `lines.diesel.${i}`
              return (
                <tr key={i} data-row={base}>
                  <td className="sl">{grip(base)}{i + 1}.</td>
                  <td style={{ minWidth: 128 }}>{date(`${base}.date`, 'Diesel date')}</td>
                  <td style={{ minWidth: 110 }}>{inp(`${base}.desc`, { ph: T('Bunk / place', 'பங்க் / ஊர்'), al: 'Place', sug: 'dplace' })}</td>
                  <td style={{ minWidth: 70 }}>{inp(`${base}.litres`, { n: true, al: 'Litres' })}</td>
                  <td style={{ minWidth: 70 }}>{inp(`${base}.rate`, { n: true, al: 'Rate' })}</td>
                  <td style={{ minWidth: 96 }}>{inp(`${base}.amount`, { n: true, al: 'Amount' })}</td>
                  <td style={{ minWidth: 110 }}>{bySel(`${base}.by`, 'Paid by')}</td>
                  <td>{del(base, 'Remove diesel line')}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot><tr>
            <td colSpan={3}><B en="Total" ta="மொத்தம்" /></td>
            <td className="num">{nf(r.litres)} L</td><td /><td className="num">{nf(r.cat.diesel)}</td>
            <td colSpan={2} className="note">{r.catDriver.diesel ? `Driver cash / டிரைவர் ரொக்கம் ${inr(r.catDriver.diesel)}` : ''}</td>
          </tr></tfoot>
        </table>
      </div>
      <div className="secfoot">
        <button type="button" className="ghost" onClick={() => addRow('lines.diesel')}><B en="Add fill" ta="டீசல் சேர்" /></button>
        <span className="note"><B en="Amount fills in from litres × rate" ta="லிட்டர் × விலை = தொகை" /></span>
      </div>
    </div>
  )

  // ---------- RTO, PC, toll and the other heads ----------
  const catPanel = (c: Cat) => {
    const ls = s.lines[c.k] || []
    const pl = c.place
    const dp = r.catDriver[c.k]
    const op = r.cat[c.k] - dp
    return (
      <div className="panel s-red" key={c.k}>
        <SecHead icon="receipt" en={c.en} ta={c.ta} meta={r.cat[c.k] ? inr(r.cat[c.k]) : ''} />
        {ls.length > 0 && (
          <div className="lrows grid-in">
            <div className="lr lh"><span className="sl">#</span><span>{pl ? <B en="Location" ta="இடம்" /> : <B en="Details" ta="விவரம்" />}</span><span className="num"><B en="Amount" ta="ரூ." /></span><span><B en="Paid by" ta="யார்" /></span><span /></div>
            {ls.map((_, i) => {
              const base = `lines.${c.k}.${i}`
              return (
                <div className="lr" key={i} data-row={base}>
                  <span className="sl">{grip(base)}{i + 1}.</span>
                  {inp(`${base}.desc`, { ph: pl ? T('Location', 'இடம்') : T('Details', 'விவரம்'), al: c.en + ' ' + (pl ? 'location' : 'details'), sug: 'c-' + c.k })}
                  {inp(`${base}.amount`, {
                    n: true, ph: '0', al: c.en + ' amount',
                    onKeyDown: (e) => {
                      if (e.key !== 'Enter') return
                      e.preventDefault()
                      if (i === ls.length - 1) addRow(`lines.${c.k}`)
                      else root.current?.querySelector<HTMLInputElement>(`[data-p="lines.${c.k}.${i + 1}.desc"]`)?.focus()
                    },
                  })}
                  {bySel(`${base}.by`, 'Paid by')}
                  {del(base, 'Remove line')}
                </div>
              )
            })}
            <div className="lr lt">
              <span /><span><B en={'Total ' + c.en} ta={c.ta + ' மொத்தம்'} /></span>
              <span className="num">{inr(r.cat[c.k])}</span>
              <span className="note" style={{ gridColumn: '4/6' }}>{[dp ? 'Driver / டிரைவர் ' + inr(dp) : '', op ? 'Office / ஆபிஸ் ' + inr(op) : ''].filter(Boolean).join(' · ')}</span>
            </div>
          </div>
        )}
        <div className="secfoot">
          <button type="button" className="ghost" onClick={() => addRow(`lines.${c.k}`)}>{pl ? <B en="Add location" ta="இடம் சேர்" /> : <B en={'Add ' + c.en.toLowerCase()} ta={c.ta + ' சேர்'} />}</button>
          {ls.length > 0 && <span className="note"><B en="Enter on amount adds the next row" ta="Enter அழுத்தினால் அடுத்த வரி" /></span>}
        </div>
      </div>
    )
  }

  // ---------- bata ----------
  const bata = (
    <div className="panel s-purple">
      <SecHead icon="person" en="Bata" ta="படி" meta={inr(r.bata + r.cleanerBata)} />
      <div className="fixed">
        {F('Driver bata', 'டிரைவர் படி', <>
          <input id="h-bata" className="n" readOnly tabIndex={-1} value={nf(r.bata)} style={{ fontWeight: 600 }} aria-label="Driver bata" />
          <span className="note"><B en={`${r.bataPct}% of rent · change % in Sheet details`} ta={`வரவில் ${r.bataPct}% · % மாற்ற ஷீட் விவரம்`} /></span>
        </>, 'h-bata')}
        {F('Cleaner bata', 'கிளீனர் படி', inp('cleanerBata', { n: true, id: 'h-cb', al: 'Cleaner bata' }), 'h-cb')}
        {F('Extra to driver', 'கூடுதல் (டிரைவர் கணக்கு மட்டும்)', inp('driverExtra', { n: true, id: 'h-dx', al: 'Extra to driver' }), 'h-dx')}
      </div>
    </div>
  )

  // ---------- advances ----------
  const advances = (
    <div className="panel adv s-purple">
      <SecHead icon="person" en="Advance to driver" ta="அட்வான்ஸ் (AD)" meta={inr(r.advance)} metaId="t-adv" />
      <div className="tblwrap">
        {(s.advances.length > 0 || r.drvRecv > 0) && (
          <table className="grid-in">
            <thead><tr>
              <th className="sl">No.<span className="ta">எண்</span></th><th>Date<span className="ta">தேதி</span></th><th>Mode<span className="ta">முறை</span></th>
              <th>Note<span className="ta">குறிப்பு</span></th><th className="num">Amount<span className="ta">ரூ.</span></th><th />
            </tr></thead>
            <tbody>
              {s.advances.map((a, i) => {
                const base = `advances.${i}`
                return (
                  <tr key={i} data-row={base}>
                    <td className="sl">{grip(base)}{i + 1}.</td>
                    <td style={{ minWidth: 128 }}>{date(`${base}.date`, 'Advance date')}</td>
                    <td style={{ minWidth: 170 }}>
                      <select data-p={`${base}.mode`} aria-label="Mode" value={a.mode} onChange={(e) => set(`${base}.mode`, e.target.value)}>
                        {ADV_MODES.map((m) => <option key={m[0]} value={m[0]}>{T(m[0], m[1])}</option>)}
                        {!ADV_MODES.some((m) => m[0] === a.mode) && <option value={a.mode}>{a.mode}</option>}
                      </select>
                    </td>
                    <td style={{ minWidth: 120 }}>{inp(`${base}.note`, { ph: T('Note', 'குறிப்பு'), al: 'Note', sug: 'note' })}</td>
                    <td style={{ minWidth: 96 }}>{inp(`${base}.amount`, { n: true, al: 'Amount' })}</td>
                    <td>{del(base, 'Remove advance')}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot><tr className="drv">
              <td colSpan={4}><B en="Rent collected by driver (from loads)" ta="டிரைவர் வசூல் வாடகை (லோடு)" /></td>
              <td className="num">{inr(r.drvRecv)}</td><td />
            </tr></tfoot>
          </table>
        )}
      </div>
      <div className="secfoot">
        <button type="button" className="ghost" onClick={() => addRow('advances')}><B en="Add advance" ta="அட்வான்ஸ் சேர்" /></button>
        <span className="note"><B en="Rent the driver collects is entered in Rent payments and added here by itself" ta="டிரைவர் வசூல் வாடகை, வாடகை வசூல் பகுதியில் போட்டால் இங்கே தானாக சேரும்" /></span>
      </div>
      <div className="ledger">
        <div className="r"><span><B en="GPay / cash advances" ta="ஜிபே / ரொக்கம்" /></span><span className="num">{inr(r.advManual)}</span></div>
        <div className="r"><span><B en="Rent collected by driver (from loads)" ta="டிரைவர் வசூல் வாடகை (லோடு)" /></span><span className="num">{inr(r.drvRecv)}</span></div>
        <div className="r tot"><span><B en="Total advance" ta="மொத்த அட்வான்ஸ்" /></span><span className="num">{inr(r.advance)}</span></div>
      </div>
    </div>
  )

  // ---------- header actions ----------
  const pdf = async () => {
    setPdfBusy(true)
    try {
      await downloadPdf(s)
      toast('PDF saved / PDF சேமிக்கப்பட்டது')
    } catch (e) {
      console.error('PDF failed', e)
      toast('Could not make the PDF / PDF உருவாக்க முடியவில்லை')
    } finally {
      setPdfBusy(false)
    }
  }
  const copy = () => {
    const text = summaryText(s)
    if (!navigator.clipboard) { setCopyText(text); return }
    navigator.clipboard.writeText(text).then(() => toast('Copied / நகலெடுக்கப்பட்டது'), () => setCopyText(text))
  }
  const nextSheet = () => {
    const c = nextSheetFor(s, book.sheets)
    mutate((b) => { b.sheets.push(c) })
    router.push(`/dashboard/sheets/${c.id}`)
    toast('New sheet for the same vehicle / அதே வண்டிக்கு புதிய ஷீட்')
  }
  const deleteSheet = () => {
    mutate((b) => { b.sheets = b.sheets.filter((x) => x.id !== s.id) })
    router.push('/dashboard/sheets')
    toast('Sheet deleted / ஷீட் நீக்கப்பட்டது')
  }

  const onPointerDown = (e: React.PointerEvent) => {
    const h = (e.target as HTMLElement).closest<HTMLElement>('.grip')
    if (!h) return
    e.preventDefault()
    const ks = h.dataset.drag!.split('.')
    const from = +ks.pop()!
    const row = h.closest<HTMLElement>('[data-row]')!
    drag.current = { list: ks.join('.'), from, to: from, row, id: e.pointerId }
    row.classList.add('dragging')
    document.body.classList.add('is-dragging')
    try { h.setPointerCapture(e.pointerId) } catch { /* not supported */ }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || e.pointerId !== d.id) return
    e.preventDefault()
    const rows = [...root.current!.querySelectorAll<HTMLElement>('[data-row]')].filter((x) => {
      const k = x.dataset.row!.split('.'); k.pop(); return k.join('.') === d.list
    })
    let to = rows.length - 1
    for (let i = 0; i < rows.length; i++) {
      const b = rows[i].getBoundingClientRect()
      if (e.clientY < b.top + b.height / 2) { to = i; break }
    }
    dgClear()
    const rb = rows[to].getBoundingClientRect()
    const before = e.clientY < rb.top + rb.height / 2
    rows[to].classList.add(before ? 'drop-before' : 'drop-after')
    let idx = before ? to : to + 1
    if (idx > d.from) idx--
    d.to = idx
    if (e.clientY < 60) window.scrollBy(0, -12)
    else if (e.clientY > window.innerHeight - 60) window.scrollBy(0, 12)
  }
  const onPointerEnd = (e: React.PointerEvent, cancel = false) => {
    const d = drag.current
    if (!d || e.pointerId !== d.id) return
    drag.current = null
    dgClear()
    d.row.classList.remove('dragging')
    document.body.classList.remove('is-dragging')
    if (cancel || d.to === d.from) return
    mutate(() => {
      const arr = getPath(s, d.list) as any[]
      const [it] = arr.splice(d.from, 1)
      arr.splice(d.to, 0, it)
    })
    toast('Row moved / வரி மாற்றப்பட்டது')
  }

  // ---------- Enter: apply, flash green, go to the next typing box in the same section ----------
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || e.defaultPrevented) return
    const el = e.target as HTMLInputElement
    if (el.tagName !== 'INPUT' || el.readOnly || el.classList.contains('dt')) return
    e.preventDefault()
    el.classList.remove('flash')
    void el.offsetWidth
    el.classList.add('flash')
    setTimeout(() => el.classList.remove('flash'), 700)
    const box = [...(el.closest('.panel')?.querySelectorAll<HTMLInputElement>('input:not([readonly]):not(.dt)') || [])]
    const next = box[box.indexOf(el) + 1]
    if (next) { next.focus(); next.select() } else el.blur()
  }

  // ---------- empty expense heads fold into one "More expenses" card ----------
  const shownCats = OTHER_CATS.filter((c) => (s.lines[c.k] || []).length)
  const emptyCats = OTHER_CATS.filter((c) => !(s.lines[c.k] || []).length)
  const more = emptyCats.length > 0 && (
    <div className="panel s-red">
      <SecHead icon="receipt" en="More expenses" ta="மேலும் செலவு" />
      <div className="addchips">
        {emptyCats.map((c) => (
          <button type="button" key={c.k} className="addchip" onClick={() => addRow(`lines.${c.k}`)}>+ <B en={c.en} ta={c.ta} /></button>
        ))}
      </div>
    </div>
  )

  // ---------- warnings for this sheet ----------
  const mine = warnings(book.sheets).filter((w) => w.sheetId === s.id)
  const check = mine.length > 0 && (
    <div className="panel s-orange">
      <SecHead icon="warn" en="Check this sheet" ta="இந்த ஷீட்டை சரிபார்க்கவும்" meta={mine.length} />
      <ul className="warns">
        {mine.map((w, i) => (
          <li key={i} className={w.lvl}><b><B en={w.en} ta={w.ta} /></b><span className="note">{w.detail}</span></li>
        ))}
      </ul>
    </div>
  )

  // ---------- live tiles under the title ----------
  const [sEn, sTa] = s.settled ? ['Settled', 'முடிந்தது'] : settleWords(r.settle)
  const tiles = (
    <section className="tiles">
      <div className="tile c-green"><i className="ti"><Icon name="rupee" /></i><div>
        <span className="lbl"><B en="Rent" ta="வாடகை" /></span><b className="num">{inr(r.rent)}</b>
        <span className="note">{r.pending ? <span className="warn"><B en={'Due ' + inr(r.pending)} ta="பாக்கி" /></span> : r.rent ? <span className="ok"><B en="All received" ta="முழுதும் வந்தது" /></span> : '—'}</span>
      </div></div>
      <div className="tile c-red"><i className="ti"><Icon name="receipt" /></i><div>
        <span className="lbl"><B en="Expense" ta="செலவு" /></span><b className="num">{inr(r.expense)}</b>
        <span className="note">{r.rent ? Math.round((r.expense / r.rent) * 100) : 0}% <B en="of rent" ta="வரவில்" /></span>
      </div></div>
      <div className="tile c-blue"><i className="ti"><Icon name="calc" /></i><div>
        <span className="lbl"><B en="Balance" ta="மீதி" /></span><b className={`num ${r.balance < 0 ? 'bad' : ''}`}>{inr(r.balance)}</b>
        <span className="note">{r.days || '—'} <B en="days" ta="நாள்" /> · {r.km ? nf(r.km) + ' km' : '— km'} · {r.mileage ? r.mileage.toFixed(2) : '—'} km/L</span>
      </div></div>
      <div className="tile c-purple"><i className="ti"><Icon name="person" /></i><div>
        <span className="lbl"><B en={sEn} ta={sTa} /></span><b className="num">{inr(Math.abs(r.settle))}</b>
        <span className="note">{s.driver || <B en="No driver" ta="டிரைவர் இல்லை" />}</span>
      </div></div>
    </section>
  )

  // ---------- this month's sheets (27-inch screens) ----------
  const mon = monthOf(s)
  const monthSheets = book.sheets.filter((x) => monthOf(x) === mon).sort((a, b) => (a.from || '').localeCompare(b.from || '') || (a.no || '').localeCompare(b.no || ''))
  const side = (
    <nav className="panel side s-blue" aria-label="This month's trip sheets">
      <SecHead icon="list" en="This month" ta="இந்த மாதம்" meta={monthSheets.length} />
      <div className="side-l">
        {monthSheets.map((x) => (
          <button type="button" key={x.id} className={x.id === s.id ? 'on' : ''} aria-current={x.id === s.id ? 'true' : undefined} onClick={() => router.push(`/dashboard/sheets/${x.id}`)}>
            <span className="side-t"><span className="reg">{x.vehicle || '—'}</span><span className="num">{inr(calc(x).balance)}</span></span>
            <span className="note">{x.no || '—'} · {fmtD(x.from)} – {fmtD(x.to)}</span>
          </button>
        ))}
      </div>
    </nav>
  )

  return (
    <>
      <header className="top">
        <div>
          <button type="button" className="link" onClick={() => router.push('/dashboard/sheets')}>← <B en="All trip sheets" ta="எல்லா ஷீட்" /></button>
          <h1 className="sheet-h">{s.no && <span>{s.no}</span>}{s.vehicle ? <Plate reg={s.vehicle} /> : <B en="New trip sheet" ta="புதிய ஷீட்" />}</h1>
          <div className="sub"><B en="Every number recalculates as you type and saves automatically." ta="டைப் செய்யும்போதே கணக்கு மாறும், தானாக சேமிக்கப்படும்." /></div>
        </div>
        <div className="actions sheet-acts">
          <button type="button" className="btn settle-b" onClick={() => setSettling(true)}><B en="Settle with driver" ta="டிரைவர் கணக்கு முடி" /></button>
          <button type="button" className="ghost" disabled={pdfBusy} onClick={pdf}>{pdfBusy ? <B en="Making PDF…" ta="PDF தயாராகிறது…" /> : <B en="Download PDF" ta="PDF பதிவிறக்கு" />}</button>
          <button type="button" className="ghost" onClick={copy}><B en="Copy for WhatsApp" ta="WhatsApp நகல்" /></button>
          <button type="button" className="ghost" onClick={nextSheet}><B en="Next sheet for this vehicle" ta="அடுத்த ஷீட்" /></button>
          {confirmDel ? (
            <span className="actions">
              <span className="note"><B en="Delete this sheet?" ta="இந்த ஷீட்டை நீக்கவா?" /></span>
              <button type="button" className="ghost danger" onClick={deleteSheet}><B en="Delete" ta="நீக்கு" /></button>
              <button type="button" className="ghost" onClick={() => setConfirmDel(false)}><B en="Keep" ta="வேண்டாம்" /></button>
            </span>
          ) : (
            <button type="button" className="ghost danger" onClick={() => setConfirmDel(true)}><B en="Delete" ta="நீக்கு" /></button>
          )}
        </div>
      </header>
      {tiles}
      <div
        className="editor"
        ref={root}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => onPointerEnd(e)}
        onPointerCancel={(e) => onPointerEnd(e, true)}
      >
        {side}
        <div className="col">
          {check}
          <div className="panel s-blue"><SecHead icon="clipboard" en="Sheet details" ta="ஷீட் விவரம்" />{hdr}</div>
          {loads}
          {payments}
          {diesel}
          <div className="cats">{shownCats.map(catPanel)}{more}</div>
          {bata}
          {advances}
        </div>
        <aside className="sum" id="sum"><SumPanel r={r} /></aside>
      </div>

      <div className="totbar" ref={bar}>
        <span className="tb-bal"><span className="lbl"><B en="Balance" ta="மீதி" /></span><b className={`num ${r.balance < 0 ? 'bad' : ''}`}>{inr(r.balance)}</b></span>
        {s.settled ? <span className="pill done"><B en="Settled" ta="முடிந்தது" /></span>
          : <span className={`pill ${r.settle > 0 ? 'ok' : r.settle < 0 ? 'warn' : 'mute'}`}><B en={sEn} ta={sTa} />{r.settle ? ' ' + inr(Math.abs(r.settle)) : ''}</span>}
        <span className="tb-acts">
          <button type="button" className="ghost" onClick={() => document.getElementById('sum')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><B en="Details" ta="விவரம்" /></button>
          <button type="button" className="btn" onClick={() => setSettling(true)}><B en="Settle" ta="முடி" /></button>
        </span>
      </div>

      {settling && <SettlePane s={s} onClose={() => setSettling(false)} onCopy={copy} />}
      {quick && (
        <QuickAdd
          kind={quick.kind}
          onClose={() => setQuick(null)}
          onAdded={(v) => set(quick.path, v)}
        />
      )}
      {copyText !== null && (
        <Drawer onClose={() => setCopyText(null)}>
          <div className="pane">
            <h3><B en="Copy this summary" ta="இதை நகலெடுக்கவும்" /></h3>
            <textarea readOnly value={copyText} autoFocus onFocus={(e) => e.target.select()} />
            <div className="row"><button type="button" className="ghost" onClick={() => setCopyText(null)}><B en="Close" ta="மூடு" /></button></div>
          </div>
        </Drawer>
      )}
    </>
  )
}

/** Rent received against rent: green when full, orange when part, red outline when nothing yet. */
function RentGot({ rent, got }: { rent: number; got: number }) {
  if (!rent && !got) return null
  const extra = got - rent
  const st = got <= 0 ? 'none' : extra >= 0 ? 'full' : 'part'
  const pctW = rent ? Math.min(100, (got / rent) * 100) : 100
  return (
    <div className={`rgot ${st}`}>
      <span className="num">{inr(got)}</span>
      <span className="rbar" aria-hidden="true"><i style={{ width: pctW + '%' }} /></span>
      <span className="rnote">
        {extra > 0 ? <B en={'+' + inr(extra) + ' extra'} ta="கூடுதல்" />
          : st === 'full' ? <B en="full" ta="முழுதும்" />
          : <B en={'due ' + inr(-extra)} ta="பாக்கி" />}
      </span>
    </div>
  )
}

function SumPanel({ r }: { r: SheetCalc }) {
  const row = (en: string, ta: string, v: number, cls = '') => (
    <div className={`r ${cls}`} key={en + cls}><span><B en={en} ta={ta} /></span><span className="num">{inr(v)}</span></div>
  )
  const exp: [string, string, number][] = ([
    ['Diesel', 'டீசல்', r.cat.diesel], ['Commission', 'கமிஷன்', r.comm], ['Driver bata', 'டிரைவர் படி', r.bata], ['Cleaner bata', 'கிளீனர் படி', r.cleanerBata],
    ['Loading', 'ஏற்றுக்கூலி', r.loading], ['Unloading', 'இறக்குக்கூலி', r.unloading], ['Other', 'இதர செலவு', r.cat.other], ['RTO', 'ஆர்.டி.ஓ', r.cat.rto],
    ['PC', 'பி.சி', r.cat.pc], ['Extra bata', 'பின்படி', r.cat.extra], ['Toll', 'பாலம்', r.cat.toll], ['Naka / checkpost', 'நாக்கா', r.cat.naka],
    ['Workshop', 'பட்டறை செலவு', r.cat.workshop],
  ] as [string, string, number][]).filter((x) => x[2])
  return (
    <>
      <div className="panel s-blue">
        <SecHead icon="calc" en="Sheet total" ta="மொத்தம்" />
        <div className="ledger">
          <div className="grp"><B en="Income" ta="வரவு" /></div>
          {row('Total rent', 'மொத்த வாடகை', r.rent, 'tot first')}
          {row('Received in account / cheque', 'அக்கவுண்ட் / செக்', r.accRecv, 'sm in')}
          {row('Collected by driver', 'டிரைவர் வசூல்', r.drvRecv, 'sm in')}
          <div className="r sm in"><span><B en="Still to come" ta="வர வேண்டியது" /></span><span className={`num ${r.pending ? 'warn' : 'ok'}`}>{inr(r.pending)}</span></div>
          <div className="grp"><B en="Expenses" ta="செலவு" /></div>
          {exp.length ? exp.map((x) => row(x[0], x[1], x[2], 'sm')) : <div className="r sm"><span><B en="No expenses yet" ta="செலவு இல்லை" /></span></div>}
          {row('Total expense', 'மொத்த செலவு', r.expense, 'tot')}
          <div className="grp"><B en="Result" ta="முடிவு" /></div>
          <div className="r sm"><span><B en="Rent − expense" ta="வரவு − செலவு" /></span><span className="num">{inr(r.rent)} − {inr(r.expense)}</span></div>
          <div className="r big"><span><B en="Balance" ta="மீதி" /></span><span className={`num ${r.balance < 0 ? 'bad' : 'ok'}`}>{inr(r.balance)}</span></div>
          <div className="r sm"><span><B en="Per day" ta="நாள் மீதி" /> · {r.days || '—'} <B en="days" ta="நாள்" /></span><span className="num">{r.days ? inr(r.perDay) : '—'}</span></div>
          <div className="r sm"><span><B en="Per km" ta="1 கி.மீ. மீதி" /> · {r.km ? nf(r.km) + ' km' : '—'}</span><span className="num">{r.perKm ? '₹' + r.perKm.toFixed(2) : '—'}</span></div>
          <div className="r sm"><span><B en="Mileage" ta="மைலேஜ்" /> · {nf(r.litres)} L</span><span className="num">{r.mileage ? r.mileage.toFixed(2) + ' km/L' : '—'}</span></div>
        </div>
      </div>
      <div className="panel s-purple">
        <SecHead icon="person" en="Driver account" ta="டிரைவர் கணக்கு" />
        <div className="ledger"><DriverRows r={r} /></div>
        <div className="verdict">
          <span>{r.settle > 0 ? 'Pay to driver' : r.settle < 0 ? 'Driver returns' : 'Even'}<small className="ta">{r.settle > 0 ? 'டிரைவருக்கு கொடுக்கணும்' : r.settle < 0 ? 'டிரைவர் திருப்பி தரணும்' : 'சரி'}</small></span>
          <span className={`num ${r.settle > 0 ? 'ok' : r.settle < 0 ? 'warn' : ''}`}>{inr(Math.abs(r.settle))}</span>
        </div>
      </div>
    </>
  )
}
