import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import Trip from '@/models/Trip'
import Vehicle from '@/models/Vehicle'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('authToken')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    const userId = payload.userId

    // Get stats
    const trips = await Trip.find({ owner_id: userId })
    const vehicles = await Vehicle.find({ owner_id: userId })

    const totalTrips = trips.length
    const activeTrips = trips.filter(t => t.status === 'in-progress').length
    const totalVehicles = vehicles.length
    const totalIncome = trips.reduce((sum, t) => sum + (t.total_income || 0), 0)
    const totalExpenditure = trips.reduce((sum, t) => sum + (t.total_expenditure || 0), 0)
    const totalProfit = totalIncome - totalExpenditure
    const averageProfit = totalTrips > 0 ? totalProfit / totalTrips : 0

    return NextResponse.json({
      totalTrips,
      activeTrips,
      totalVehicles,
      totalIncome,
      totalExpenditure,
      totalProfit,
      averageProfit: Math.round(averageProfit),
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
