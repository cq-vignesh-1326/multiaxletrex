import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { connectToDatabase } from '@/lib/db'
import Company from '@/models/Company'

/** Marks the company's book as started so the "start the book" banner stops showing. */
export const POST = withAuth(async (_req, auth) => {
  await connectToDatabase()
  await Company.updateOne({ _id: auth.companyId, book_started_at: null }, { book_started_at: new Date() })
  return NextResponse.json({ ok: true })
})
