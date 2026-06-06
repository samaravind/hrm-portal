'use client'

import Link from 'next/link'
import { ChevronRight, Moon, Sun, User, Info, CreditCard, Smartphone } from 'lucide-react'
import { useAppTheme } from '@/components/theme-provider'

export default function SettingsPage() {
  const { theme, toggleTheme } = useAppTheme()
  const darkMode = theme === 'dark'

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-800">Settings</h1>

      <div className="space-y-1 overflow-hidden rounded-xl border bg-white shadow-sm">
        <Link href="/settings/profile" className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-zinc-50">
          <User className="size-5 text-zinc-400" />
          <span className="flex-1 text-sm font-medium text-zinc-700">Profile</span>
          <span className="text-xs text-zinc-400">Name, email, phone</span>
          <ChevronRight className="size-4 text-zinc-300" />
        </Link>
        <div className="border-t border-zinc-100" />
        <Link href="/settings/payments" className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-zinc-50">
          <CreditCard className="size-5 text-zinc-400" />
          <span className="flex-1 text-sm font-medium text-zinc-700">Payments</span>
          <span className="text-xs text-zinc-400">UPI, cards, bank</span>
          <ChevronRight className="size-4 text-zinc-300" />
        </Link>
        <div className="border-t border-zinc-100" />
        <Link href="/settings/addresses" className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-zinc-50">
          <Smartphone className="size-5 text-zinc-400" />
          <span className="flex-1 text-sm font-medium text-zinc-700">Addresses</span>
          <span className="text-xs text-zinc-400">Saved addresses</span>
          <ChevronRight className="size-4 text-zinc-300" />
        </Link>
        <div className="border-t border-zinc-100" />
        <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer" onClick={toggleTheme}>
          {darkMode ? <Moon className="size-5 text-zinc-400" /> : <Sun className="size-5 text-zinc-400" />}
          <span className="flex-1 text-sm font-medium text-zinc-700">Dark Mode</span>
          <div className={`relative h-6 w-11 rounded-full transition-colors ${darkMode ? 'bg-[#6c47ff]' : 'bg-zinc-200'}`}>
            <div className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${darkMode ? 'translate-x-5' : ''}`} />
          </div>
        </div>
        <div className="border-t border-zinc-100" />
        <Link href="/settings/about" className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-zinc-50">
          <Info className="size-5 text-zinc-400" />
          <span className="flex-1 text-sm font-medium text-zinc-700">About</span>
          <span className="text-xs text-zinc-400">Version 1.0.0</span>
          <ChevronRight className="size-4 text-zinc-300" />
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-400">SAM MARKET v1.0.0</p>
    </div>
  )
}
