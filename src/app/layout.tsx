import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClientProviders } from '@/components/providers/ClientProviders'
import { Toaster } from "@/components/ui/toaster"
import { AnalyticsProvider } from '@/components/AnalyticsProvider'
import { Header } from '@/components/layout/Header'

const inter = Inter({
  subsets: ['latin'],
  display: 'optional',
  variable: '--font-inter',
  preload: true,
})

export const metadata: Metadata = {
  title: 'Open Decision | PPM Tool Finder',
  description: 'Find the perfect Project Portfolio Management tool for your organization. Compare PPM software based on your specific needs and priorities.',
  keywords: 'PPM, Project Portfolio Management, Tool Finder, Software Comparison, Smartsheet, Airtable, Monday.com, Asana, Jira',
}

export const viewport: Viewport = {
  themeColor: '#0057B7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <style dangerouslySetInnerHTML={{
          __html: `
            * {
              -webkit-tap-highlight-color: transparent;
              box-sizing: border-box;
            }

            html, body {
              margin: 0;
              padding: 0;
              overflow-x: hidden;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }

            body {
              font-family: var(--font-inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
              background-color: white;
              color: rgb(11, 30, 45);
            }

            @media (max-width: 768px) {
              .min-h-screen {
                min-height: 100vh;
                min-height: 100dvh;
              }

              body {
                width: 100%;
                -webkit-overflow-scrolling: touch;
              }

              main {
                flex: 1;
                width: 100%;
              }
            }
          `
        }} />
      </head>
      <body className="font-sans antialiased bg-white">
        <ClientProviders>
          <AnalyticsProvider>
            <div className="min-h-screen flex flex-col">
              <main className="flex-1">
                {children}
              </main>
            </div>
            <Toaster />
          </AnalyticsProvider>
        </ClientProviders>
      </body>
    </html>
  )
}
