import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { withAuth } from '@/lib/middleware'
import { CreateCompanySchema } from '@/lib/validators'
import Company from '@/models/Company'
import User from '@/models/User'

async function handler(req: NextRequest) {
  const user = (req as any).user

  // Only superadmin can create companies
  if (user.role !== 'superadmin') {
    return NextResponse.json(
      { error: 'Only superadmin can create companies' },
      { status: 403 }
    )
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json()

      const validation = CreateCompanySchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.error.flatten() },
          { status: 400 }
        )
      }

      await connectToDatabase()

      const { name, registration_number, industry, ...otherFields } = validation.data

      // Check if company with registration number already exists
      if (registration_number) {
        const existingCompany = await Company.findOne({ registration_number })
        if (existingCompany) {
          return NextResponse.json(
            { error: 'Company with this registration number already exists' },
            { status: 409 }
          )
        }
      }

      // Create company
      const company = new Company({
        name,
        registration_number,
        industry,
        ...otherFields,
        created_by: user.userId,
      })

      await company.save()

      return NextResponse.json(
        {
          message: 'Company created successfully',
          company: {
            id: company._id,
            name: company.name,
            registration_number: company.registration_number,
            industry: company.industry,
            created_by: company.created_by,
          },
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('Company creation error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  // GET all companies (superadmin only)
  if (req.method === 'GET') {
    try {
      await connectToDatabase()

      const companies = await Company.find({ is_active: true })
        .populate('created_by', 'email full_name')
        .populate('company_admin', 'email full_name')

      return NextResponse.json({
        total: companies.length,
        companies,
      })
    } catch (error) {
      console.error('Fetch companies error:', error)
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
