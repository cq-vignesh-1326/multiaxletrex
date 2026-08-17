'use client'

import { useState, useEffect } from 'react'
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
  metadata?: {
    total_vehicles: number
    total_users: number
  }
  createdAt?: string
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    registration_number: '',
    industry: 'transport',
  })

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/companies')
      if (!res.ok) throw new Error('Failed to fetch companies')
      const data = await res.json()
      setCompanies(data.companies || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create company')
      }

      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        city: '',
        state: '',
        registration_number: '',
        industry: 'transport',
      })
      setShowForm(false)
      fetchCompanies()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading companies...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
        >
          {showForm ? 'Cancel' : '+ Create Company'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Company</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ABC Transport Services"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
              <input
                type="text"
                name="registration_number"
                value={formData.registration_number}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="REG-2026-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="9123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@abc.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="123 Main Street"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Chennai"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tamil Nadu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="transport">Transport</option>
                <option value="logistics">Logistics</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                Create Company
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Companies List */}
      {companies.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600 text-lg">No companies yet</p>
          <p className="text-gray-500 mt-2">Click "Create Company" to add a new transport/logistics company</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map(company => (
            <div key={company._id} className="bg-white rounded-lg border border-gray-200 p-6 shadow hover:shadow-lg transition">
              <h3 className="text-lg font-bold text-gray-900">{company.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{company.registration_number}</p>

              <div className="mt-4 space-y-2 text-sm">
                {company.address && <p><span className="font-semibold">Address:</span> {company.address}</p>}
                {company.city && company.state && (
                  <p><span className="font-semibold">Location:</span> {company.city}, {company.state}</p>
                )}
                {company.phone && <p><span className="font-semibold">Phone:</span> {company.phone}</p>}
                {company.email && <p><span className="font-semibold">Email:</span> {company.email}</p>}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-sm">
                <div>
                  <p className="font-semibold text-blue-600">{company.metadata?.total_vehicles || 0}</p>
                  <p className="text-gray-600">Trucks</p>
                </div>
                <div>
                  <p className="font-semibold text-green-600">{company.metadata?.total_users || 0}</p>
                  <p className="text-gray-600">Users</p>
                </div>
              </div>

              <Link
                href={`/dashboard/companies/${company._id}`}
                className="block w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition text-center"
              >
                Manage Company
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
