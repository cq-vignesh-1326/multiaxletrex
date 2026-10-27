import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, type TokenPayload } from './auth'

export type AuthedHandler<C = unknown> = (req: NextRequest, user: TokenPayload, context: C) => Promise<NextResponse>

/** Rejects requests without a valid `authToken` cookie and hands the handler the token payload. */
export function withAuth<C = unknown>(handler: AuthedHandler<C>, opts: { ownerOnly?: boolean } = {}) {
  return async (req: NextRequest, context: C) => {
    const token = req.cookies.get('authToken')?.value
    const user = token ? verifyToken(token) : null
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (opts.ownerOnly && user.role !== 'owner') {
      return NextResponse.json({ error: 'Only the owner can do this' }, { status: 403 })
    }
    try {
      return await handler(req, user, context)
    } catch (error) {
      console.error(`${req.method} ${req.nextUrl.pathname} failed:`, error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
