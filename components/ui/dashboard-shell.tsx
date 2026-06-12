'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { SidebarProvider, SidebarInset } from './sidebar'
import { AppSidebar } from './app-sidebar'
import { AppHeader } from './app-header'
import { MobileBottomNav } from './mobile-bottom-nav'
import { Toaster } from './sonner'

type DashboardShellProps = {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isLoaded, isSignedIn } = useUser()
  const viewer = useQuery(api.users.viewer)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || viewer === undefined) return

    if (viewer?.approvalStatus === 'pending' && viewer?.role !== 'admin' && pathname !== '/pending-approval') {
      router.replace('/pending-approval')
      return
    }

    if (viewer?.approvalStatus === 'declined' && viewer?.role !== 'admin' && pathname !== '/denied') {
      router.replace('/denied')
      return
    }
  }, [isLoaded, isSignedIn, pathname, router, viewer])

  if (!isLoaded || (isSignedIn && viewer === undefined)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-zinc-500 dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(236,72,153,0.10),_transparent_20%),linear-gradient(180deg,_#020617_0%,_#09090b_100%)] dark:text-zinc-300">
        Loading workspace...
      </div>
    )
  }

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset className="min-h-svh min-w-0 overflow-x-hidden bg-white dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(236,72,153,0.10),_transparent_20%),linear-gradient(180deg,_#020617_0%,_#09090b_100%)]">
        <div className="flex min-h-svh min-w-0 flex-col gap-3 p-3 sm:p-4 md:p-6">
          <AppHeader />
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[34px] border border-white bg-white shadow-none dark:border-neutral-900/80 dark:bg-[#06060a]/92 dark:shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
              <div className="mx-auto flex w-full min-w-0 max-w-[1760px] flex-col gap-6">
                {children}
              </div>
            </div>
          </main>
        </div>
        <MobileBottomNav />
        <Toaster richColors />
      </SidebarInset>
    </SidebarProvider>
  )
}
