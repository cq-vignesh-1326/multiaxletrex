'use client'

import { useEffect, useRef, useState } from 'react'
import { monthOf } from '@/lib/convoy/calc'
import { inr, monLbl, T } from '@/lib/convoy/format'
import type { Sheet } from '@/lib/convoy/types'
import { useBook } from './BookProvider'

/** English label with its Tamil line. */
export function B({ en, ta }: { en: React.ReactNode; ta: string }) {
  return <>{en} <span className="ta">{ta}</span></>
}

export function Head({ title, sub, children }: { title: React.ReactNode; sub: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="top">
      <div><h1>{title}</h1><div className="sub">{sub}</div></div>
      <div className="actions">{children}</div>
    </header>
  )
}

export function SettleText({ v }: { v: number }) {
  if (v > 0) return <span className="ok"><B en="Pay driver" ta="டிரைவருக்கு கொடு" /> {inr(v)}</span>
  if (v < 0) return <span className="warn"><B en="Driver returns" ta="திருப்பி தரணும்" /> {inr(-v)}</span>
  return <span className="mute"><B en="Even" ta="சரி" /></span>
}
export const SettledPill = () => <span className="pill mute"><B en="Settled" ta="முடிந்தது" /></span>

// ---------- month filter shared by overview, sheets and reports ----------
export function useMonth() {
  const { book, monthF, setMonthF } = useBook()
  const months = [...new Set(book.sheets.map(monthOf))].sort().reverse()
  const inMonth = (s: Sheet) => monthF === 'All' || monthOf(s) === monthF
  const monthName = monthF === 'All' ? T('all months', 'எல்லா மாதமும்') : monLbl(monthF)
  return { months, monthF, setMonthF, inMonth, monthName }
}

export function MonthSelect({ id }: { id: string }) {
  const { months, monthF, setMonthF } = useMonth()
  return (
    <>
      <label className="note" htmlFor={id}><B en="Month" ta="மாதம்" /></label>
      <select id={id} value={monthF} onChange={(e) => setMonthF(e.target.value)}>
        <option value="All">{T('All months', 'எல்லா மாதமும்')}</option>
        {months.map((m) => <option key={m} value={m}>{monLbl(m)}</option>)}
      </select>
    </>
  )
}

/** Destructive button that needs a second tap within 3.5 s. */
export function ConfirmButton({ onConfirm, children, className = 'ghost danger' }: { onConfirm: () => void; children: React.ReactNode; className?: string }) {
  const [armed, setArmed] = useState(false)
  const t = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => () => clearTimeout(t.current), [])
  return (
    <button
      type="button"
      className={className + (armed ? ' armed' : '')}
      onClick={(e) => {
        e.stopPropagation()
        if (!armed) {
          setArmed(true)
          t.current = setTimeout(() => setArmed(false), 3500)
          return
        }
        clearTimeout(t.current)
        setArmed(false)
        onConfirm()
      }}
    >
      {armed ? <B en="Tap again to confirm" ta="மீண்டும் தட்டவும்" /> : children}
    </button>
  )
}

/** Right-hand slide-over panel. */
export function Drawer({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="drawer" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      {children}
    </div>
  )
}

export const CancelBtn = ({ onClick }: { onClick: () => void }) => (
  <button type="button" className="ghost" onClick={onClick}><B en="Cancel" ta="ரத்து" /></button>
)
