import mongoose from 'mongoose'

const expenseSchema = new mongoose.Schema(
  {
    trip_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expense_type: {
      type: String,
      enum: [
        'fuel',
        'service',
        'rto',
        'pc',
        'loading',
        'unloading',
        'driver_batta',
        'commission',
        'toll',
        'check_post',
        'other',
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    notes: String,
  },
  { timestamps: true }
)

export default mongoose.models.Expense || mongoose.model('Expense', expenseSchema)
