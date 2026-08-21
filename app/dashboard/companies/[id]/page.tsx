'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Company {
  _id: string
  name: string
  address?: string
  phone?: string
  email?: string
  city?: string
  state?: string
  registration_number?: string
  industry?: string
}

interface User {
  _id: string
  email: string
  full_name: string
  phone: string
  role: string
  is_active: boolean
}

interface Truck {
  _id: string
  vehicle_name: string
  registration_number: string
  model?: string
  capacity_tons: number
  fuel_type: string
}

export default function CompanyManagementPage() {
  const params = useParams()
  const companyId = params.id as string

  const [company, setCompany] = useState<Company | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'trucks'>('overview')

  const [addUserForm, setAddUserForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'company_admin',
  })

  const [addTruckForm, setAddTruckForm] = useState({
    vehicle_name: '',
    registration_number: '',
    model: '',
    capacity_tons: 10,
    fuel_type: 'diesel',
  })

  const fetchCompanyData = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch company details
      const companyRes = await fetch(`/api/admin/companies/${companyId}`)
      if (companyRes.ok) {
        const companyData = await companyRes.json()
        setCompany(companyData.company)
      }

      // Fetch company users
      const usersRes = await fetch(`/api/admin/companies/${companyId}/users`)
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }

      // Fetch company trucks
      const trucksRes = await fetch(`/api/admin/companies/${companyId}/trucks`)
      if (trucksRes.ok) {
        const trucksData = await trucksRes.json()
        setTrucks(trucksData.trucks || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanyData()
  }, [companyId])

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch(`/api/admin/companies/${companyId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addUserForm),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add user')
      }

      setAddUserForm({ email: '', password: '', full_name: '', phone: '', role: 'company_admin' })
      fetchCompanyData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleAddTruck = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch(`/api/admin/companies/${companyId}/trucks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addTruckForm),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add truck')
      }

      setAddTruckForm({ vehicle_name: '', registration_number: '', model: '', capacity_tons: 10, fuel_type: 'diesel' })
      fetchCompanyData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!company) {
    return <div className="text-center py-8 text-red-600">Company not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/companies" className="text-blue-600 hover:text-blue-700">
          ← Back to Companies
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-6 py-4 font-medium border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-6 py-4 font-medium border-b-2 transition ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            👥 Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('trucks')}
            className={`flex-1 px-6 py-4 font-medium border-b-2 transition ${
              activeTab === 'trucks'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            🚛 Trucks ({trucks.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Registration</p>
                  <p className="text-lg font-semibold text-gray-900">{company.registration_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Industry</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">{company.industry || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-lg font-semibold text-gray-900">{company.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-lg font-semibold text-gray-900">{company.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">City</p>
                  <p className="text-lg font-semibold text-gray-900">{company.city || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">State</p>
                  <p className="text-lg font-semibold text-gray-900">{company.state || 'N/A'}</p>
                </div>
              </div>
              {company.address && (
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-lg font-semibold text-gray-900">{company.address}</p>
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Add User to Company</h3>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={addUserForm.full_name}
                      onChange={(e) => setAddUserForm({ ...addUserForm, full_name: e.target.value })}
                      required
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={addUserForm.email}
                      onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })}
                      required
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="tel"
                      placeholder="Phone (10 digits)"
                      value={addUserForm.phone}
                      onChange={(e) => setAddUserForm({ ...addUserForm, phone: e.target.value })}
                      required
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={addUserForm.password}
                      onChange={(e) => setAddUserForm({ ...addUserForm, password: e.target.value })}
                      required
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={addUserForm.role}
                      onChange={(e) => setAddUserForm({ ...addUserForm, role: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="company_admin">Company Admin</option>
                      <option value="truck_admin">Truck Admin</option>
                      <option value="driver">Driver</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg"
                  >
                    Add User
                  </button>
                </form>
              </div>

              {/* Users List */}
              {users.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-600">
                  No users yet
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map(user => (
                    <div key={user._id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{user.full_name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Trucks Tab */}
          {activeTab === 'trucks' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Add Truck to Company</h3>
                <form onSubmit={handleAddTruck} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Truck Name"
                      value={addTruckForm.vehicle_name}
                      onChange={(e) => setAddTruckForm({ ...addTruckForm, vehicle_name: e.target.value })}
                      required
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Registration Number"
                      value={addTruckForm.registration_number}
                      onChange={(e) => setAddTruckForm({ ...addTruckForm, registration_number: e.target.value })}
                      required
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Model"
                      value={addTruckForm.model}
                      onChange={(e) => setAddTruckForm({ ...addTruckForm, model: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Capacity (Tons)"
                      value={addTruckForm.capacity_tons}
                      onChange={(e) => setAddTruckForm({ ...addTruckForm, capacity_tons: Number(e.target.value) })}
                      required
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={addTruckForm.fuel_type}
                      onChange={(e) => setAddTruckForm({ ...addTruckForm, fuel_type: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="diesel">Diesel</option>
                      <option value="petrol">Petrol</option>
                      <option value="cng">CNG</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg"
                  >
                    Add Truck
                  </button>
                </form>
              </div>

              {/* Trucks List */}
              {trucks.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-600">
                  No trucks yet
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trucks.map(truck => (
                    <div key={truck._id} className="bg-gray-50 rounded-lg p-4">
                      <p className="font-semibold text-gray-900">{truck.vehicle_name}</p>
                      <p className="text-sm text-gray-600">{truck.registration_number}</p>
                      {truck.model && <p className="text-sm text-gray-600">Model: {truck.model}</p>}
                      <p className="text-sm text-gray-600">Capacity: {truck.capacity_tons} tons</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
