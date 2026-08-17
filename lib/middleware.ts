import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth'

export function withAuth(handler: (req: NextRequest, context: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context: any) => {
    try {
      const token = req.cookies.get('authToken')?.value

      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized - No token' },
          { status: 401 }
        )
      }

      const payload = verifyToken(token)
      if (!payload) {
        return NextResponse.json(
          { error: 'Unauthorized - Invalid token' },
          { status: 401 }
        )
      }

      // Add user to request
      ;(req as any).user = payload

      return handler(req, context)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

export function withOptionalAuth(handler: (req: NextRequest, context: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context: any) => {
    try {
      const token = req.cookies.get('authToken')?.value

      if (token) {
        const payload = verifyToken(token)
        if (payload) {
          ;(req as any).user = payload
        }
      }

      return handler(req, context)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return handler(req, context) // Continue even if auth fails
    }
  }
}
