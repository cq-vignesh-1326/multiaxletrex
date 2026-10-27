import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { connectToDatabase } from '@/lib/db'
import { COLS } from '@/lib/convoy/types'
import { BookModels } from '@/models/book'
import Company from '@/models/Company'

export const dynamic = 'force-dynamic'

/** The whole book for the user's company, in the shape the client keeps in memory. */
export const GET = withAuth(async (_req, auth) => {
  await connectToDatabase()
  const company = await Company.findById(auth.companyId).lean<{ book_started_at: Date | null }>()
  const lists = await Promise.all(
    COLS.map((c) => BookModels[c].find({ company_id: auth.companyId }).select('-_id -__v -company_id -createdAt -updatedAt').lean())
  )
  const body: Record<string, unknown> = { started: !!company?.book_started_at }
  COLS.forEach((c, i) => {
    body[c] = (lists[i] as Record<string, unknown>[]).map(({ doc_id, ...rest }) => ({ id: doc_id, ...rest }))
  })
  return NextResponse.json(body)
})
