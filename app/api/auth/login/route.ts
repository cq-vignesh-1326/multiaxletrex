import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { comparePassword, setAuthCookie, signToken } from '@/lib/auth'
import { LoginSchema } from '@/lib/validators'
import User from '@/models/User'

export async function POST(req: NextRequest) {
  try {
    const validation = LoginSchema.safeParse(await req.json())
    if (!validation.success) {
      return NextResponse.json({ error: 'Enter your email and password' }, { status: 400 })
    }

    await connectToDatabase()
    const { email, password } = validation.data
    const user = await User.findOne({ email: email.toLowerCase(), is_active: true })
    if (!user || !(await comparePassword(password, user.encryptedPassword))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const res = NextResponse.json({
      user: { id: user._id, email: user.email, full_name: user.full_name, role: user.role },
    })
    setAuthCookie(res, signToken({ userId: String(user._id), email: user.email, role: user.role, companyId: String(user.company_id) }))
    return res
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
