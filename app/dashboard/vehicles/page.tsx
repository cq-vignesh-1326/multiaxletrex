'use client'

export default function VehiclesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Fleet Vehicles</h1>
        <button className="btn-primary">Add Vehicle</button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-5xl mb-4">🚛</div>
        <p className="text-gray-600 text-lg">No vehicles added yet</p>
        <p className="text-gray-500 mt-2">Add your first vehicle to start tracking trips</p>
      </div>
    </div>
  )
}
