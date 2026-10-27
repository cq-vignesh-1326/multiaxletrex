import { BookProvider } from '@/components/convoy/BookProvider'
import { Shell } from '@/components/convoy/Shell'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <BookProvider>
      <Shell>{children}</Shell>
    </BookProvider>
  )
}
