'use client'

import { useCallback, useEffect, useState } from 'react'
import { T } from '@/lib/convoy/format'
import type { Book } from '@/lib/convoy/types'
import { useBook } from '@/components/convoy/BookProvider'
import { QuickAdd, type QuickKind } from '@/components/convoy/QuickAdd'
import { B, Head } from '@/components/convoy/ui'

const uses = (book: Book, kind: 'vehicle' | 'person', val: string) =>
  kind === 'vehicle'
    ? book.sheets.filter((s) => s.vehicle === val).length
    : book.sheets.filter((s) => [s.driver, s.driver2, s.cleaner].includes(val)).length + book.ledger.filter((e) => e.driver === val).length

export default function MastersPage() {
  const { book, mutate, toast, session } = useBook()
  const [err, setErr] = useState('')
  const [quick, setQuick] = useState<QuickKind | null>(null)

  /** Saves a field when the user leaves it; names and numbers must stay unique and renames reach old sheets. */
  const commit = (list: 'people' | 'vehicles', i: number, field: string, input: HTMLInputElement | HTMLSelectElement) => {
    const item = book[list][i] as unknown as Record<string, string>
    const old = item[field]
    let v = input.value.trim()
    if (field === 'reg') v = v.toUpperCase()
    if (v === old) return
    if (field === 'name' || field === 'reg') {
      if (!v) { input.value = old; setErr('Name cannot be empty / பெயர் காலியாக இருக்கக்கூடாது'); return }
      const dup = (book[list] as unknown as Record<string, string>[]).some((x, j) => j !== i && (x.name || x.reg).toLowerCase() === v.toLowerCase())
      if (dup) { input.value = old; setErr(`${v} is already in the list / ஏற்கனவே உள்ளது`); return }
    }
    mutate((b) => {
      if (field === 'name') {
        b.sheets.forEach((s) => (['driver', 'driver2', 'cleaner'] as const).forEach((k) => { if (s[k] === old) s[k] = v }))
        b.ledger.forEach((x) => { if (x.driver === old) x.driver = v })
      } else if (field === 'reg') {
        b.sheets.forEach((s) => { if (s.vehicle === old) s.vehicle = v })
      }
      ;(b[list][i] as unknown as Record<string, string>)[field] = v
    })
    setErr('')
    toast('Updated / மாற்றப்பட்டது')
  }
  const remove = (list: 'people' | 'vehicles', i: number) => {
    const it = book[list][i] as unknown as Record<string, string>
    const name = it.name || it.reg
    const n = uses(book, list === 'vehicles' ? 'vehicle' : 'person', name)
    if (n) { setErr(`${name} is used on ${n} sheet(s) or entries, so it can't be removed. Rename it instead. / ஷீட்டில் பயன்படுகிறது, நீக்க முடியாது.`); return }
    mutate((b) => { b[list].splice(i, 1) })
    toast('Removed / நீக்கப்பட்டது')
  }

  return (
    <>
      <Head
        title={<B en="Drivers & vehicles" ta="டிரைவர் & வண்டி" />}
        sub={<B en="These lists feed the dropdowns on every trip sheet. Renaming here updates old sheets too." ta="இங்கே உள்ள பெயர்கள் ஷீட்டில் தேர்வு செய்ய வரும். பெயர் மாற்றினால் பழைய ஷீட்டும் மாறும்." />}
      />
      <div className="masters">
        <section className="panel">
          <h2><B en="Drivers and cleaners" ta="டிரைவர் / கிளீனர்" /> <span className="meta">{book.people.length}</span></h2>
          <div className="mlist">
            <div className="mrow mh"><span><B en="Name" ta="பெயர்" /></span><span><B en="Phone" ta="போன்" /></span><span><B en="Role" ta="பணி" /></span><span /></div>
            {book.people.length ? book.people.map((p, i) => (
              <div className="mrow" key={`${p.id}:${p.name}:${p.phone}`}>
                <input defaultValue={p.name} aria-label="Name" onBlur={(e) => commit('people', i, 'name', e.target)} />
                <input defaultValue={p.phone} placeholder={T('Phone', 'போன்')} inputMode="tel" aria-label="Phone" onBlur={(e) => commit('people', i, 'phone', e.target)} />
                <select value={p.role} aria-label="Role" onChange={(e) => commit('people', i, 'role', e.target)}>
                  <option value="driver">{T('Driver', 'டிரைவர்')}</option>
                  <option value="cleaner">{T('Cleaner', 'கிளீனர்')}</option>
                </select>
                <button type="button" className="rowdel" onClick={() => remove('people', i)} aria-label="Remove">×</button>
              </div>
            )) : <div className="empty"><B en="No drivers yet." ta="டிரைவர் இல்லை." /></div>}
          </div>
          <div className="secfoot">
            <button type="button" className="btn" onClick={() => setQuick('driver')}><B en="Add driver" ta="டிரைவர் சேர்" /></button>
            <button type="button" className="ghost" onClick={() => setQuick('cleaner')}><B en="Add cleaner" ta="கிளீனர் சேர்" /></button>
          </div>
        </section>
        <section className="panel">
          <h2><B en="Vehicles" ta="வண்டிகள்" /> <span className="meta">{book.vehicles.length}</span></h2>
          <div className="mlist">
            <div className="mrow vh mh"><span><B en="Vehicle no." ta="வண்டி எண்" /></span><span><B en="Model" ta="மாடல்" /></span><span className="uses"><B en="Used" ta="ஷீட்" /></span><span /></div>
            {book.vehicles.length ? book.vehicles.map((v, i) => (
              <div className="mrow vh" key={`${v.id}:${v.reg}:${v.model}`}>
                <input defaultValue={v.reg} aria-label="Vehicle number" onBlur={(e) => commit('vehicles', i, 'reg', e.target)} />
                <input defaultValue={v.model} placeholder={T('Make / model', 'மாடல்')} aria-label="Model" onBlur={(e) => commit('vehicles', i, 'model', e.target)} />
                <span className="uses">{uses(book, 'vehicle', v.reg)} <B en="sheets" ta="ஷீட்" /></span>
                <button type="button" className="rowdel" onClick={() => remove('vehicles', i)} aria-label="Remove">×</button>
              </div>
            )) : <div className="empty"><B en="No vehicles yet." ta="வண்டி இல்லை." /></div>}
          </div>
          <div className="secfoot"><button type="button" className="btn" onClick={() => setQuick('vehicle')}><B en="Add vehicle" ta="வண்டி சேர்" /></button></div>
        </section>
      </div>
      <div className="err" role="alert">{err}</div>
      {session.user.role === 'owner' && <OfficeUsers />}
      {quick && <QuickAdd kind={quick} onClose={() => setQuick(null)} />}
    </>
  )
}

interface OfficeUser { _id: string; email: string; full_name: string; role: string }

/** Owner-only: logins for other people in the office. */
function OfficeUsers() {
  const { toast } = useBook()
  const [users, setUsers] = useState<OfficeUser[]>([])
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/users')
    if (res.ok) setUsers((await res.json()).users)
  }, [])
  useEffect(() => { load() }, [load])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setBusy(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setErr(res.status === 400 ? 'Enter a name, a valid email and a password of at least 8 characters.' : body.error || 'Could not add the login')
      return
    }
    setForm({ full_name: '', email: '', password: '' })
    toast('Login added / சேர்க்கப்பட்டது')
    load()
  }

  return (
    <section className="panel">
      <h2><B en="Office logins" ta="ஆபிஸ் உள்நுழைவு" /> <span className="meta">{users.length}</span></h2>
      <div className="tblwrap">
        <table>
          <thead><tr><th>Name<span className="ta">பெயர்</span></th><th>Email</th><th>Role<span className="ta">பணி</span></th></tr></thead>
          <tbody>{users.map((u) => <tr key={u._id}><td>{u.full_name}</td><td>{u.email}</td><td>{u.role === 'owner' ? 'Owner' : 'Office staff'}</td></tr>)}</tbody>
        </table>
      </div>
      <form className="fixed" onSubmit={add} noValidate>
        <div className="f"><label htmlFor="u-n"><B en="Name" ta="பெயர்" /></label><input id="u-n" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
        <div className="f"><label htmlFor="u-e">Email</label><input id="u-e" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="f"><label htmlFor="u-p"><B en="Password" ta="கடவுச்சொல்" /></label><input id="u-p" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        <div className="f" style={{ justifyContent: 'flex-end' }}><button className="btn" type="submit" disabled={busy}><B en="Add login" ta="சேர்" /></button></div>
      </form>
      <div className="err" role="alert" style={{ padding: '0 16px 12px' }}>{err}</div>
    </section>
  )
}
