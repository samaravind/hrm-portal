'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getNavItems } from '@/components/ui/navigation-items'

export function MobileBottomNav() {
  const pathname = usePathname()
  const { user } = useUser()
  const viewer = useQuery(api.users.viewer)
  const isAdmin = viewer?.role === 'admin' || user?.publicMetadata?.role === 'admin'
  const navItems = getNavItems(isAdmin)
  const activePath = pathname

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(0,0,0,0.35)] backdrop-blur md:hidden">
      <div className={`grid gap-1 ${navItems.length > 4 ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {navItems.map((item) => {
          const active = activePath === item.url
          return (
            <Link
              key={item.title}
              href={item.url}
              scroll={false}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-medium transition ${
                active ? 'text-white' : 'text-white/45'
              }`}
            >
              <item.icon className={`size-5 ${active ? 'text-white' : 'text-white/55'}`} />
              <span className="truncate leading-none">{item.title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
