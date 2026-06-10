'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getNavItems } from '@/components/ui/navigation-items'

export function MobileBottomNav() {
  const pathname = usePathname()
  const viewer = useQuery(api.users.viewer)
  const isAdmin = viewer?.role === 'admin'
  const navItems = getNavItems(isAdmin)
  const activePath = pathname

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 md:hidden">
      <div className="rounded-[28px] border border-zinc-200/80 bg-white/85 p-2 shadow-[0_18px_50px_rgba(15,23,42,0.1)] backdrop-blur-xl dark:border-zinc-900 dark:bg-zinc-950/90 dark:shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
        <div className={`grid gap-1 ${navItems.length > 4 ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {navItems.map((item) => {
          const active = activePath === item.url
          return (
            <Link
              key={item.title}
              href={item.url}
              scroll={false}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-[20px] px-2 py-2 text-[10px] font-medium transition ${
                active ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300' : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              <item.icon className={`size-5 ${active ? 'text-indigo-600 dark:text-indigo-300' : 'text-zinc-500 dark:text-zinc-400'}`} />
              <span className="sr-only">{item.title}</span>
            </Link>
          )
        })}
        </div>
      </div>
    </nav>
  )
}
