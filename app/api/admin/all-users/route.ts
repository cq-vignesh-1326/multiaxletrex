import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { withAuth } from '@/lib/middleware'
import User from '@/models/User'

async function handler(req: NextRequest) {
  const user = (req as any).user

  // Only superadmin can access all users
  if (user.role !== 'superadmin') {
    return NextResponse.json(
      { error: 'Only superadmin can access all users' },
      { status: 403 }
    )
  }

  try {
    await connectToDatabase()

    const users = await User.find({ is_active: true })
      .populate('company_id', 'name')
      .select('-encryptedPassword')
      .sort({ createdAt: -1 })

    return NextResponse.json({
      total: users.length,
      users,
    })
  } catch (error) {
    console.error('Fetch all users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handler)
