'use client'

import { useEffect } from 'react'
import { useClerk, useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { useRouter } from 'next/navigation'
import { api } from '@/convex/_generated/api'
import { Ban, LogOut, Sparkles } from 'lucide-react'

export default function DeniedPage() {
  const router = useRouter()
  const clerk = useClerk()
  const { isLoaded, isSignedIn } = useUser()
  const viewer = useQuery(api.users.viewer)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || viewer === undefined) return
    if (viewer?.role === 'admin') {
      router.replace('/')
      return
    }
    if (viewer?.approvalStatus === 'pending') {
      router.replace('/pending-approval')
      return
    }
    if (viewer?.approvalStatus !== 'declined') {
      router.replace('/')
    }
  }, [isLoaded, isSignedIn, router, viewer])

  const handleSignOut = async () => {
    await clerk.signOut()
    router.replace('/sign-in')
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.12),_transparent_26%),linear-gradient(135deg,_#fbfdff,_#fef2f2_35%,_#fff7ed)] px-6 py-16 dark:bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.24),_transparent_24%),linear-gradient(135deg,_#020617,_#0f172a_50%,_#111827)]">
      <section className="relative w-full max-w-2xl overflow-hidden rounded-[36px] border border-white/80 bg-white/85 p-6 shadow-[0_24px_100px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/80 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(239,68,68,0.08),_transparent_25%),radial-gradient(circle_at_bottom_left,_rgba(99,102,241,0.08),_transparent_20%)]" />
        <div className="relative space-y-8">
          <div className="flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-rose-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-rose-300">
              <Sparkles className="size-3.5" />
              Access denied
            </div>
            <div className="rounded-full border border-white/80 bg-white/80 p-3 text-rose-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-rose-300">
              <Ban className="size-5" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
              Your account was declined by an admin
            </h1>
            <p className="max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              This account cannot enter the dashboard. If this looks wrong, ask an admin to review your access again.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-5 py-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              Check again
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
