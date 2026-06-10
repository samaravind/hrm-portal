'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMutation, useQuery } from 'convex/react'
import { SignInButton, SignUpButton, UserButton, Show, useClerk } from '@clerk/nextjs'
import { api } from '@/convex/_generated/api'
import { Bell, CheckCircle2, MoonStar, Repeat, SunMedium, XCircle } from 'lucide-react'
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useAppTheme } from '@/components/theme-provider'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useState } from 'react'

const pathTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/staff-dashboard': 'Dashboard',
  '/employee': 'Employees',
  '/my-attendance': 'My Attendance',
  '/leave': 'Leave',
  '/attendance': 'Employee Attendance',
  '/approvals': 'Approval',
  '/settings': 'Settings',
  '/profile': 'Profile',
}

export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const clerk = useClerk()
  const viewer = useQuery(api.users.viewer)
  const pendingApprovals = useQuery(api.users.listPendingApprovals) ?? []
  const pendingLeaveRequests = useQuery(api.leave.listPendingLeaveRequests) ?? []
  const approveUser = useMutation(api.users.approveUserByTokenIdentifier)
  const declineUser = useMutation(api.users.declineUserByTokenIdentifier)
  const [workingToken, setWorkingToken] = useState<string | null>(null)
  const { theme, toggleTheme } = useAppTheme()

  const handleSwitchAccount = async () => {
    await clerk.signOut()
    window.location.href = '/sign-in'
  }

  const title = pathTitles[pathname] ?? pathname.split('/').pop()?.replace(/-/g, ' ') ?? 'Dashboard'
  const isDark = theme === 'dark'
  const isAdmin = viewer?.role === 'admin'
  const latestApprovals = pendingApprovals.slice(0, 4)
  const totalPendingApprovals = pendingApprovals.length + pendingLeaveRequests.length

  const handleApprove = async (tokenIdentifier: string) => {
    setWorkingToken(tokenIdentifier)
    try {
      await approveUser({ tokenIdentifier })
      router.refresh()
    } finally {
      setWorkingToken(null)
    }
  }

  const handleDecline = async (tokenIdentifier: string) => {
    setWorkingToken(tokenIdentifier)
    try {
      await declineUser({ tokenIdentifier })
      router.refresh()
    } finally {
      setWorkingToken(null)
    }
  }

  return (
    <header className="flex items-center justify-between gap-4 rounded-[30px] border border-white/80 bg-white/80 px-4 py-3 shadow-[0_18px_60px_rgba(99,102,241,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/75 dark:shadow-[0_18px_60px_rgba(0,0,0,0.35)] md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="hidden rounded-full border border-zinc-200/80 bg-white/90 text-zinc-700 shadow-sm transition-all hover:-translate-y-px hover:bg-white md:inline-flex dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900" />
        <div className="hidden h-9 w-px bg-gradient-to-b from-transparent via-zinc-200 to-transparent dark:via-zinc-800 sm:block" />
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-400 dark:text-zinc-500">
            SAM MARKET
          </p>
          <h1 className="truncate text-xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-[1.45rem]">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {isAdmin ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="relative rounded-full border border-zinc-200/80 bg-white/90 text-zinc-700 shadow-sm transition-all hover:-translate-y-px hover:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                aria-label="Open approvals"
              >
                <Bell className="size-4" />
                {totalPendingApprovals > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white">
                    {totalPendingApprovals}
                  </span>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[24rem] rounded-[28px] border border-zinc-200/80 bg-white/95 p-0 shadow-[0_24px_90px_rgba(15,23,42,0.18)] backdrop-blur-2xl dark:border-zinc-800 dark:bg-zinc-950/95">
              <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                      Approval Status
                    </p>
                    <h2 className="mt-1 text-sm font-semibold text-zinc-950 dark:text-white">
                      Pending requests
                    </h2>
                  </div>
                  <Link
                    href="/approvals"
                    className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  >
                    View all
                  </Link>
                </div>
              </div>

              <div className="max-h-[24rem] space-y-3 overflow-auto p-3">
                {latestApprovals.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
                    No pending approvals right now.
                  </div>
                ) : (
                  latestApprovals.map((entry) => (
                    <div
                      key={entry.tokenIdentifier}
                      className="rounded-[22px] border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-950 dark:text-white">
                            {entry.name || 'New user'}
                          </p>
                          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                            Email
                          </p>
                          <p className="truncate text-xs text-zinc-600 dark:text-zinc-300">
                            {entry.email || entry.name || 'Email pending'}
                          </p>
                        </div>
                        <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                          Pending
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                          entry.role === 'admin'
                            ? 'bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                            : 'bg-zinc-500/10 text-zinc-700 dark:bg-zinc-500/15 dark:text-zinc-300'
                        }`}>
                          {entry.role === 'admin' ? 'Admin' : 'Staff'}
                        </span>
                        <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                          waiting for review
                        </span>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(entry.tokenIdentifier)}
                          disabled={workingToken === entry.tokenIdentifier}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-zinc-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-900 disabled:text-white disabled:opacity-100 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-800"
                        >
                          <CheckCircle2 className="size-3.5" />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecline(entry.tokenIdentifier)}
                          disabled={workingToken === entry.tokenIdentifier}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/15"
                        >
                          <XCircle className="size-3.5" />
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        ) : null}

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={toggleTheme}
          className="rounded-full border border-zinc-200/80 bg-white/90 text-zinc-600 shadow-sm transition-all hover:-translate-y-px hover:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
          aria-label="Toggle theme"
        >
          {isDark ? <SunMedium className="size-4" /> : <MoonStar className="size-4" />}
        </Button>

        <Show when="signed-out">
          <SignInButton />
          <SignUpButton>
            <button className="hidden rounded-full border border-zinc-200/80 bg-white/90 px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm transition-all hover:-translate-y-px hover:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900 sm:inline-flex">
              Sign Up
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Action
                label="Switch account"
                labelIcon={<Repeat className="size-4" />}
                onClick={handleSwitchAccount}
              />
            </UserButton.MenuItems>
          </UserButton>
        </Show>
      </div>
    </header>
  )
}
