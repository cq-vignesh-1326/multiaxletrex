'use client'

import { useState, useEffect } from 'react'

interface Truck {
  _id: string
  owner_id?: string
  vehicle_name: string
  registration_number: string
  vehicle_type: string
  capacity_tons: number
  fuel_type: string
  model?: string
  manufacture_year?: number
  purchase_date?: string
  fc_date?: string
  last_service_date?: string
  is_active: boolean
  company_id?: {
    _id: string
    name: string
  }
  createdAt: string
}

export default function AllTrucksPage() {
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    vehicle_name: '',
    registration_number: '',
    vehicle_type: 'truck',
    model: '',
    manufacture_year: new Date().getFullYear(),
    purchase_date: '',
    fc_date: '',
    last_service_date: '',
    capacity_tons: 10,
    fuel_type: 'diesel',
  })

  useEffect(() => {
    fetchTrucks()
  }, [])

  const fetchTrucks = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/all-trucks')
      if (!res.ok) throw new Error('Failed to fetch trucks')
      const data = await res.json()
      setTrucks(data.trucks || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity_tons' || name === 'manufacture_year' ? Number(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch('/api/admin/all-trucks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create truck')
      }

      setFormData({
        vehicle_name: '',
        registration_number: '',
        vehicle_type: 'truck',
        model: '',
        manufacture_year: new Date().getFullYear(),
        purchase_date: '',
        fc_date: '',
        last_service_date: '',
        capacity_tons: 10,
        fuel_type: 'diesel',
      })
      setShowForm(false)
      fetchTrucks()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading trucks...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">All Trucks</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
        >
          {showForm ? 'Cancel' : '+ Add Truck'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Truck</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Truck Name *</label>
              <input
                type="text"
                name="vehicle_name"
                value={formData.vehicle_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Truck-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number *</label>
              <input
                type="text"
                name="registration_number"
                value={formData.registration_number}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="TN-01-AB-1234"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tata 407"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Manufacture Year</label>
              <input
                type="number"
                name="manufacture_year"
                value={formData.manufacture_year}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2020"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Date</label>
              <input
                type="date"
                name="purchase_date"
                value={formData.purchase_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fitness Certificate Date</label>
              <input
                type="date"
                name="fc_date"
                value={formData.fc_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Service Date</label>
              <input
                type="date"
                name="last_service_date"
                value={formData.last_service_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Capacity (Tons) *</label>
              <input
                type="number"
                name="capacity_tons"
                value={formData.capacity_tons}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type *</label>
              <select
                name="vehicle_type"
                value={formData.vehicle_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="truck">Truck</option>
                <option value="mini-truck">Mini Truck</option>
                <option value="auto">Auto</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type *</label>
              <select
                name="fuel_type"
                value={formData.fuel_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="diesel">Diesel</option>
                <option value="petrol">Petrol</option>
                <option value="cng">CNG</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                Add Truck
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Trucks List */}
      {trucks.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600 text-lg">No trucks yet</p>
          <p className="text-gray-500 mt-2">Click &quot;Add Truck&quot; to add vehicles to the system</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {trucks.map(truck => (
            <div key={truck._id} className="bg-white rounded-lg border border-gray-200 p-6 shadow hover:shadow-lg transition">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{truck.vehicle_name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{truck.registration_number}</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                  {truck.vehicle_type}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                {truck.model && (
                  <div>
                    <p className="text-gray-500">Model</p>
                    <p className="font-semibold text-gray-900">{truck.model}</p>
                  </div>
                )}
                {truck.manufacture_year && (
                  <div>
                    <p className="text-gray-500">Manufacture</p>
                    <p className="font-semibold text-gray-900">{truck.manufacture_year}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Capacity</p>
                  <p className="font-semibold text-gray-900">{truck.capacity_tons} Tons</p>
                </div>
                <div>
                  <p className="text-gray-500">Fuel Type</p>
                  <p className="font-semibold text-gray-900 capitalize">{truck.fuel_type}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-2">Dates</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {truck.purchase_date && (
                    <div>
                      <p className="text-gray-500">Purchased</p>
                      <p className="text-gray-900">{new Date(truck.purchase_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {truck.fc_date && (
                    <div>
                      <p className="text-gray-500">FC Valid Till</p>
                      <p className="text-gray-900">{new Date(truck.fc_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {truck.last_service_date && (
                    <div>
                      <p className="text-gray-500">Last Service</p>
                      <p className="text-gray-900">{new Date(truck.last_service_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
