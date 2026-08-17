import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { withAuth } from '@/lib/middleware'
import { hashPassword } from '@/lib/encryption'
import { AddCompanyUserSchema } from '@/lib/validators'
import Company from '@/models/Company'
import User from '@/models/User'

async function handler(req: NextRequest, context: any) {
  const user = (req as any).user
  const { id: companyId } = context.params

  // Only superadmin and company_admin can add users
  const canAdd = user.role === 'superadmin' ||
    (user.role === 'company_admin' && user.company_id === companyId)

  if (!canAdd) {
    return NextResponse.json(
      { error: 'Not authorized to add users to this company' },
      { status: 403 }
    )
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json()

      const validation = AddCompanyUserSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.error.flatten() },
          { status: 400 }
        )
      }

      await connectToDatabase()

      // Verify company exists
      const company = await Company.findById(companyId)
      if (!company) {
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
        )
      }

      const { email, password, full_name, phone, role } = validation.data

      // Check if user already exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        )
      }

      // Hash password
      const encryptedPassword = await hashPassword(password)

      // Create user
      const newUser = new User({
        email,
        encryptedPassword,
        full_name,
        phone,
        role,
        company_id: companyId,
        is_active: true,
      })

      await newUser.save()

      // If company_admin, set as company_admin
      if (role === 'company_admin') {
        await Company.findByIdAndUpdate(companyId, { company_admin: newUser._id })
      }

      // Update company metadata
      await Company.findByIdAndUpdate(
        companyId,
        { $inc: { 'metadata.total_users': 1 } }
      )

      return NextResponse.json(
        {
          message: `${role} added successfully to company`,
          user: {
            id: newUser._id,
            email: newUser.email,
            full_name: newUser.full_name,
            phone: newUser.phone,
            role: newUser.role,
            company_id: newUser.company_id,
          },
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('Add company user error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  // GET all users for company
  if (req.method === 'GET') {
    try {
      await connectToDatabase()

      const company = await Company.findById(companyId)
      if (!company) {
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
        )
      }

      const users = await User.find({ company_id: companyId, is_active: true })
        .select('-encryptedPassword')

      return NextResponse.json({
        company_id: companyId,
        total: users.length,
        users,
      })
    } catch (error) {
      console.error('Fetch company users error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export const POST = withAuth(handler)
export const GET = withAuth(handler)
