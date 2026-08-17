import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import User from '@/models/User'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('authToken')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    const user = await User.findById(payload.userId).select('-encryptedPassword')
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        owner_name: user.owner_name,
        phone: user.phone,
        company_name: user.company_name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
