import type { Metadata, Viewport } from 'next'
import { Figtree, IBM_Plex_Mono, Noto_Sans_Tamil, Poppins } from 'next/font/google'
import './globals.css'

const body = Figtree({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-body' })
const display = Poppins({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display' })
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
    <html lang="en" className={`${body.variable} ${display.variable} ${mono.variable} ${tamil.variable}`}>
      <body>{children}</body>
    </html>
  )
}
