import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { hashPassword } from '@/lib/encryption'
import { CreateSuperAdminSchema } from '@/lib/validators'
import User from '@/models/User'

export async function POST(req: NextRequest) {
  try {
    const secretKey = process.env.SUPERADMIN_SECRET

    if (!secretKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Get secret from request header
    const providedSecret = req.headers.get('x-superadmin-secret')

    if (!providedSecret || providedSecret !== secretKey) {
      return NextResponse.json(
        { error: 'Invalid or missing superadmin secret' },
        { status: 401 }
      )
    }

    const body = await req.json()

    // Validate input
    const validation = CreateSuperAdminSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    await connectToDatabase()

    const { email, password, full_name, phone } = validation.data

    // Check if superadmin already exists
    const existingAdmin = await User.findOne({ email, role: 'superadmin' })
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Superadmin with this email already exists' },
        { status: 409 }
      )
    }

    // Check if user with this email already exists (any role)
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const encryptedPassword = await hashPassword(password)

    // Create superadmin user
    const user = new User({
      email,
      encryptedPassword,
      full_name,
      phone,
      role: 'superadmin',
      is_active: true,
    })

    await user.save()

    return NextResponse.json(
      {
        message: 'Superadmin created successfully',
        user: {
          id: user._id,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create superadmin error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
