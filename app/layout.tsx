import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fleet Analytics Dashboard',
  description: 'Track and analyze truck operations, expenses, and profitability',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  )
}
