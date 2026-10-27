import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import type { JwtPayload } from 'jsonwebtoken'
import type { NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('Please define the JWT_SECRET environment variable inside .env.local')
}

export type Role = 'owner' | 'staff'

export interface TokenPayload extends JwtPayload {
  userId: string
  email: string
  role: Role
  companyId: string
}

const WEEK = 7 * 24 * 60 * 60

export function signToken(p: Pick<TokenPayload, 'userId' | 'email' | 'role' | 'companyId'>) {
  return jwt.sign(p, JWT_SECRET!, { expiresIn: WEEK })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET!) as TokenPayload
  } catch {
    return null
  }
}

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set({
    name: 'authToken',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: WEEK,
    path: '/',
  })
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set({ name: 'authToken', value: '', httpOnly: true, maxAge: 0, path: '/' })
}

export const hashPassword = (password: string) => bcrypt.hash(password, 12)
export const comparePassword = (password: string, hash: string) => bcrypt.compare(password, hash)
