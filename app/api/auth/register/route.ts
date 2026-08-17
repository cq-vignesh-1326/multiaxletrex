import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { hashPassword } from '@/lib/encryption'
import { RegisterSchema } from '@/lib/validators'
import User from '@/models/User'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate input
    const validation = RegisterSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    await connectToDatabase()

    const { email, password, owner_name, phone, company_name } = validation.data

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Hash password
    const encryptedPassword = await hashPassword(password)

    // Create user
    const user = new User({
      email,
      encryptedPassword,
      owner_name,
      phone,
      company_name,
      role: 'owner',
    })

    await user.save()

    return NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          id: user._id,
          email: user.email,
          owner_name: user.owner_name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
