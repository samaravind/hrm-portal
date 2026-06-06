import type { Metadata } from 'next'
import Script from 'next/script'
import { ClerkProvider } from '@clerk/nextjs'
import { ConvexClientProvider } from './convex-client-provider'
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'SAM MARKET',
  description: 'Description Provided',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
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
      <body className="antialiased">
        <ThemeProvider>
          <ClerkProvider>
            <ConvexClientProvider>
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
