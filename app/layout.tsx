import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { ClerkProvider } from '@clerk/nextjs'
import { ConvexClientProvider } from './convex-client-provider'
import { AuthUserSync } from './auth-user-sync'
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from '@/components/theme-provider'
import { DashboardUserSync } from './(dashboard)/dashboard-user-sync'
import './globals.css'

export const metadata: Metadata = {
  title: 'SAM MARKET',
  description: 'Description Provided',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const publishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{
          __html: `
            try {
              var t = localStorage.getItem('theme');
              if (t === 'dark') document.documentElement.classList.add('dark');
            } catch(e) {}
          `,
        }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          <ClerkProvider publishableKey={publishableKey}>
            <ConvexClientProvider>
              <AuthUserSync />
              <DashboardUserSync />
              <TooltipProvider>
                {children}
              </TooltipProvider>
            </ConvexClientProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
