'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { fmtDate, MON, MON_TA, T, today } from '@/lib/convoy/format'
import { B } from './ui'

const WD: [string, string][] = [['Su', 'ஞா'], ['Mo', 'தி'], ['Tu', 'செ'], ['We', 'பு'], ['Th', 'வி'], ['Fr', 'வெ'], ['Sa', 'ச']]

/** Read-only field that opens a one-tap calendar; value is an ISO date ('' when empty). */
export function DateInput({ value, onChange, id, label }: { value: string; onChange: (iso: string) => void; id?: string; label: string }) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={inputRef}
        id={id}
        className="dt"
        readOnly
        value={fmtDate(value)}
        placeholder={T('Pick date', 'தேதி')}
        aria-label={label}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true) } }}
      />
      {open && (
        <Calendar
          anchor={inputRef.current!}
          value={value}
          onPick={(iso) => { setOpen(false); onChange(iso) }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

function Calendar({ anchor, value, onPick, onClose }: { anchor: HTMLElement; value: string; onPick: (iso: string) => void; onClose: () => void }) {
  const start = (value || today()).split('-').map(Number)
  const [ym, setYm] = useState({ y: start[0], m: start[1] - 1 })
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: -9999, top: 0 })

  useLayoutEffect(() => {
    const r = anchor.getBoundingClientRect()
    const el = ref.current!
    const w = el.offsetWidth
    const h = el.offsetHeight
    let top = r.bottom + 6
    if (top + h > window.innerHeight - 8 && r.top - h - 6 > 8) top = r.top - h - 6
    setPos({ left: Math.min(Math.max(8, r.left), window.innerWidth - w - 8), top: Math.max(8, top) })
  }, [anchor])

  useEffect(() => {
    const down = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node) && e.target !== anchor) onClose()
    }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const scroll = () => { if (!ref.current?.matches(':hover')) onClose() }
    document.addEventListener('pointerdown', down, true)
    document.addEventListener('keydown', key)
    window.addEventListener('scroll', scroll, { passive: true })
    return () => {
      document.removeEventListener('pointerdown', down, true)
      document.removeEventListener('keydown', key)
      window.removeEventListener('scroll', scroll)
    }
  }, [anchor, onClose])

  const { y, m } = ym
  const first = new Date(Date.UTC(y, m, 1)).getUTCDay()
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  const tod = today()
  const move = (d: number) => setYm(({ y, m }) => {
    const n = m + d
    return n < 0 ? { y: y - 1, m: 11 } : n > 11 ? { y: y + 1, m: 0 } : { y, m: n }
  })

  return (
    <div className="cal" role="dialog" aria-label="Pick a date" ref={ref} style={pos}>
      <div className="cal-h">
        <button type="button" onClick={() => move(-1)} aria-label="Previous month">‹</button>
        <b>{MON[m]} {y} <span className="ta">{MON_TA[m]}</span></b>
        <button type="button" onClick={() => move(1)} aria-label="Next month">›</button>
      </div>
      <div className="cal-g">
        {WD.map((w) => <i key={w[0]}>{w[0]}<br /><span className="ta">{w[1]}</span></i>)}
        {Array.from({ length: first }, (_, i) => <span key={'b' + i} />)}
        {Array.from({ length: days }, (_, i) => {
          const v = `${y}-${String(m + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
          return <button type="button" key={v} className={`${v === value ? 'sel' : ''} ${v === tod ? 'tod' : ''}`} onClick={() => onPick(v)}>{i + 1}</button>
        })}
      </div>
      <div className="cal-f">
        <button type="button" onClick={() => onPick(tod)}><B en="Today" ta="இன்று" /></button>
        <button type="button" onClick={() => onPick('')}><B en="Clear" ta="அழி" /></button>
      </div>
    </div>
  )
}

/**
 * Text field with its own suggestion box: past entries, most used first. The box closes as
 * soon as one is picked and hides once the text matches a suggestion exactly.
 */
export function SuggestInput({ value, onChange, source, placeholder, label, inputProps }: {
  value: string
  onChange: (v: string) => void
  /** Called on focus so the list reflects every sheet at that moment. */
  source: () => string[]
  placeholder?: string
  label: string
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [all, setAll] = useState<string[] | null>(null)
  const [picked, setPicked] = useState(false)
  const q = value.trim().toLowerCase()
  const items = all ? all.filter((v) => { const l = v.toLowerCase(); return l !== q && (!q || l.includes(q)) }).slice(0, 6) : []
  const [pos, setPos] = useState<{ left: number; top: number; minWidth: number } | null>(null)
  const box = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!all || !items.length || !ref.current) { setPos(null); return }
    const place = () => {
      const r = ref.current!.getBoundingClientRect()
      const h = box.current?.offsetHeight || 0
      const w = box.current?.offsetWidth || r.width
      let top = r.bottom + 4
      if (top + h > window.innerHeight - 8 && r.top - h - 4 > 8) top = r.top - h - 4
      setPos({ left: Math.min(Math.max(8, r.left), window.innerWidth - w - 8), top, minWidth: Math.max(160, r.width) })
    }
    place()
    window.addEventListener('scroll', place, { passive: true })
    return () => window.removeEventListener('scroll', place)
  }, [all, items.length, value])

  return (
    <>
      <input
        {...inputProps}
        ref={ref}
        value={value}
        placeholder={placeholder}
        aria-label={label}
        autoComplete="off"
        autoCorrect="off"
        className={picked ? 'picked' : undefined}
        onFocus={() => setAll(source())}
        onBlur={() => setTimeout(() => setAll(null), 120)}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') setAll(null); inputProps?.onKeyDown?.(e) }}
      />
      {all && items.length > 0 && (
        <div className="sug" role="listbox" ref={box} style={pos || { left: -9999, top: 0 }}>
          {items.map((v) => (
            <button
              key={v}
              type="button"
              role="option"
              aria-selected={false}
              onPointerDown={(e) => {
                e.preventDefault()
                onChange(v)
                setAll(null)
                setPicked(true)
                setTimeout(() => setPicked(false), 900)
                const next = ref.current?.closest('tr,.lr')?.querySelector<HTMLInputElement>('input.n')
                if (next && !next.value) next.focus()
                else ref.current?.blur()
              }}
            >
              {v}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
