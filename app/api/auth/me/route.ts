import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { connectToDatabase } from '@/lib/db'
import User from '@/models/User'
import Company from '@/models/Company'

export const GET = withAuth(async (_req, auth) => {
  await connectToDatabase()
  const [user, company] = await Promise.all([
    User.findOne({ _id: auth.userId, is_active: true }).select('-encryptedPassword').lean<{ _id: unknown; email: string; full_name: string; role: string }>(),
    Company.findById(auth.companyId).lean<{ name: string }>(),
  ])
  if (!user || !company) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({
    user: { id: user._id, email: user.email, full_name: user.full_name, role: user.role },
    company: { name: company.name },
  })
})
