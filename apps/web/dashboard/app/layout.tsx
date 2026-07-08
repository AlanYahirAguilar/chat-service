import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { AppShell, ThemeScript } from '@org/ui'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dashboard · Relay',
  description: 'Mensajería asistida por IA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`bg-background ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">
        <ThemeScript />
        <AppShell active="dashboard">{children}</AppShell>
      </body>
    </html>
  )
}
