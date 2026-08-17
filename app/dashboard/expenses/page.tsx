'use client'

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Expense Tracking</h1>
        <button className="btn-primary">Add Expense</button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-5xl mb-4">💰</div>
        <p className="text-gray-600 text-lg">No expenses recorded yet</p>
        <p className="text-gray-500 mt-2">Expenses will be tracked as you add trips</p>
      </div>
    </div>
  )
}
