import type { Metadata } from 'next'
import { Outfit, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

// Modern, premium typography matching our design aesthetics
const fontSans = Outfit({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

const fontMono = JetBrains_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

// Premium production-grade SEO best practices metadata
export const metadata: Metadata = {
  title: 'Booki Admin Dashboard - Smart Restaurant Realtime Management',
  description: 'Enterprise-grade, high-performance realtime control panel for smart table ordering, kitchen queue automation, and live customer feedback analytics.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans min-h-full bg-background text-foreground transition-colors duration-300`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
