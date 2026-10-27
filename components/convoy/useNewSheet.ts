'use client'

import { useRouter } from 'next/navigation'
import { blankSheet } from '@/lib/convoy/calc'
import { today } from '@/lib/convoy/format'
import { useBook } from './BookProvider'

/** Creates an empty trip sheet dated today and opens it. */
export function useNewSheet() {
  const { mutate } = useBook()
  const router = useRouter()
  return () => {
    const s = blankSheet()
    s.from = today()
    mutate((b) => { b.sheets.push(s) })
    router.push(`/dashboard/sheets/${s.id}`)
  }
}
