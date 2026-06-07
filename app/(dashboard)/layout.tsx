export const dynamic = 'force-dynamic'

import type { ReactNode } from 'react'
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/ui/app-sidebar"
import { AppHeader } from "@/components/ui/app-header"
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav"
import { CartProvider } from '@/lib/cart-context'
import { Toaster } from '@/components/ui/sonner'
import { DashboardUserSync } from "./dashboard-user-sync"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <DashboardUserSync />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6">
            {children}
          </main>
          <MobileBottomNav />
          <Toaster richColors />
        </SidebarInset>
      </SidebarProvider>
    </CartProvider>
  )
}
