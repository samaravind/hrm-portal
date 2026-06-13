import Link from 'next/link'
import { ChartNoAxesCombined, FileText, LayoutDashboard, Users, Wallet } from 'lucide-react'

const menuItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Employees', href: '/employee', icon: Users },
  { label: 'Attendance', href: '/attendance', icon: FileText },
  { label: 'Finance', href: '/finance', icon: Wallet },
  { label: 'Reports', href: '/approvals', icon: ChartNoAxesCombined },
]

export default function AdminSidebar() {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-zinc-200 bg-white p-4 text-zinc-950 dark:border-zinc-900 dark:bg-black dark:text-white">
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-400 dark:text-zinc-500">
          Admin Panel
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">SAM MARKET</h2>
      </div>

      <nav className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white"
            >
              <Icon className="size-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
