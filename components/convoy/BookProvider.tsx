'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fullSheet } from '@/lib/convoy/migrate'
import { COLS, type Book, type Col } from '@/lib/convoy/types'

export type SyncMode = 'loading' | 'pending' | 'shared' | 'error'

interface Session {
  user: { id: string; email: string; full_name: string; role: 'owner' | 'staff' }
  company: { name: string }
}

interface BookCtx {
  book: Book
  /** Bumps on every change; use as a memo dependency. */
  version: number
  session: Session
  mode: SyncMode
  saving: boolean
  err: string
  monthF: string
  setMonthF: (m: string) => void
  /** Trip sheets vehicle filter ('' = all). */
  vehicleF: string
  setVehicleF: (v: string) => void
  /** Change the book in place; the change is saved online shortly after. */
  mutate: (fn: (b: Book) => void) => void
  /** Replace the whole book (restore / sample / start empty) and mark it started. */
  replaceAll: (b: Book) => Promise<void>
  toast: (msg: string) => void
}

const Ctx = createContext<BookCtx | null>(null)
export const useBook = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('useBook outside BookProvider')
  return c
}

const stable = (v: unknown): string =>
  Array.isArray(v)
    ? '[' + v.map(stable).join(',') + ']'
    : v && typeof v === 'object'
      ? '{' + Object.keys(v).sort().filter((k) => (v as Record<string, unknown>)[k] !== undefined)
        .map((k) => JSON.stringify(k) + ':' + stable((v as Record<string, unknown>)[k])).join(',') + '}'
      : JSON.stringify(v ?? null)

const emptyBook = (): Book => ({ sheets: [], ledger: [], people: [], vehicles: [] })
const BATCH = 200

export function BookProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const bookRef = useRef<Book>(emptyBook())
  const synced = useRef<Record<string, string>>({})
  const busy = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const [version, setVersion] = useState(0)
  const [session, setSession] = useState<Session | null>(null)
  const [mode, setMode] = useState<SyncMode>('loading')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [monthF, setMonthF] = useState('All')
  const [vehicleF, setVehicleF] = useState('')
  const [toastMsg, setToastMsg] = useState('')
  const toastT = useRef<ReturnType<typeof setTimeout>>()

  const toast = useCallback((m: string) => {
    setToastMsg(m)
    clearTimeout(toastT.current)
    toastT.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

  const dirty = useCallback(() => {
    const out: { key: string; col: Col; id: string; doc: unknown | null }[] = []
    const present = new Set<string>()
    COLS.forEach((c) => (bookRef.current[c] as { id: string }[]).forEach((it) => {
      const key = c + '/' + it.id
      present.add(key)
      if (synced.current[key] !== stable(it)) out.push({ key, col: c, id: it.id, doc: it })
    }))
    Object.keys(synced.current).forEach((key) => {
      if (!present.has(key)) {
        const [col, id] = key.split('/') as [Col, string]
        out.push({ key, col, id, doc: null })
      }
    })
    return out
  }, [])

  const flush = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    setSaving(true)
    try {
      let list = dirty()
      while (list.length) {
        const part = list.slice(0, BATCH)
        const snap = part.map((x) => (x.doc ? stable(x.doc) : null))
        const res = await fetch('/api/book/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            upserts: part.filter((x) => x.doc).map((x) => ({ col: x.col, doc: x.doc })),
            deletes: part.filter((x) => !x.doc).map((x) => ({ col: x.col, id: x.id })),
          }),
        })
        if (res.status === 401) { router.replace('/login'); return }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          console.error('Sync failed', body)
          setErr(body.error || 'error')
          return
        }
        part.forEach((x, i) => {
          if (snap[i] === null) delete synced.current[x.key]
          else synced.current[x.key] = snap[i]!
        })
        list = dirty()
      }
      setErr('')
    } catch (e) {
      console.error('Sync failed', e)
      setErr('offline')
    } finally {
      busy.current = false
      setSaving(false)
    }
  }, [dirty, router])

  const schedule = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(flush, 700)
  }, [flush])

  const mutate = useCallback((fn: (b: Book) => void) => {
    fn(bookRef.current)
    setVersion((v) => v + 1)
    schedule()
  }, [schedule])

  const load = useCallback(async () => {
    const res = await fetch('/api/book', { cache: 'no-store' })
    if (res.status === 401) { router.replace('/login'); return }
    if (!res.ok) { setMode('error'); setErr('Could not load the book'); return }
    const data = await res.json()
    const b: Book = {
      sheets: (data.sheets || []).map(fullSheet),
      ledger: data.ledger || [],
      people: data.people || [],
      vehicles: data.vehicles || [],
    }
    bookRef.current = b
    synced.current = {}
    COLS.forEach((c) => (b[c] as { id: string }[]).forEach((it) => { synced.current[c + '/' + it.id] = stable(it) }))
    setMode(data.started ? 'shared' : 'pending')
    setVersion((v) => v + 1)
  }, [router])

  const replaceAll = useCallback(async (b: Book) => {
    bookRef.current = b
    setVersion((v) => v + 1)
    await fetch('/api/book/start', { method: 'POST' })
    setMode('shared')
    clearTimeout(timer.current)
    await flush()
  }, [flush])

  useEffect(() => {
    (async () => {
      const me = await fetch('/api/auth/me', { cache: 'no-store' })
      if (!me.ok) { router.replace('/login'); return }
      setSession(await me.json())
      await load()
    })().catch(() => { setMode('error'); setErr('offline') })
  }, [load, router])

  // pick up changes made on other devices when the office comes back to this tab
  useEffect(() => {
    const onFocus = () => {
      if (mode !== 'shared' || busy.current) return
      const a = document.activeElement
      if (a && (a.tagName === 'INPUT' || a.tagName === 'SELECT' || a.tagName === 'TEXTAREA')) return
      if (dirty().length) return
      load().catch(() => {})
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [mode, dirty, load])

  // don't lose the last few keystrokes when the tab closes
  useEffect(() => {
    const onHide = (e: BeforeUnloadEvent) => {
      if (dirty().length) {
        flush()
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', onHide)
    return () => window.removeEventListener('beforeunload', onHide)
  }, [dirty, flush])

  const value = useMemo<BookCtx | null>(() => session && {
    book: bookRef.current, version, session, mode, saving, err, monthF, setMonthF, vehicleF, setVehicleF, mutate, replaceAll, toast,
  }, [session, version, mode, saving, err, monthF, vehicleF, mutate, replaceAll, toast])

  if (!value || mode === 'loading') {
    return <div className="boot-screen"><span className="spinner" aria-hidden="true" />Loading… <span className="ta">ஏற்றுகிறது…</span></div>
  }
  return (
    <Ctx.Provider value={value}>
      {children}
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </Ctx.Provider>
  )
}
