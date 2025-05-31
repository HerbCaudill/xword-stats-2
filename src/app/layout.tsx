import type { Metadata } from 'next'
import { plexMono, plexSans, plexSerif } from './fonts'
import './globals.css'

export const metadata: Metadata = {
  title: 'Crossword Stats',
  description: 'Visualization of crossword completion times',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${plexSans.variable} ${plexSerif.variable} ${plexMono.variable} antialiased`}>{children}</body>
    </html>
  )
}
