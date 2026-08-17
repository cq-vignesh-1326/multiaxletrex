'use client'

import { useEffect, useState } from 'react'

interface DashboardStats {
  totalTrips: number
  activeTrips: number
  totalVehicles: number
  totalIncome: number
  totalExpenditure: number
  totalProfit: number
  averageProfit: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTrips: 0,
    activeTrips: 0,
    totalVehicles: 0,
    totalIncome: 0,
    totalExpenditure: 0,
    totalProfit: 0,
    averageProfit: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Trips"
          value={stats.totalTrips}
          icon="🚗"
          color="blue"
        />
        <StatCard
          title="Active Trips"
          value={stats.activeTrips}
          icon="⚡"
          color="yellow"
        />
        <StatCard
          title="Total Vehicles"
          value={stats.totalVehicles}
          icon="🚛"
          color="green"
        />
        <StatCard
          title="Total Income"
          value={`₹${stats.totalIncome.toLocaleString()}`}
          icon="💰"
          color="green"
        />
        <StatCard
          title="Total Expenditure"
          value={`₹${stats.totalExpenditure.toLocaleString()}`}
          icon="📉"
          color="red"
        />
        <StatCard
          title="Total Profit"
          value={`₹${stats.totalProfit.toLocaleString()}`}
          icon="📈"
          color="blue"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionButton label="Create Trip" icon="➕" href="/dashboard/trips" />
          <QuickActionButton label="Add Vehicle" icon="🚗" href="/dashboard/vehicles" />
          <QuickActionButton label="View Analytics" icon="📊" href="/dashboard/analytics" />
          <QuickActionButton label="Settings" icon="⚙️" href="/dashboard/settings" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <p className="text-gray-600">No recent activity yet. Start by creating a trip!</p>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: string | number
  icon: string
  color: string
}) {
  const colorMap = {
    blue: 'bg-blue-50 border-blue-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
  }

  return (
    <div className={`card ${colorMap[color as keyof typeof colorMap]} p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  )
}

function QuickActionButton({
  label,
  icon,
  href,
}: {
  label: string
  icon: string
  href: string
}) {
  return (
    <a
      href={href}
      className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="text-3xl mb-2">{icon}</div>
      <span className="text-sm font-medium text-gray-900">{label}</span>
    </a>
  )
}
