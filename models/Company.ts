import mongoose from 'mongoose'

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Set when the office first uploads data or chooses to start empty; until then the app offers both.
    book_started_at: { type: Date, default: null },
  },
  { timestamps: true }
)

export default mongoose.models.Company || mongoose.model('Company', companySchema)
