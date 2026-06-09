'use client'

import { useEffect } from 'react'
import { useClerk, useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { useRouter } from 'next/navigation'
import { api } from '@/convex/_generated/api'
import { CheckCircle2, LoaderCircle, LogOut, ShieldCheck, Sparkles } from 'lucide-react'

export default function PendingApprovalPage() {
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

    if (viewer?.approvalStatus === 'declined') {
      router.replace('/denied')
      return
    }

    if (viewer?.approvalStatus !== 'pending') {
      router.replace('/')
    }
  }, [isLoaded, isSignedIn, router, viewer])

  const handleSignOut = async () => {
    await clerk.signOut()
    router.replace('/sign-in')
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(236,72,153,0.14),_transparent_26%),linear-gradient(135deg,_#fbfdff,_#f5f7ff_35%,_#fdf2f8)] px-6 py-16 dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.22),_transparent_24%),linear-gradient(135deg,_#020617,_#0f172a_50%,_#111827)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-8 top-10 size-72 rounded-full bg-indigo-400/15 blur-3xl" />
        <div className="absolute right-8 top-1/2 size-96 rounded-full bg-fuchsia-400/10 blur-3xl" />
      </div>

      <section className="relative w-full max-w-2xl overflow-hidden rounded-[36px] border border-white/80 bg-white/85 p-6 shadow-[0_24px_100px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/80 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.08),_transparent_25%),radial-gradient(circle_at_bottom_left,_rgba(236,72,153,0.08),_transparent_20%)]" />
        <div className="relative space-y-8">
          <div className="flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-indigo-300">
              <Sparkles className="size-3.5" />
              Access pending
            </div>
            <div className="rounded-full border border-white/80 bg-white/80 p-3 text-indigo-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-indigo-300">
              <ShieldCheck className="size-5" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
              Your account is waiting for admin approval
            </h1>
            <p className="max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              We created your account successfully. An admin needs to accept it before you can enter the dashboard.
              Once approved, you will be able to access the app normally.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/80 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
              <CheckCircle2 className="size-5 text-emerald-500" />
              <p className="mt-3 text-sm font-semibold text-zinc-950 dark:text-white">Account created</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Your sign-up is complete.</p>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
              <LoaderCircle className="size-5 animate-spin text-indigo-500" />
              <p className="mt-3 text-sm font-semibold text-zinc-950 dark:text-white">Waiting for review</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">An admin will approve your access.</p>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
              <ShieldCheck className="size-5 text-fuchsia-500" />
              <p className="mt-3 text-sm font-semibold text-zinc-950 dark:text-white">Protected workspace</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Only approved users can enter.</p>
            </div>
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
              <LoaderCircle className="size-4" />
              Check again
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
