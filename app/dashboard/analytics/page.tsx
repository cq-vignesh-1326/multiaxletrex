'use client'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="text-5xl mb-4">📈</div>
          <p className="text-gray-600 text-lg">Profitability Trends</p>
          <p className="text-gray-500 mt-2">Coming soon</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="text-5xl mb-4">⛽</div>
          <p className="text-gray-600 text-lg">Fuel Efficiency</p>
          <p className="text-gray-500 mt-2">Coming soon</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="text-5xl mb-4">🗺️</div>
          <p className="text-gray-600 text-lg">Route Analytics</p>
          <p className="text-gray-500 mt-2">Coming soon</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="text-5xl mb-4">💰</div>
          <p className="text-gray-600 text-lg">Expense Breakdown</p>
          <p className="text-gray-500 mt-2">Coming soon</p>
        </div>
      </div>
    </div>
  )
}
