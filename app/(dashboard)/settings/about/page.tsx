'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Building, Clock, Shield, ShoppingBag, Users } from 'lucide-react'

export default function AboutPage() {
  const router = useRouter()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 text-zinc-900 dark:text-white">
      <button
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-zinc-800 cursor-pointer dark:text-zinc-400 dark:hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Back to Settings
      </button>

      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:border dark:border-zinc-900 dark:bg-black">
          <ShoppingBag className="size-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">SAM MARKET</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Employee Management System</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-900 dark:bg-black">
          <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-800 dark:text-white">
            <Building className="size-4 text-zinc-400 dark:text-zinc-500" />
            About SAM MARKET
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            SAM MARKET is a comprehensive employee management platform designed to streamline workforce operations.
            It provides tools for tracking attendance, managing employee records, role-based access control,
            and generating insightful reports. Built with modern web technologies to ensure a fast,
            reliable, and intuitive experience for administrators and staff alike.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-900 dark:bg-black">
          <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-800 dark:text-white">
            <Clock className="size-4 text-zinc-400 dark:text-zinc-500" />
            Version
          </h2>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">1.0.0</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-900 dark:bg-black">
          <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-800 dark:text-white">
            <Shield className="size-4 text-zinc-400 dark:text-zinc-500" />
            Features
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
            <li className="flex items-center gap-2">• Employee attendance tracking with punch in/out</li>
            <li className="flex items-center gap-2">• Employee directory with role management</li>
            <li className="flex items-center gap-2">• Admin and staff role-based access control</li>
            <li className="flex items-center gap-2">• Attendance history with date filters</li>
            <li className="flex items-center gap-2">• Dark mode support</li>
          </ul>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-900 dark:bg-black">
          <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-800 dark:text-white">
            <Users className="size-4 text-zinc-400 dark:text-zinc-500" />
            Tech Stack
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {['Next.js', 'Convex', 'Clerk', 'Tailwind CSS', 'TypeScript'].map((t) => (
              <span
                key={t}
                className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-zinc-400 dark:text-zinc-500">© 2026 SAM MARKET. All rights reserved.</p>
    </div>
  )
}
