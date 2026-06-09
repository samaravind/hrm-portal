import type { ReactNode } from 'react'
import { SidebarProvider, SidebarInset } from './sidebar'
import { AppSidebar } from './app-sidebar'
import { AppHeader } from './app-header'
import { MobileBottomNav } from './mobile-bottom-nav'
import { Toaster } from './sonner'

type DashboardShellProps = {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset className="min-h-svh min-w-0 overflow-x-hidden bg-[#f5f7ff] dark:bg-black">
        <div className="flex h-full min-w-0 flex-col gap-4 p-3 sm:p-4 md:p-6">
          <AppHeader />
          <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-zinc-900 dark:bg-zinc-950/80 dark:shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
              <div className="mx-auto flex w-full min-w-0 max-w-[1600px] flex-col gap-6">
                {children}
              </div>
            </div>
          </section>
        </div>
        <MobileBottomNav />
        <Toaster richColors />
      </SidebarInset>
    </SidebarProvider>
  )
}
