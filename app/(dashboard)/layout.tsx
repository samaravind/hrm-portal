'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/ui/app-sidebar"
import { AppHeader } from "@/components/ui/app-header"
import { CartProvider } from '@/lib/cart-context'
import { Toaster } from '@/components/ui/sonner'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useUser()
  const syncNewUser = useMutation(api.users.syncNewUser)

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      syncNewUser()
    }
  }, [isLoaded, isSignedIn, syncNewUser])

  return (
    <CartProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
          <Toaster richColors />
        </SidebarInset>
      </SidebarProvider>
    </CartProvider>
  )
}
