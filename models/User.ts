import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    encryptedPassword: { type: String, required: true },
    full_name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['owner', 'staff'], default: 'staff' },
    company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.models.User || mongoose.model('User', userSchema)
