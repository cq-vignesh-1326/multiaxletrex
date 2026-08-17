import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { withAuth } from '@/lib/middleware'
import Vehicle from '@/models/Vehicle'
import Company from '@/models/Company'

async function handler(req: NextRequest, context: any) {
  const user = (req as any).user
  const { id: companyId } = context.params

  if (user.role !== 'superadmin') {
    return NextResponse.json(
      { error: 'Only superadmin can manage company trucks' },
      { status: 403 }
    )
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json()
      await connectToDatabase()

      const { vehicle_name, registration_number, ...otherFields } = body

      // Check if truck already exists
      const existingTruck = await Vehicle.findOne({ registration_number })
      if (existingTruck) {
        return NextResponse.json(
          { error: 'Truck with this registration number already exists' },
          { status: 409 }
        )
      }

      const truck = new Vehicle({
        vehicle_name,
        registration_number,
        ...otherFields,
        company_id: companyId,
        owner_id: user.userId,
      })

      await truck.save()

      // Update company metadata
      await Company.findByIdAndUpdate(
        companyId,
        { $inc: { 'metadata.total_vehicles': 1 } }
      )

      return NextResponse.json(
        { message: 'Truck added successfully', truck },
        { status: 201 }
      )
    } catch (error) {
      console.error('Add truck error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  if (req.method === 'GET') {
    try {
      await connectToDatabase()

      const trucks = await Vehicle.find({ company_id: companyId, is_active: true })

      return NextResponse.json({
        total: trucks.length,
        trucks,
      })
    } catch (error) {
      console.error('Fetch trucks error:', error)
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
