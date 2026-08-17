import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { withAuth } from '@/lib/middleware'
import Company from '@/models/Company'

async function handler(req: NextRequest, context: any) {
  const user = (req as any).user
  const { id: companyId } = context.params

  if (user.role !== 'superadmin') {
    return NextResponse.json(
      { error: 'Only superadmin can access company details' },
      { status: 403 }
    )
  }

  try {
    await connectToDatabase()

    const company = await Company.findById(companyId)
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ company })
  } catch (error) {
    console.error('Fetch company error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handler)
