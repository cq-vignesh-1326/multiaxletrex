import { z } from 'zod'
import { CAT_KEYS } from './convoy/constants'

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const SetupSchema = z.object({
  company_name: z.string().trim().min(1).max(120),
  full_name: z.string().trim().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8),
})

export const CreateUserSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8),
})

// ---------- book documents ----------
// Inputs arrive as typed text ('', '1,200', 35.5); store number | null.
const numish = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v == null || v === '') return null
    const n = typeof v === 'number' ? v : parseFloat(v.replace(/,/g, ''))
    return isFinite(n) ? n : null
  })
const str = (max = 300) => z.preprocess((v) => (v == null ? '' : String(v)), z.string().max(max))
const paidBy = z.enum(['driver', 'office']).catch('driver')
const id = z.string().min(1).max(40)

const PaymentSchema = z.object({ date: str(10), mode: z.enum(['account', 'cheque', 'gpay', 'driver']).catch('account'), amount: numish, note: str() })
const LoadSchema = z.object({
  date: str(10), from: str(), to: str(), goods: str(), ton: numish, perTon: numish, rent: numish, comm: numish,
  loading: numish, unloading: numish, payments: z.array(PaymentSchema).max(100).default([]),
})
const LineSchema = z.object({ date: str(10), desc: str(), amount: numish, by: paidBy, litres: numish, rate: numish })
const AdvanceSchema = z.object({ date: str(10), mode: str(40), amount: numish, note: str() })

export const SheetDocSchema = z.object({
  id,
  no: str(40), paperNo: str(40), vehicle: str(40), driver: str(120), driver2: str(120), cleaner: str(120),
  from: str(10), to: str(10),
  startKm: numish, endKm: numish, totalKm: numish, commPct: numish, bataPct: numish,
  loads: z.array(LoadSchema).max(100),
  commBy: paidBy, loadBy: paidBy, unloadBy: paidBy,
  lines: z.object(Object.fromEntries(CAT_KEYS.map((k) => [k, z.array(LineSchema).max(300).default([])])) as Record<(typeof CAT_KEYS)[number], z.ZodDefault<z.ZodArray<typeof LineSchema>>>),
  cleanerBata: numish, driverExtra: numish,
  advances: z.array(AdvanceSchema).max(200).default([]),
  settled: z.boolean().catch(false),
  carriedTo: str(40),
  created: z.number().optional(),
})

export const PersonDocSchema = z.object({ id, name: str(120).pipe(z.string().min(1)), role: z.enum(['driver', 'cleaner']).catch('driver'), phone: str(30) })
export const VehicleDocSchema = z.object({ id, reg: str(40).pipe(z.string().min(1)), model: str(120) })
export const LedgerDocSchema = z.object({
  id, date: str(10), driver: str(120), type: z.enum(['salary', 'paid', 'returned', 'adj']), amount: numish, note: str(),
})

export const DOC_SCHEMAS = {
  sheets: SheetDocSchema,
  people: PersonDocSchema,
  vehicles: VehicleDocSchema,
  ledger: LedgerDocSchema,
} as const

const col = z.enum(['sheets', 'ledger', 'people', 'vehicles'])
export const SyncSchema = z.object({
  upserts: z.array(z.object({ col, doc: z.record(z.unknown()) })).max(1000).default([]),
  deletes: z.array(z.object({ col, id })).max(1000).default([]),
})
