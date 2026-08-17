import mongoose from 'mongoose'

const vehicleSchema = new mongoose.Schema(
  {
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      index: true,
    },
    vehicle_name: {
      type: String,
      required: true,
    },
    registration_number: {
      type: String,
      required: true,
      unique: true,
    },
    vehicle_type: {
      type: String,
      enum: ['truck', 'mini-truck', 'auto', 'other'],
      required: true,
    },
    model: String,
    manufacture_year: Number,
    purchase_date: Date,
    fc_date: Date,
    last_service_date: Date,
    capacity_tons: {
      type: Number,
      required: true,
    },
    fuel_type: {
      type: String,
      enum: ['diesel', 'petrol', 'cng'],
      default: 'diesel',
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

export default mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema)
