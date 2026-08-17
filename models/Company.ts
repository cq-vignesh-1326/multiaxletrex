import mongoose from 'mongoose'

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    registration_number: {
      type: String,
      unique: true,
      sparse: true,
    },
    phone: String,
    email: String,
    address: String,
    city: String,
    state: String,
    industry: {
      type: String,
      enum: ['transport', 'logistics', 'other'],
      default: 'transport',
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company_admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    metadata: {
      total_vehicles: { type: Number, default: 0 },
      total_users: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
)

export default mongoose.models.Company || mongoose.model('Company', companySchema)
