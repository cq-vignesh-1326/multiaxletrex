import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, Noto_Sans_Tamil, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const body = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-body' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' })
const tamil = Noto_Sans_Tamil({ subsets: ['tamil'], weight: ['400', '500'], variable: '--font-tamil' })

export const metadata: Metadata = {
  title: 'Convoy Fleet Desk',
  description: 'Trip sheets, driver accounts and reports for transport offices',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${mono.variable} ${tamil.variable}`}>
      <body>{children}</body>
    </html>
  )
}
