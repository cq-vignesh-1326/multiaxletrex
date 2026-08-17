'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) {
          router.push('/login')
          return
        }
        const data = await res.json()
        setUser(data.user)
      } catch (error) {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 shadow-sm overflow-y-auto flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-blue-600">🚚 Fleet</h1>
          <p className="text-sm text-gray-600 mt-1">{user.full_name}</p>
          <p className="text-xs text-gray-500 mt-1 capitalize font-semibold">{user.role.replace('_', ' ')}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Common Navigation */}
          <SidebarLink href="/dashboard" label="Dashboard" icon="📊" />
          <SidebarLink href="/dashboard/trips" label="Trips" icon="🚗" />

          {/* Superadmin Navigation */}
          {user.role === 'superadmin' && (
            <>
              <div className="border-t pt-4 mt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase px-2 mb-3">System Admin</p>
                <SidebarLink href="/dashboard/companies" label="Companies" icon="🏢" />
                <SidebarLink href="/dashboard/all-users" label="All Users" icon="👥" />
                <SidebarLink href="/dashboard/all-trucks" label="All Trucks" icon="🚛" />
                <SidebarLink href="/dashboard/all-trips" label="All Trips" icon="📋" />
              </div>
            </>
          )}

          {/* Company Admin Navigation */}
          {user.role === 'company_admin' && (
            <>
              <div className="border-t pt-4 mt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase px-2 mb-3">Company Control</p>
                <SidebarLink href="/dashboard/users" label="Users" icon="👥" />
                <SidebarLink href="/dashboard/trucks" label="Trucks" icon="🚛" />
                <SidebarLink href="/dashboard/expenses" label="Expenses" icon="💰" />
                <SidebarLink href="/dashboard/analytics" label="Analytics" icon="📈" />
              </div>
            </>
          )}

          {/* Truck Admin Navigation */}
          {user.role === 'truck_admin' && (
            <>
              <div className="border-t pt-4 mt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase px-2 mb-3">Truck Management</p>
                <SidebarLink href="/dashboard/drivers" label="Drivers" icon="👨‍✈️" />
                <SidebarLink href="/dashboard/truck-expenses" label="Expenses" icon="💰" />
              </div>
            </>
          )}

          {/* Driver Navigation */}
          {user.role === 'driver' && (
            <>
              <div className="border-t pt-4 mt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase px-2 mb-3">Operations</p>
                <SidebarLink href="/dashboard/my-trucks" label="My Trucks" icon="🚛" />
                <SidebarLink href="/dashboard/add-expense" label="Add Expense" icon="➕" />
              </div>
            </>
          )}

          {/* Settings - All Roles */}
          <div className="border-t pt-4 mt-4">
            <SidebarLink href="/dashboard/settings" label="Settings" icon="⚙️" />
          </div>
        </nav>

        <div className="border-t border-gray-200 bg-white p-4">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto flex flex-col">
        <header className="bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-600">
            {user.role === 'superadmin' && '🔐 System Administration - Full Access'}
            {user.role === 'company_admin' && '🏢 Company Management - Company Access'}
            {user.role === 'truck_admin' && '🚛 Truck Management - Truck Access'}
            {user.role === 'driver' && '👨‍✈️ Driver Portal - Limited Access'}
          </p>
        </header>

        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

function SidebarLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-sm"
    >
      <span className="text-lg">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  )
}
