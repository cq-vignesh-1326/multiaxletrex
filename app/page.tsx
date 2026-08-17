'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">🚚 Fleet Analytics</h1>
            </div>
            <div className="flex gap-4">
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Truck Operations Analytics Dashboard
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            Track expenses, monitor profitability, and optimize routes for your fleet operations in Tamil Nadu.
          </p>

          <div className="mt-10 flex items-center justify-center">
            <Link
              href="/login"
              className="rounded-md bg-blue-600 px-8 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Login to Dashboard <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon="📊"
            title="Real-time Analytics"
            description="Track profit/loss, fuel efficiency, and route profitability in real-time"
          />
          <FeatureCard
            icon="💰"
            title="Expense Tracking"
            description="Monitor all operational costs - fuel, tolls, wages, and bribes"
          />
          <FeatureCard
            icon="🚛"
            title="Fleet Management"
            description="Manage multiple vehicles and track each trip's performance"
          />
          <FeatureCard
            icon="📈"
            title="Financial Reports"
            description="Generate detailed profit/loss analysis for business insights"
          />
          <FeatureCard
            icon="🗺️"
            title="Route Optimization"
            description="Identify profitable routes and optimize your operations"
          />
          <FeatureCard
            icon="🔒"
            title="Secure & Reliable"
            description="Enterprise-grade security with encrypted credentials"
          />
        </div>
      </div>
    </main>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  )
}
