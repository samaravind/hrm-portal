'use client'

import { usePathname } from 'next/navigation'
import { SignInButton, SignUpButton, UserButton, Show, useClerk } from '@clerk/nextjs'
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Repeat } from 'lucide-react'

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

  const handleSwitchAccount = async () => {
    await clerk.signOut()
    window.location.href = '/sign-in'
  }
  const resolvedPath = pathname

  const title = pathTitles[resolvedPath] ?? resolvedPath.split('/').pop()?.replace(/-/g, ' ') ?? 'Dashboard'

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 px-4">
        <div className="flex flex-1 items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm font-medium capitalize">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Show when="signed-out">
            <SignInButton />
            <SignUpButton>
              <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
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
    </>
  )
}
