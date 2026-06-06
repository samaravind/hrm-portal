"use client"

import Link from 'next/link'
import {
  ChevronRight,
  CreditCard,
  Info,
  Moon,
  Smartphone,
  Sun,
  User,
} from 'lucide-react'
import { useAppTheme } from '@/components/theme-provider'

const settingsItems = [
  {
    href: '/settings/profile',
    icon: User,
    title: 'Profile',
    description: 'Name, email, phone',
  },
  {
    href: '/settings/payments',
    icon: CreditCard,
    title: 'Payments',
    description: 'UPI, cards, bank',
  },
  {
    href: '/settings/addresses',
    icon: Smartphone,
    title: 'Addresses',
    description: 'Saved addresses',
  },
  {
    href: '/settings/about',
    icon: Info,
    title: 'About',
    description: 'Version 1.0.0',
  },
]

export default function SettingsPage() {
  const { theme, toggleTheme } = useAppTheme()
  const darkMode = theme === 'dark'

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FFFFFF] px-2.5 py-4.5 text-zinc-950 dark:bg-[#050505] dark:text-white sm:px-4 sm:py-5">
      <div className="mx-auto max-w-[560px]">
        <div className="mb-2.5 sm:mb-3">
          <p className="text-[9px] font-medium uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-500">
            Settings
          </p>
          <h1 className="mt-1 text-[1.2rem] font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-[1.75rem]">
            Settings
          </h1>
        </div>

        <div className="overflow-hidden rounded-[20px] border border-zinc-100 bg-white shadow-none dark:border-white/5 dark:bg-[#0a0a0a]">
          <div className="divide-y divide-zinc-100 dark:divide-white/5">
            {settingsItems.slice(0, 3).map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="flex items-center gap-2.5 px-3.5 py-3 transition-colors hover:bg-white dark:hover:bg-white/3 sm:px-4 sm:py-3.5"
                >
                  <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-2xl border border-zinc-100 bg-white text-zinc-500 dark:border-white/8 dark:bg-white/5 dark:text-zinc-300">
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[0.85rem] font-semibold text-zinc-950 dark:text-white">
                      {item.title}
                    </div>
                  </div>
                  <div className="hidden text-[11px] text-zinc-500 dark:text-zinc-400 md:block">
                    {item.description}
                  </div>
                  <ChevronRight className="size-3.5 shrink-0 text-zinc-300 dark:text-zinc-600" />
                </Link>
              )
            })}

            <div className="flex items-center gap-2.5 px-3.5 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-white/3 sm:px-4 sm:py-3.5">
              <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-2xl border border-zinc-100 bg-white text-zinc-500 dark:border-white/8 dark:bg-white/5 dark:text-zinc-300">
                {darkMode ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[0.85rem] font-semibold text-zinc-950 dark:text-white">
                  Dark Mode
                </div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className={`inline-flex h-5 w-9 shrink-0 items-center rounded-full border p-0.5 transition-colors ${
                  darkMode
                    ? 'border-violet-500/30 bg-violet-600 justify-end'
                    : 'border-zinc-200 bg-zinc-200 dark:border-white/10 dark:bg-zinc-800 justify-start'
                }`}
                aria-label="Toggle dark mode"
              >
                <span className="h-4 w-4 rounded-full bg-white shadow-[0_4px_10px_rgba(0,0,0,0.15)]" />
              </button>
            </div>

            <Link
              href="/settings/about"
              className="flex items-center gap-2.5 px-3.5 py-3 transition-colors hover:bg-white dark:hover:bg-white/3 sm:px-4 sm:py-3.5"
            >
              <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-2xl border border-zinc-100 bg-white text-zinc-500 dark:border-white/8 dark:bg-white/5 dark:text-zinc-300">
                <Info className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[0.85rem] font-semibold text-zinc-950 dark:text-white">
                  About
                </div>
              </div>
              <div className="hidden text-[11px] text-zinc-500 dark:text-zinc-400 md:block">
                Version 1.0.0
              </div>
              <ChevronRight className="size-3.5 shrink-0 text-zinc-300 dark:text-zinc-600" />
            </Link>
          </div>
        </div>

        <p className="mt-3.5 text-center text-[9px] tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
          SAM MARKET v1.0.0
        </p>
      </div>
    </div>
  )
}
