import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import type { JwtPayload } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface TokenPayload extends JwtPayload {
  userId: string
  email: string
  role: string
  companyId?: string
}

export function generateTokens(userId: string, email: string, role: string, companyId?: string) {
  const payload: any = { userId, email, role }
  if (companyId) {
    payload.companyId = companyId
  }

  const accessToken = jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  const refreshToken = jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '30d' }
  )

  return { accessToken, refreshToken }
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return decoded
  } catch (error) {
    return null
  }
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('authToken')?.value || null
}

export async function getCurrentUser(): Promise<TokenPayload | null> {
  const token = await getAuthToken()
  if (!token) return null
  return verifyToken(token)
}

export async function setAuthCookie(token: string, isRefresh = false) {
  const cookieStore = await cookies()
  const maxAge = isRefresh ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60

  cookieStore.set(isRefresh ? 'refreshToken' : 'authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge,
  })
}

export async function clearAuthCookies() {
  const cookieStore = await cookies()
  cookieStore.delete('authToken')
  cookieStore.delete('refreshToken')
}
