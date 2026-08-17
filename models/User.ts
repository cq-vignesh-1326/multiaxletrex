import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    encryptedPassword: {
      type: String,
      required: true,
    },
    full_name: {
      type: String,
      required: true,
    },
    phone: String,
    role: {
      type: String,
      enum: ['superadmin', 'company_admin', 'truck_admin', 'driver'],
      default: 'driver',
      index: true,
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      index: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    // Legacy fields (for backward compatibility)
    owner_name: String,
    company_name: String,
  },
  { timestamps: true }
)

export default mongoose.models.User || mongoose.model('User', userSchema)
