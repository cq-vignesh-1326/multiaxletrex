import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { connectToDatabase } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { CreateUserSchema } from '@/lib/validators'
import User from '@/models/User'

// Office logins for the owner's company.
export const GET = withAuth(async (_req, auth) => {
  await connectToDatabase()
  const users = await User.find({ company_id: auth.companyId }).select('email full_name role is_active').sort({ createdAt: 1 }).lean()
  return NextResponse.json({ users })
}, { ownerOnly: true })

export const POST = withAuth(async (req, auth) => {
  const validation = CreateUserSchema.safeParse(await req.json())
  if (!validation.success) {
    return NextResponse.json({ error: 'Validation failed', details: validation.error.flatten() }, { status: 400 })
  }
  const { full_name, email, password } = validation.data
  await connectToDatabase()
  if (await User.exists({ email: email.toLowerCase() })) {
    return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
  }
  const user = await User.create({
    email, full_name, role: 'staff', company_id: auth.companyId, encryptedPassword: await hashPassword(password),
  })
  return NextResponse.json({ user: { _id: user._id, email: user.email, full_name: user.full_name, role: user.role, is_active: true } }, { status: 201 })
}, { ownerOnly: true })
