'use client'

import { useEffect, useRef, useState } from 'react'
import { CATS, ADV_MODES, PMODES } from '@/lib/convoy/constants'
import { fmtD, inr, num, T, today } from '@/lib/convoy/format'
import { lastDieselRate, readQuick, type QFill, type QType } from '@/lib/convoy/smart'
import type { CatKey, PaidBy, PayMode, Sheet } from '@/lib/convoy/types'
import { useBook } from './BookProvider'
import { DateInput } from './inputs'
import { B, CloseX, Drawer } from './ui'

const TYPES: [QType, string, string][] = [
  ['diesel', 'Diesel', 'டீசல்'], ['toll', 'Toll', 'பாலம்'], ['advance', 'Advance', 'அட்வான்ஸ்'], ['rent', 'Rent received', 'வாடகை வசூல்'],
  ['rto', 'RTO', 'ஆர்.டி.ஓ'], ['pc', 'PC (police)', 'பி.சி'], ['naka', 'Naka / checkpost', 'நாக்கா'], ['other', 'Other expense', 'இதர செலவு'],
  ['extra', 'Extra bata', 'பின்படி'], ['workshop', 'Workshop', 'பட்டறை'],
]
// the four advance modes a person picks; "Carried balance" is only written by settlement
const QADV = ADV_MODES.slice(0, 4)

interface Form {
  date: string; desc: string; litres: string; rate: string; amount: string; by: PaidBy
  advMode: string; note: string; load: number; payMode: PayMode
}

const due = (s: Sheet, i: number) => {
  const l = s.loads[i]
  return num(l.rent) - (l.payments || []).reduce((a, p) => a + num(p.amount), 0)
}

/** Open sheet if any, else the newest sheet not yet settled, else the newest. */
function defaultSheet(sheets: Sheet[], openId: string | null) {
  if (openId && sheets.some((s) => s.id === openId)) return openId
  const byNew = [...sheets].sort((a, b) => (b.from || b.to || '').localeCompare(a.from || a.to || '') || (b.created || 0) - (a.created || 0))
  return (byNew.find((s) => !s.settled) || byNew[0])?.id || ''
}

export function QuickFab({ openId }: { openId: string | null }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className="fab" onClick={() => setOpen(true)} aria-label="Quick add / விரைவு பதிவு">
        <span aria-hidden="true">+</span><span className="fab-t"><B en="Quick add" ta="விரைவு பதிவு" /></span>
      </button>
      {open && <QuickPane openId={openId} onClose={() => setOpen(false)} />}
    </>
  )
}

function QuickPane({ openId, onClose }: { openId: string | null; onClose: () => void }) {
  const { book, mutate, toast } = useBook()
  const [sheetId, setSheetId] = useState(() => defaultSheet(book.sheets, openId))
  const [type, setType] = useState<QType>('diesel')
  const s = book.sheets.find((x) => x.id === sheetId)
  const [f, setF] = useState<Form>(() => blank('diesel', s))
  const [text, setText] = useState('')
  const [msg, setMsg] = useState<React.ReactNode>('')
  const [err, setErr] = useState<React.ReactNode>('')
  const [glow, setGlow] = useState<Set<string>>(new Set())
  const box = useRef<HTMLDivElement>(null)

  function blank(t: QType, sh: Sheet | undefined): Form {
    const fm: Form = { date: today(), desc: '', litres: '', rate: '', amount: '', by: 'driver', advMode: 'GPay', note: '', load: 0, payMode: 'account' }
    if (t === 'diesel') {
      fm.by = 'office'
      fm.rate = String(lastDieselRate(sh?.vehicle || '', book.sheets))
    } else if (t === 'rent' && sh) {
      const i = sh.loads.findIndex((_, k) => num(sh.loads[k].rent) && due(sh, k) > 0)
      fm.load = i >= 0 ? i : Math.max(0, sh.loads.findIndex((l) => num(l.rent)))
      if (i >= 0) fm.amount = String(due(sh, i))
    } else if (t !== 'advance') {
      fm.by = CATS.find((c) => c.k === t)!.by
    }
    return fm
  }

  const reset = (t: QType, sh = s) => { setType(t); setF(blank(t, sh)); setErr('') }
  const set = (k: keyof Form, v: string | number) => setF((o) => {
    const n = { ...o, [k]: v } as Form
    if ((k === 'litres' || k === 'rate') && num(n.litres) && num(n.rate)) n.amount = String(Math.round(num(n.litres) * num(n.rate)))
    if (k === 'load' && s) { const d = due(s, +v); n.amount = d > 0 ? String(d) : '' }
    return n
  })

  // glow fades on its own
  useEffect(() => {
    if (!glow.size) return
    const t = setTimeout(() => setGlow(new Set()), 1600)
    return () => clearTimeout(t)
  }, [glow])

  const fill = () => {
    if (!text.trim()) return
    const q: QFill = readQuick(text)
    const t = q.type || type
    const base = t !== type ? blank(t, s) : { ...f }
    const lit: string[] = []
    const put = (k: keyof Form, v: string | number | undefined) => { if (v !== undefined && v !== '') { (base as unknown as Record<string, unknown>)[k] = String(v); lit.push(k) } }
    put('date', q.date)
    put('litres', q.litres)
    put('rate', q.rate)
    put('amount', q.amount ?? (q.litres && (q.rate || num(base.rate)) ? Math.round(q.litres * (q.rate || num(base.rate))) : undefined))
    if (t === 'advance') { put('advMode', q.advMode); put('note', q.place) }
    else if (t === 'rent') { put('payMode', q.payMode); put('note', q.place) }
    else { put('by', q.by); put('desc', q.place) }
    setType(t)
    setF(base)
    setGlow(new Set(lit.concat(t !== type ? ['type'] : [])))
    setMsg(lit.length ? <span className="ok"><B en="Filled in · check and save" ta="நிரப்பப்பட்டது · சரிபார்த்து சேமிக்கவும்" /></span>
      : <span className="warn"><B en="Could not read that. Type the amount below." ta="புரியவில்லை. கீழே தொகை போடவும்." /></span>)
  }

  const save = (again: boolean) => {
    if (!s) { setErr(<B en="Pick a trip sheet first." ta="முதலில் ஷீட் தேர்வு செய்யவும்." />); return }
    const amt = num(f.amount)
    if (!amt) { setErr(<B en="Enter the amount." ta="தொகை போடவும்." />); return }
    if (type === 'rent' && !num(s.loads[f.load]?.rent)) { setErr(<B en="This sheet has no load with rent." ta="இந்த ஷீட்டில் வாடகை லோடு இல்லை." />); return }
    const label = TYPES.find((x) => x[0] === type)!
    mutate(() => {
      if (type === 'advance') s.advances.push({ date: f.date, mode: f.advMode, amount: amt, note: f.note })
      else if (type === 'rent') {
        const l = s.loads[f.load]
        l.payments = l.payments || []
        l.payments.push({ date: f.date, mode: f.payMode, amount: amt, note: f.note })
      } else {
        const k = type as CatKey
        s.lines[k] = s.lines[k] || []
        s.lines[k].push({ date: f.date, desc: f.desc, amount: amt, by: f.by, litres: type === 'diesel' ? f.litres : '', rate: type === 'diesel' ? f.rate : '' })
      }
    })
    toast(`${label[1]} ${inr(amt)} added to ${s.no || s.vehicle || 'sheet'} / ${label[2]} சேர்க்கப்பட்டது`)
    setText('')
    setMsg('')
    if (again) {
      reset(type)
      setTimeout(() => box.current?.querySelector<HTMLInputElement>('input.n:not([readonly]), input:not(.dt)')?.focus(), 0)
    } else onClose()
  }

  const enterTo = (next: string | 'save') => (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (next === 'save') save(false)
    else box.current?.querySelector<HTMLInputElement>(`#${next}`)?.focus()
  }
  const g = (k: string) => (glow.has(k) ? 'glow' : undefined)
  const chips = <V,>(val: V, opts: [V, string, string][], on: (v: V) => void, k: string) => (
    <div className={`chips ${g(k) || ''}`} role="radiogroup">
      {opts.map((o) => (
        <button type="button" key={String(o[0])} role="radio" aria-checked={val === o[0]} className={val === o[0] ? 'on' : ''} onClick={() => on(o[0])}>
          <B en={o[1]} ta={o[2]} />
        </button>
      ))}
    </div>
  )
  const byChips = chips<PaidBy>(f.by, [['driver', 'Driver', 'டிரைவர்'], ['office', 'Office', 'ஆபிஸ்']], (v) => set('by', v), 'by')
  const isExp = type !== 'diesel' && type !== 'advance' && type !== 'rent'
  const cat = isExp ? CATS.find((c) => c.k === type)! : null
  const rentLoads = s ? s.loads.map((l, i) => ({ l, i })).filter(({ l }) => num(l.rent)) : []
  const sorted = [...book.sheets].sort((a, b) => (b.from || b.to || '').localeCompare(a.from || a.to || '') || (b.created || 0) - (a.created || 0))

  return (
    <Drawer onClose={onClose} up>
      <div className="pane quick" ref={box}>
        <div className="pane-h">
          <h3><B en="Quick add" ta="விரைவு பதிவு" /></h3>
          <CloseX onClick={onClose} />
        </div>

        <div className="smart">
          <div className="smart-row">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); fill() } }}
              placeholder={T('Type or speak it', 'டைப் செய்யவும் அல்லது பேசவும்')}
              aria-label="Type or speak the entry"
              autoComplete="off"
            />
            <button type="button" className="btn" onClick={fill}><B en="Fill" ta="நிரப்பு" /></button>
          </div>
          <div className="note">{msg || <B en='e.g. "diesel 150 L 94.5 Avinashi cash". Use the mic on the phone keyboard to speak in Tamil or English.' ta="போன் கீபோர்டு மைக்கில் தமிழ் / ஆங்கிலத்தில் பேசலாம்" />}</div>
        </div>

        <div className="f">
          <label htmlFor="qe-sheet"><B en="Trip sheet" ta="டிரிப் ஷீட்" /></label>
          {book.sheets.length ? (
            <select id="qe-sheet" value={sheetId} onChange={(e) => { setSheetId(e.target.value); reset(type, book.sheets.find((x) => x.id === e.target.value)) }}>
              {sorted.map((x) => (
                <option key={x.id} value={x.id}>{(x.no || '—') + ' · ' + (x.vehicle || T('No vehicle', 'வண்டி இல்லை')) + ' · ' + fmtD(x.from) + (x.settled ? ' · ' + T('Settled', 'முடிந்தது') : '')}</option>
              ))}
            </select>
          ) : <div className="note"><B en="Make a trip sheet first." ta="முதலில் ஒரு ஷீட் உருவாக்கவும்." /></div>}
        </div>

        <div className="f">
          <span className="flabel"><B en="What is it?" ta="என்ன பதிவு?" /></span>
          {chips<QType>(type, TYPES, (v) => reset(v), 'type')}
        </div>

        {type === 'diesel' && (
          <>
            <div className="qgrid">
              <div className="f"><label htmlFor="qe-l"><B en="Litres" ta="லிட்டர்" /></label><input id="qe-l" className={`n ${g('litres') || ''}`} inputMode="decimal" value={f.litres} onChange={(e) => set('litres', e.target.value)} onKeyDown={enterTo('qe-r')} /></div>
              <div className="f"><label htmlFor="qe-r"><B en="Rate" ta="விலை" /></label><input id="qe-r" className={`n ${g('rate') || ''}`} inputMode="decimal" value={f.rate} onChange={(e) => set('rate', e.target.value)} onKeyDown={enterTo('qe-a')} /></div>
              <div className="f"><label htmlFor="qe-a"><B en="Amount" ta="தொகை" /></label><input id="qe-a" className={`n ${g('amount') || ''}`} inputMode="decimal" value={f.amount} onChange={(e) => set('amount', e.target.value)} onKeyDown={enterTo('save')} /></div>
            </div>
            <div className="f"><label htmlFor="qe-d"><B en="Bunk / place" ta="பங்க் / ஊர்" /></label><input id="qe-d" className={g('desc')} value={f.desc} onChange={(e) => set('desc', e.target.value)} onKeyDown={enterTo('save')} /></div>
            <div className="f"><span className="flabel"><B en="Paid by" ta="யார் கொடுத்தார்" /></span>{byChips}</div>
          </>
        )}

        {type === 'advance' && (
          <>
            <div className="f"><label htmlFor="qe-a"><B en="Amount" ta="தொகை" /></label><input id="qe-a" className={`n ${g('amount') || ''}`} inputMode="decimal" value={f.amount} onChange={(e) => set('amount', e.target.value)} onKeyDown={enterTo('save')} /></div>
            <div className="f"><span className="flabel"><B en="How given" ta="எப்படி" /></span>{chips<string>(f.advMode, QADV.map((m) => [m[0], m[0], m[1]]), (v) => set('advMode', v), 'advMode')}</div>
            <div className="f"><label htmlFor="qe-n"><B en="Note" ta="குறிப்பு" /></label><input id="qe-n" className={g('note')} value={f.note} onChange={(e) => set('note', e.target.value)} onKeyDown={enterTo('save')} /></div>
          </>
        )}

        {type === 'rent' && (rentLoads.length ? (
          <>
            <div className="f">
              <label htmlFor="qe-load"><B en="Which load" ta="எந்த லோடு" /></label>
              <select id="qe-load" value={f.load} onChange={(e) => set('load', +e.target.value)}>
                {rentLoads.map(({ l, i }) => (
                  <option key={i} value={i}>{`${i + 1}. ${l.from || '—'} → ${l.to || '—'} · ${T('Rent', 'வாடகை')} ${inr(num(l.rent))} · ${T('Due', 'பாக்கி')} ${inr(Math.max(0, due(s!, i)))}`}</option>
                ))}
              </select>
            </div>
            <div className="f"><label htmlFor="qe-a"><B en="Amount" ta="தொகை" /></label><input id="qe-a" className={`n ${g('amount') || ''}`} inputMode="decimal" value={f.amount} onChange={(e) => set('amount', e.target.value)} onKeyDown={enterTo('save')} /></div>
            <div className="f"><span className="flabel"><B en="How received" ta="எப்படி" /></span>{chips<PayMode>(f.payMode, PMODES, (v) => set('payMode', v), 'payMode')}</div>
            <div className="f"><label htmlFor="qe-n"><B en="Remarks" ta="குறிப்பு" /></label><input id="qe-n" className={g('note')} value={f.note} onChange={(e) => set('note', e.target.value)} onKeyDown={enterTo('save')} placeholder={T('e.g. Chq 004512, SBI', 'உதா. செக் 004512')} /></div>
          </>
        ) : <div className="note warn"><B en="This sheet has no load with rent yet. Add the load on the sheet first." ta="இந்த ஷீட்டில் வாடகை லோடு இல்லை. முதலில் லோடு சேர்க்கவும்." /></div>)}

        {cat && (
          <>
            <div className="f"><label htmlFor="qe-d"><B en={cat.place ? 'Location' : 'Details'} ta={cat.place ? 'இடம்' : 'விவரம்'} /></label><input id="qe-d" className={g('desc')} value={f.desc} onChange={(e) => set('desc', e.target.value)} onKeyDown={enterTo('save')} /></div>
            <div className="f"><label htmlFor="qe-a"><B en="Amount" ta="தொகை" /></label><input id="qe-a" className={`n ${g('amount') || ''}`} inputMode="decimal" value={f.amount} onChange={(e) => set('amount', e.target.value)} onKeyDown={enterTo('save')} /></div>
            <div className="f"><span className="flabel"><B en="Paid by" ta="யார் கொடுத்தார்" /></span>{byChips}</div>
          </>
        )}

        <div className="f"><label htmlFor="qe-date"><B en="Date" ta="தேதி" /></label><span className={g('date')} style={{ display: 'contents' }}><DateInput id="qe-date" value={f.date} onChange={(v) => set('date', v)} label="Date" /></span></div>

        <div className="err" role="alert">{err}</div>
        <div className="row">
          <button type="button" className="ghost" onClick={() => save(true)}><B en="Save & add another" ta="சேமித்து அடுத்தது" /></button>
          <button type="button" className="btn" onClick={() => save(false)}><B en="Save" ta="சேமி" /></button>
        </div>
      </div>
    </Drawer>
  )
}
