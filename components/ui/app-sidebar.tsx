'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { BrandMark } from '@/components/ui/brand-mark'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Cog } from "lucide-react"
import { getNavItems } from "@/components/ui/navigation-items"

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const viewer = useQuery(api.users.viewer)
  const isAdmin = viewer?.role === 'admin' || user?.publicMetadata?.role === 'admin'

  const navItems = getNavItems(isAdmin)

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="border-b border-white/5 md:border-b-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={isAdmin ? "/" : "/staff-dashboard"}>
                <BrandMark className="size-8" />
                <div className="hidden grid flex-1 text-left text-sm leading-tight md:grid">
                  <span className="truncate font-semibold">SAM MARKET</span>
                  <span className="truncate text-xs">Description Provided</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="hidden md:flex">
        <SidebarGroup>
          <SidebarGroupLabel>{isAdmin ? 'Navigation' : 'Menu'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      {isAdmin && (
        <SidebarFooter className="hidden md:flex">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/">
                  <Cog className="size-4" />
                  <span>Preferences</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  )
}
