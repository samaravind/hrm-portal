'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { BrandMark } from '@/components/ui/brand-mark'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from '@/lib/utils'
import { getNavItems } from "@/components/ui/navigation-items"

export function AppSidebar() {
  const pathname = usePathname()
  const viewer = useQuery(api.users.viewer)
  const isAdmin = viewer?.role === 'admin'
  const { toggleSidebar } = useSidebar()

  const navItems = getNavItems(isAdmin)
  const activePath = pathname

  return (
    <Sidebar
      variant="floating"
      collapsible="icon"
      className="border-0 bg-transparent md:p-3"
    >
      <div className="h-full overflow-hidden rounded-[30px] border border-white/80 bg-white/88 text-zinc-950 shadow-[0_24px_80px_rgba(99,102,241,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/80 dark:text-white dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <SidebarHeader className="border-b border-zinc-200/70 px-4 py-4 dark:border-zinc-900 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Toggle sidebar"
                className={cn(
                  "flex w-full items-center gap-3 rounded-[22px] px-2 py-1.5 text-left transition-all duration-300 hover:bg-indigo-50/70 dark:hover:bg-white/5",
                  "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0",
                )}
              >
                <BrandMark className="size-10 shrink-0 shadow-[0_12px_24px_rgba(15,23,42,0.12)]" />
                <div className="min-w-0 overflow-hidden transition-all duration-300 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
                  <div className="flex flex-col leading-tight">
                    <span className="truncate text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
                      SAM MARKET
                    </span>
                    <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      Dashboard navigation
                    </span>
                  </div>
                </div>
              </button>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="hidden px-3 py-4 md:flex group-data-[collapsible=icon]:px-1">
          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500 group-data-[collapsible=icon]:hidden">
              {isAdmin ? 'Navigation' : 'Menu'}
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-1">
              <SidebarMenu className="gap-1.5">
                {navItems.map((item) => {
                  const active = activePath === item.url
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                        className={cn(
                          "group h-11 rounded-[18px] px-3 transition-all duration-300 hover:-translate-y-px hover:bg-indigo-50/80 hover:text-zinc-950 hover:shadow-[0_10px_24px_rgba(99,102,241,0.08)] dark:hover:bg-white/5 dark:hover:text-white",
                          "data-[active=true]:bg-gradient-to-r data-[active=true]:from-indigo-500/18 data-[active=true]:via-violet-500/14 data-[active=true]:to-fuchsia-500/14 data-[active=true]:text-indigo-700 data-[active=true]:shadow-[0_14px_32px_rgba(99,102,241,0.16)] dark:data-[active=true]:from-indigo-500/12 dark:data-[active=true]:via-violet-500/10 dark:data-[active=true]:to-fuchsia-500/10 dark:data-[active=true]:text-indigo-300 dark:data-[active=true]:shadow-[0_14px_32px_rgba(0,0,0,0.35)]",
                          "border border-transparent data-[active=true]:border-indigo-200/70 dark:data-[active=true]:border-indigo-500/20",
                        )}
                      >
                        <Link
                          href={item.url}
                          scroll={false}
                          aria-label={item.title}
                          className="flex items-center gap-3"
                        >
                          <item.icon className="size-5 shrink-0 text-zinc-700 transition-colors dark:text-zinc-200" />
                          <span className="min-w-0 overflow-hidden text-sm font-medium transition-all duration-300 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

      </div>
    </Sidebar>
  )
}
