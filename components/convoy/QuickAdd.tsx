'use client'

import { useState } from 'react'
import { uid } from '@/lib/convoy/format'
import { useBook } from './BookProvider'
import { B, CancelBtn, Drawer } from './ui'

export type QuickKind = 'vehicle' | 'driver' | 'cleaner'

/** Add a vehicle, driver or cleaner; `onAdded` gets the saved name / number. */
export function QuickAdd({ kind, onClose, onAdded }: { kind: QuickKind; onClose: () => void; onAdded?: (value: string) => void }) {
  const { book, mutate, toast } = useBook()
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [err, setErr] = useState<React.ReactNode>('')
  const isV = kind === 'vehicle'

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    let v = a.trim()
    if (!v) { setErr(isV ? <B en="Enter the vehicle number." ta="வண்டி எண் போடவும்." /> : <B en="Enter the name." ta="பெயர் போடவும்." />); return }
    if (isV) v = v.toUpperCase()
    const taken = isV ? book.vehicles.some((x) => x.reg.toLowerCase() === v.toLowerCase()) : book.people.some((x) => x.name.toLowerCase() === v.toLowerCase())
    if (taken) { setErr(<B en={`${v} is already in the list.`} ta="ஏற்கனவே உள்ளது." />); return }
    mutate((bk) => {
      if (isV) bk.vehicles.push({ id: uid(), reg: v, model: b.trim() })
      else bk.people.push({ id: uid(), name: v, role: kind === 'cleaner' ? 'cleaner' : 'driver', phone: b.trim() })
    })
    onAdded?.(v)
    onClose()
    toast(isV ? 'Vehicle added / வண்டி சேர்க்கப்பட்டது' : 'Added / சேர்க்கப்பட்டது')
  }

  return (
    <Drawer onClose={onClose}>
      <form noValidate onSubmit={submit}>
        <h3>{isV ? <B en="Add vehicle" ta="வண்டி சேர்" /> : kind === 'cleaner' ? <B en="Add cleaner" ta="கிளீனர் சேர்" /> : <B en="Add driver" ta="டிரைவர் சேர்" />}</h3>
        {isV ? (
          <>
            <div className="f"><label htmlFor="q-a"><B en="Vehicle number" ta="வண்டி எண்" /></label><input id="q-a" autoFocus value={a} onChange={(e) => setA(e.target.value)} placeholder="TN 00 AB 0000" autoCapitalize="characters" /></div>
            <div className="f"><label htmlFor="q-b"><B en="Make / model" ta="மாடல்" /></label><input id="q-b" value={b} onChange={(e) => setB(e.target.value)} placeholder="Tata Signa 4825" /></div>
          </>
        ) : (
          <>
            <div className="f"><label htmlFor="q-a"><B en="Name" ta="பெயர்" /></label><input id="q-a" autoFocus value={a} onChange={(e) => setA(e.target.value)} /></div>
            <div className="f"><label htmlFor="q-b"><B en="Phone" ta="போன்" /></label><input id="q-b" value={b} onChange={(e) => setB(e.target.value)} inputMode="tel" /></div>
          </>
        )}
        <div className="err" role="alert">{err}</div>
        <div className="row"><CancelBtn onClick={onClose} /><button className="btn" type="submit"><B en="Save" ta="சேமி" /></button></div>
      </form>
    </Drawer>
  )
}
