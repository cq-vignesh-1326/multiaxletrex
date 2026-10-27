'use client'

import { SheetEditor } from '@/components/convoy/SheetEditor'

export default function SheetPage({ params }: { params: { id: string } }) {
  return <SheetEditor id={params.id} />
}
