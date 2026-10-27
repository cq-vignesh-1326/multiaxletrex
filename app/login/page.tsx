'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        setError((await res.json().catch(() => ({}))).error || 'Login failed')
        return
      }
      router.replace('/dashboard')
    } catch {
      setError('Could not reach the server. Check your internet.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <form className="panel" onSubmit={submit} noValidate>
        <div className="brand"><i /><div>Convoy<small>FLEET ACCOUNTS</small></div></div>
        <div className="f">
          <label htmlFor="l-e">Email <span className="ta">மின்னஞ்சல்</span></label>
          <input id="l-e" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
        </div>
        <div className="f">
          <label htmlFor="l-p">Password <span className="ta">கடவுச்சொல்</span></label>
          <input id="l-p" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="err" role="alert">{error}</div>
        <button className="btn" type="submit" disabled={loading}>{loading ? 'Logging in…' : <>Log in <span className="ta">உள்நுழை</span></>}</button>
        <p className="note">Ask the office owner for a login. <span className="ta">உள்நுழைவுக்கு உரிமையாளரிடம் கேளுங்கள்.</span></p>
      </form>
    </div>
  )
}
