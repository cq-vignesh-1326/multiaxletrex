'use client'

export default function TripsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Trip Management</h1>
        <button className="btn-primary">Create New Trip</button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-5xl mb-4">🚗</div>
        <p className="text-gray-600 text-lg">No trips yet</p>
        <p className="text-gray-500 mt-2">Start tracking your first trip to see data here</p>
      </div>
    </div>
  )
}
