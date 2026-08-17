import mongoose from 'mongoose'

const tripSchema = new mongoose.Schema(
  {
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    trip_date: {
      type: Date,
      required: true,
    },
    total_kms: {
      type: Number,
      required: true,
    },
    load_type: {
      type: String,
      required: true,
    },
    load_quantity: {
      type: Number,
      required: true,
    },
    diesel_consumed: {
      type: Number,
      required: true,
    },
    milage: {
      type: Number,
      default: 0, // KMS per liter
    },
    total_income: {
      type: Number,
      required: true,
    },
    total_expenditure: {
      type: Number,
      default: 0,
    },
    profit_loss: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'cancelled'],
      default: 'in-progress',
    },
    notes: String,
  },
  { timestamps: true }
)

// Calculate milage and profit_loss before saving
tripSchema.pre('save', function () {
  if (this.diesel_consumed > 0) {
    this.milage = this.total_kms / this.diesel_consumed
  }
  this.profit_loss = this.total_income - this.total_expenditure
})

export default mongoose.models.Trip || mongoose.model('Trip', tripSchema)
