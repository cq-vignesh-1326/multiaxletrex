import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { connectToDatabase } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { SetupSchema } from '@/lib/validators'
import Company from '@/models/Company'
import User from '@/models/User'

const sameSecret = (a: string, b: string) => {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/**
 * Creates a transport office (company) and its owner login.
 * Requires the `x-superadmin-secret` header to match SUPERADMIN_SECRET.
 */
export async function POST(req: NextRequest) {
  try {
    const secret = process.env.SUPERADMIN_SECRET
    if (!secret) {
      return NextResponse.json({ error: 'SUPERADMIN_SECRET is not configured' }, { status: 500 })
    }
    const provided = req.headers.get('x-superadmin-secret') || ''
    if (!sameSecret(provided, secret)) {
      return NextResponse.json({ error: 'Invalid or missing setup secret' }, { status: 401 })
    }

    const validation = SetupSchema.safeParse(await req.json())
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.flatten() }, { status: 400 })
    }
    const { company_name, full_name, email, password } = validation.data

    await connectToDatabase()
    if (await User.exists({ email: email.toLowerCase() })) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
    }
    const company = await Company.create({ name: company_name })
    const user = await User.create({
      email, full_name, role: 'owner', company_id: company._id, encryptedPassword: await hashPassword(password),
    })

    return NextResponse.json(
      { company: { id: company._id, name: company.name }, user: { id: user._id, email: user.email, full_name: user.full_name, role: user.role } },
      { status: 201 }
    )
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
