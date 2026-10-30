'use client'

import { useRouter } from 'next/navigation'
import { calc, summaryText, type SheetCalc } from '@/lib/convoy/calc'
import { inr, today } from '@/lib/convoy/format'
import { nextOpenSheet, nextSheetFor } from '@/lib/convoy/smart'
import type { Sheet } from '@/lib/convoy/types'
import { useBook } from './BookProvider'
import { B, CloseX, Drawer, Plate } from './ui'

/** Driver-account breakdown shared by the totals column and the settle panel. */
export function DriverRows({ r }: { r: SheetCalc }) {
  const row = (en: string, ta: string, v: number, cls = '') => (
    <div className={`r ${cls}`} key={en + cls}><span><B en={en} ta={ta} /></span><span className="num">{inr(v)}</span></div>
  )
  return (
    <>
      {r.driverItems.length ? r.driverItems.map((x) => row(x[0], x[1], x[2], 'sm')) : <div className="r sm"><span><B en="Nothing paid by the driver yet" ta="டிரைவர் செலவு இல்லை" /></span></div>}
      {row('Driver spent', 'டிரைவர் செலவு', r.driverSpent, 'tot')}
      {row('Less GPay / cash advance', 'அட்வான்ஸ் கழித்து', -r.advManual, 'sm')}
      {row('Less rent he collected', 'டிரைவர் வசூல் கழித்து', -r.drvRecv, 'sm')}
      {row('Less advance received', 'மொத்த அட்வான்ஸ் கழித்து', -r.advance, 'advr')}
    </>
  )
}

export const settleWords = (v: number): [string, string] =>
  v > 0 ? ['Pay to driver', 'டிரைவருக்கு கொடுக்கணும்'] : v < 0 ? ['Driver returns', 'டிரைவர் திருப்பி தரணும்'] : ['Even', 'சரி']

export function SettlePane({ s, onClose, onCopy }: { s: Sheet; onClose: () => void; onCopy: () => void }) {
  const { book, mutate, toast } = useBook()
  const router = useRouter()
  const r = calc(s)
  const v = r.settle
  const [en, ta] = settleWords(v)
  const carried = s.carriedTo ? book.sheets.find((x) => x.id === s.carriedTo) : undefined

  const markSettled = () => {
    mutate(() => { s.settled = true })
    toast('Settled with driver / டிரைவருடன் முடிந்தது')
    onClose()
  }

  const carry = () => {
    let next = nextOpenSheet(s, book.sheets)
    mutate((b) => {
      if (!next) {
        next = nextSheetFor(s, b.sheets)
        b.sheets.push(next)
      }
      next.advances.unshift({ date: today(), mode: 'Carried balance', amount: -v, note: `From sheet ${s.no || s.vehicle}` })
      s.settled = true
      s.carriedTo = next.id
    })
    toast(`${inr(Math.abs(v))} carried to ${next!.no || next!.vehicle} / அடுத்த ஷீட்டுக்கு மாற்றப்பட்டது`)
    onClose()
  }

  const whatsapp = () => {
    const digits = (book.people.find((p) => p.name === s.driver)?.phone || '').replace(/\D/g, '')
    const to = digits.length === 10 ? '91' + digits : digits
    window.open(`https://wa.me/${to}?text=${encodeURIComponent(summaryText(s))}`, '_blank', 'noopener')
  }

  return (
    <Drawer onClose={onClose}>
      <div className="pane settle">
        <div className="pane-h">
          <h3><B en="Settle with driver" ta="டிரைவர் கணக்கு முடி" /></h3>
          <CloseX onClick={onClose} />
        </div>
        <div className="settle-who">
          <b>{s.driver || '—'}</b>
          {s.vehicle && <Plate reg={s.vehicle} />}
          <span className="note">{s.no ? <><B en="Sheet" ta="ஷீட்" /> {s.no}</> : null}</span>
        </div>
        <div className="ledger"><DriverRows r={r} /></div>
        <div className={`settle-big ${v > 0 ? 'pay' : v < 0 ? 'ret' : ''}`}>
          <span>{en}<small className="ta">{ta}</small></span>
          <b className="num">{inr(Math.abs(v))}</b>
        </div>
        {s.settled ? (
          <>
            <div className="note">
              <span className="pill done"><B en="Settled" ta="முடிந்தது" /></span>{' '}
              {carried && <>
                <B en={`Balance carried to sheet ${carried.no || carried.vehicle}.`} ta="அடுத்த ஷீட்டுக்கு மாற்றப்பட்டது." />{' '}
                <button type="button" className="link" onClick={() => { onClose(); router.push(`/dashboard/sheets/${carried.id}`) }}><B en="Open it" ta="திற" /></button>
              </>}
            </div>
            <button type="button" className="ghost" onClick={() => { mutate(() => { s.settled = false }); toast('Account reopened / மீண்டும் திறக்கப்பட்டது') }}>
              <B en="Reopen the account" ta="கணக்கை மீண்டும் திற" />
            </button>
            {carried && <span className="note"><B en="The carried line on the next sheet stays; remove it there if needed." ta="அடுத்த ஷீட்டில் உள்ள வரியை தேவையானால் நீக்கவும்." /></span>}
          </>
        ) : (
          <div className="settle-acts">
            <button type="button" className="btn" onClick={markSettled}>
              {v > 0 ? <B en={`Paid ${inr(v)} · mark settled`} ta="கொடுத்தாச்சு" /> : v < 0 ? <B en={`Got ${inr(-v)} back · mark settled`} ta="வாங்கியாச்சு" /> : <B en="Mark settled" ta="முடிந்தது" />}
            </button>
            {v !== 0 && (
              <button type="button" className="ghost" onClick={carry}>
                <B en={`Carry ${inr(Math.abs(v))} to next sheet`} ta="அடுத்த ஷீட்டுக்கு மாற்று" />
              </button>
            )}
          </div>
        )}
        <div className="settle-acts">
          <button type="button" className="ghost" onClick={whatsapp}><B en="Send on WhatsApp" ta="WhatsApp அனுப்பு" /></button>
          <button type="button" className="ghost" onClick={onCopy}><B en="Copy summary" ta="நகலெடு" /></button>
        </div>
      </div>
    </Drawer>
  )
}
