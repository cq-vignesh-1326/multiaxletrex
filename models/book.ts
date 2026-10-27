// The four book collections. Every document is keyed by (company_id, doc_id) where
// doc_id is the id the client generated, so the client can write without a round trip.
import mongoose, { Schema } from 'mongoose'
import { CAT_KEYS } from '@/lib/convoy/constants'
import type { Col } from '@/lib/convoy/types'

const N = { type: Number, default: null }
const S = { type: String, default: '' }
const paidBy = { type: String, enum: ['driver', 'office'], default: 'driver' }
const owned = {
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  doc_id: { type: String, required: true },
}

const paymentSchema = new Schema({ date: S, mode: { type: String, enum: ['account', 'cheque', 'gpay', 'driver'], default: 'account' }, amount: N, note: S }, { _id: false })
const loadSchema = new Schema({ date: S, from: S, to: S, goods: S, ton: N, rent: N, comm: N, loading: N, unloading: N, payments: [paymentSchema] }, { _id: false })
const lineSchema = new Schema({ date: S, desc: S, amount: N, by: paidBy, litres: N, rate: N }, { _id: false })
const advanceSchema = new Schema({ date: S, mode: S, amount: N, note: S }, { _id: false })

const sheetSchema = new Schema(
  {
    ...owned,
    no: S, paperNo: S, vehicle: S, driver: S, driver2: S, cleaner: S, from: S, to: S,
    startKm: N, endKm: N, totalKm: N, commPct: N, bataPct: N,
    loads: [loadSchema],
    commBy: paidBy, loadBy: paidBy, unloadBy: paidBy,
    lines: new Schema(Object.fromEntries(CAT_KEYS.map((k) => [k, [lineSchema]])), { _id: false }),
    cleanerBata: N, driverExtra: N,
    advances: [advanceSchema],
    settled: { type: Boolean, default: false },
    created: Number,
  },
  { timestamps: true }
)

const personSchema = new Schema({ ...owned, name: S, role: { type: String, enum: ['driver', 'cleaner'], default: 'driver' }, phone: S }, { timestamps: true })
const vehicleSchema = new Schema({ ...owned, reg: S, model: S }, { timestamps: true })
const ledgerSchema = new Schema(
  { ...owned, date: S, driver: S, type: { type: String, enum: ['salary', 'paid', 'returned', 'adj'] }, amount: N, note: S },
  { timestamps: true }
)

for (const s of [sheetSchema, personSchema, vehicleSchema, ledgerSchema]) {
  s.index({ company_id: 1, doc_id: 1 }, { unique: true })
}

const model = (name: string, schema: Schema) => mongoose.models[name] || mongoose.model(name, schema)

export const BookModels: Record<Col, mongoose.Model<any>> = {
  sheets: model('Sheet', sheetSchema),
  people: model('Person', personSchema),
  vehicles: model('Vehicle', vehicleSchema),
  ledger: model('LedgerEntry', ledgerSchema),
}
