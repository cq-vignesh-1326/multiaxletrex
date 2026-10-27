import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { connectToDatabase } from '@/lib/db'
import { DOC_SCHEMAS, SyncSchema } from '@/lib/validators'
import { BookModels } from '@/models/book'

/**
 * Applies the client's changed and removed documents. Each upsert replaces the whole
 * document for (company, id); last write wins.
 */
export const POST = withAuth(async (req, auth) => {
  const validation = SyncSchema.safeParse(await req.json())
  if (!validation.success) {
    return NextResponse.json({ error: 'Validation failed', details: validation.error.flatten() }, { status: 400 })
  }
  const { upserts, deletes } = validation.data

  const docs = []
  for (const u of upserts) {
    const parsed = DOC_SCHEMAS[u.col].safeParse(u.doc)
    if (!parsed.success) {
      return NextResponse.json(
        { error: `Invalid ${u.col} document`, id: u.doc.id, details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { id, ...data } = parsed.data
    docs.push({ col: u.col, id, data })
  }

  await connectToDatabase()
  const company_id = auth.companyId
  await Promise.all([
    ...docs.map(({ col, id, data }) =>
      BookModels[col].replaceOne({ company_id, doc_id: id }, { ...data, company_id, doc_id: id }, { upsert: true, runValidators: true })
    ),
    ...deletes.map(({ col, id }) => BookModels[col].deleteOne({ company_id, doc_id: id })),
  ])
  return NextResponse.json({ ok: true, upserted: docs.length, deleted: deletes.length })
})
