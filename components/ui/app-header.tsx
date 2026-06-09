'use client'

import { usePathname } from 'next/navigation'
import { SignInButton, SignUpButton, UserButton, Show, useClerk } from '@clerk/nextjs'
import { MoonStar, Repeat, SunMedium } from 'lucide-react'
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useAppTheme } from '@/components/theme-provider'

const pathTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/staff-dashboard': 'Dashboard',
  '/employee': 'Employees',
  '/my-attendance': 'My Attendance',
  '/attendance': 'Employee Attendance',
  '/settings': 'Settings',
  '/profile': 'Profile',
}

export function AppHeader() {
  const pathname = usePathname()
  const clerk = useClerk()
  const { theme, toggleTheme } = useAppTheme()

  const handleSwitchAccount = async () => {
    await clerk.signOut()
    window.location.href = '/sign-in'
  }

  const title = pathTitles[pathname] ?? pathname.split('/').pop()?.replace(/-/g, ' ') ?? 'Dashboard'
  const isDark = theme === 'dark'

  return (
    <header className="flex items-center justify-between gap-4 rounded-[28px] border border-white/70 bg-white/85 px-4 py-3 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-zinc-900 dark:bg-zinc-950/80 dark:shadow-[0_16px_50px_rgba(0,0,0,0.35)] md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900" />
        <Separator orientation="vertical" className="h-5 bg-zinc-200 dark:bg-zinc-800" />
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
            SAM MARKET
          </p>
          <h1 className="truncate text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={toggleTheme}
          className="rounded-2xl border border-zinc-200 bg-white text-zinc-600 shadow-xs hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
          aria-label="Toggle theme"
        >
          {isDark ? <SunMedium className="size-4" /> : <MoonStar className="size-4" />}
        </Button>

        <Show when="signed-out">
          <SignInButton />
          <SignUpButton>
            <button className="hidden rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-xs hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900 sm:inline-flex">
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
