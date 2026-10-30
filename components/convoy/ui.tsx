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
  if (v > 0) return <span className="pill ok"><B en="Pay driver" ta="டிரைவருக்கு கொடு" /> {inr(v)}</span>
  if (v < 0) return <span className="pill warn"><B en="Driver returns" ta="திருப்பி தரணும்" /> {inr(-v)}</span>
  return <span className="pill mute"><B en="Even" ta="சரி" /></span>
}
// ---------- section look: coloured badge with a white line icon ----------
const ICONS = {
  clipboard: <><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4h6v3H9zM9 12h6M9 16h4" /></>,
  truck: <><path d="M2 6h11v10H2zM13 10h4l3 3v3h-7" /><circle cx="6" cy="17.5" r="1.8" /><circle cx="16.5" cy="17.5" r="1.8" /></>,
  rupee: <path d="M7 5h10M7 9.5h10M7 5h3.5a4.5 4.5 0 0 1 0 9H7l8 6" />,
  fuel: <><path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M6 8h6" /><path d="M14 10h2a2 2 0 0 1 2 2v4a1.5 1.5 0 0 0 3 0V8l-3-3" /></>,
  receipt: <path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3" />,
  person: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4.5 4.5-6.5 8-6.5s7 2 8 6.5" /></>,
  calc: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 11.5h.01M12 11.5h.01M16 11.5h.01M8 15.5h.01M12 15.5h.01M16 15.5v2.5" /></>,
  warn: <path d="M12 3 2 20h20zM12 10v4.5M12 17.5h.01" />,
  list: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
}
export type IconName = keyof typeof ICONS
export const Icon = ({ name }: { name: IconName }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[name]}</svg>
)

/** Section title: colour badge + bilingual title + optional total in the section colour. */
export function SecHead({ icon, en, ta, meta, metaId }: { icon: IconName; en: React.ReactNode; ta: string; meta?: React.ReactNode; metaId?: string }) {
  return (
    <h2>
      <i className="badge"><Icon name={icon} /></i>
      <span><B en={en} ta={ta} /></span>
      {meta != null && <span className="meta" id={metaId}>{meta}</span>}
    </h2>
  )
}

/** Vehicle number drawn as a yellow commercial number plate. */
export const Plate = ({ reg }: { reg: string }) => <span className="plate">{reg}</span>

export const SettledPill = () => <span className="pill done"><B en="Settled" ta="முடிந்தது" /></span>

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
export function Drawer({ onClose, children, up }: { onClose: () => void; children: React.ReactNode; up?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className={up ? 'drawer up' : 'drawer'} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      {children}
    </div>
  )
}

export const CancelBtn = ({ onClick }: { onClick: () => void }) => (
  <button type="button" className="ghost" onClick={onClick}><B en="Cancel" ta="ரத்து" /></button>
)

export const CloseX = ({ onClick }: { onClick: () => void }) => (
  <button type="button" className="closex" onClick={onClick} aria-label="Close / மூடு">×</button>
)
