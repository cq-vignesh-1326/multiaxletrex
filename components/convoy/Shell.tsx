'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { migrate, sampleBook } from '@/lib/convoy/migrate'
import { useBook } from './BookProvider'
import { B, Drawer } from './ui'

const NAV: { href: string; en: string; ta: string }[] = [
  { href: '/dashboard', en: 'Overview', ta: 'மொத்த கணக்கு' },
  { href: '/dashboard/sheets', en: 'Trip sheets', ta: 'டிரிப் ஷீட்' },
  { href: '/dashboard/reports', en: 'Reports', ta: 'அறிக்கை' },
  { href: '/dashboard/masters', en: 'Drivers & vehicles', ta: 'டிரைவர் & வண்டி' },
]

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const { session } = useBook()
  const [backup, setBackup] = useState(false)
  const active = (href: string) => (href === '/dashboard' ? path === href : path.startsWith(href))

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
  }

  return (
    <div className="app">
      <nav className="rail" aria-label="Books">
        <div className="brand"><i /><div>Convoy<small>FLEET ACCOUNTS</small></div></div>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="navbtn" aria-current={active(n.href) ? 'true' : undefined}>
            {n.en}<span className="ta">{n.ta}</span>
          </Link>
        ))}
        <div className="foot">
          <SyncStatus />
          <span className="who">{session.company.name} · {session.user.full_name}</span>
          <button type="button" onClick={() => setBackup(true)}><B en="Backup or restore" ta="காப்பு / மீட்டமை" /></button>
          <button type="button" onClick={logout}><B en="Log out" ta="வெளியேறு" /></button>
        </div>
      </nav>
      <main id="main">
        <Banner onRestore={() => setBackup(true)} />
        {children}
      </main>
      {backup && <BackupPane onClose={() => setBackup(false)} />}
    </div>
  )
}

function SyncStatus() {
  const { mode, saving, err } = useBook()
  if (mode === 'error' || err) return <span className="bad"><B en="Not saved online" ta="ஆன்லைனில் சேமிக்கவில்லை" /></span>
  if (mode === 'pending') return <span><B en="Book not started" ta="கணக்கு தொடங்கவில்லை" /></span>
  if (saving) return <span><B en="Saving online…" ta="சேமிக்கிறது…" /></span>
  return <span><span className="ok">● </span><B en="Saved online" ta="சேமிக்கப்பட்டது" /></span>
}

function Banner({ onRestore }: { onRestore: () => void }) {
  const { mode, err, replaceAll, toast } = useBook()
  const [busy, setBusy] = useState(false)
  if (mode === 'error' || err) {
    return (
      <div className="panel" style={{ padding: '12px 16px', borderColor: 'var(--bad)' }}>
        <b><B en="Changes are not being saved" ta="மாற்றங்கள் சேமிக்கப்படவில்லை" /></b>{' '}
        <span className="note"><B en="Check your internet and reload the page. Keep this tab open until it says Saved online." ta="இணையம் சரிபார்த்து பக்கத்தை மீண்டும் ஏற்றவும்." /></span>
      </div>
    )
  }
  if (mode !== 'pending') return null
  const start = async (sample: boolean) => {
    setBusy(true)
    await replaceAll(sample ? sampleBook() : { sheets: [], ledger: [], people: [], vehicles: [] })
    toast(sample ? 'Sample sheets loaded / மாதிரி ஷீட் ஏற்றப்பட்டது' : 'Book started / தொடங்கப்பட்டது')
  }
  return (
    <div className="panel banner">
      <div style={{ minWidth: 0, maxWidth: '62ch' }}>
        <b><B en="Start your book" ta="கணக்கை தொடங்கவும்" /></b>
        <div className="note">
          <B en="Restore the backup you copied from the old Convoy page, load the five sample paper sheets, or start with an empty book." ta="பழைய காப்பை மீட்டமைக்கவும், அல்லது காலியாக தொடங்கவும்." />
        </div>
      </div>
      <div className="actions">
        <button type="button" className="btn" disabled={busy} onClick={onRestore}><B en="Restore a backup" ta="காப்பை மீட்டமை" /></button>
        <button type="button" className="ghost" disabled={busy} onClick={() => start(true)}><B en="Load sample sheets" ta="மாதிரி ஷீட்" /></button>
        <button type="button" className="ghost" disabled={busy} onClick={() => start(false)}><B en="Start empty" ta="காலியாக தொடங்கு" /></button>
      </div>
    </div>
  )
}

function BackupPane({ onClose }: { onClose: () => void }) {
  const { book, replaceAll, toast } = useBook()
  const router = useRouter()
  const [text, setText] = useState(() => JSON.stringify({ ...book, numbered: true }))
  const [err, setErr] = useState<React.ReactNode>('')
  const [armed, setArmed] = useState(false)

  const copy = () => {
    navigator.clipboard?.writeText(text).then(() => toast('Backup copied / நகலெடுக்கப்பட்டது'), () => {})
  }
  const restore = async () => {
    let d: { sheets?: unknown }
    try {
      d = JSON.parse(text)
      if (!Array.isArray(d.sheets)) throw new Error('no sheets')
    } catch {
      setErr(<B en="That text is not a valid backup. Paste the full backup and try again." ta="சரியான காப்பு இல்லை." />)
      return
    }
    await replaceAll(migrate(d))
    onClose()
    router.push('/dashboard')
    toast('Data restored / மீட்டமைக்கப்பட்டது')
  }

  return (
    <Drawer onClose={onClose}>
      <div className="pane">
        <h3><B en="Backup or restore" ta="காப்பு / மீட்டமை" /></h3>
        <p className="note">
          <B en="Copy this text and keep it in WhatsApp or email. To restore — including a backup copied from the old Convoy page — paste it here and press Restore. Restore replaces everything in the book." ta="இதை நகலெடுத்து WhatsApp-ல் வைக்கவும். மீட்டமைக்க இங்கே ஒட்டி Restore அழுத்தவும்." />
        </p>
        <textarea value={text} onChange={(e) => { setText(e.target.value); setArmed(false) }} aria-label="Backup text" />
        <div className="actions">
          <button type="button" className="ghost" onClick={copy}><B en="Copy backup" ta="நகலெடு" /></button>
          {armed ? (
            <span className="actions">
              <span className="note"><B en="Replace everything?" ta="எல்லாம் மாற்றவா?" /></span>
              <button type="button" className="ghost danger" onClick={restore}><B en="Yes, restore" ta="ஆம்" /></button>
            </span>
          ) : (
            <button type="button" className="ghost" onClick={() => setArmed(true)}><B en="Restore" ta="மீட்டமை" /></button>
          )}
        </div>
        <div className="err" role="alert">{err}</div>
        <div className="row"><button type="button" className="ghost" onClick={onClose}><B en="Close" ta="மூடு" /></button></div>
      </div>
    </Drawer>
  )
}
