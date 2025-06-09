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
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon-solid.png" />
        <link rel="mask-icon" href="/favicon.png" color="#ffffff" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="msapplication-TileColor" content="#ffffff" />
      </head>
      <body
        className={`${plexSans.variable} ${plexSerif.variable} ${plexMono.variable} antialiased overflow-hidden  select-none`}
      >
        {children}
      </body>
    </html>
  )
}
