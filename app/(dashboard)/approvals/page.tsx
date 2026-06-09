'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { ArrowLeft, CheckCircle2, XCircle, Bell, Sparkles, Users } from 'lucide-react'

export default function ApprovalsPage() {
  const router = useRouter()
  const { isLoaded } = useUser()
  const viewer = useQuery(api.users.viewer)
  const pendingApprovals = useQuery(api.users.listPendingApprovals) ?? []
  const approveUser = useMutation(api.users.approveUserByTokenIdentifier)
  const declineUser = useMutation(api.users.declineUserByTokenIdentifier)
  const [workingToken, setWorkingToken] = useState<string | null>(null)

  const isAdmin = viewer?.role === 'admin'

  useEffect(() => {
    if (!isLoaded || viewer === undefined) return

    if (viewer?.approvalStatus === 'pending' && viewer?.role !== 'admin') {
      router.replace('/pending-approval')
      return
    }

    if (viewer?.approvalStatus === 'declined' && viewer?.role !== 'admin') {
      router.replace('/denied')
      return
    }

    if (!isAdmin) {
      router.replace('/staff-dashboard')
    }
  }, [viewer, isAdmin, isLoaded, router])

  const handleApprove = async (tokenIdentifier: string) => {
    setWorkingToken(tokenIdentifier)
    try {
      await approveUser({ tokenIdentifier })
      router.refresh()
    } finally {
      setWorkingToken(null)
    }
  }

  const handleDecline = async (tokenIdentifier: string) => {
    setWorkingToken(tokenIdentifier)
    try {
      await declineUser({ tokenIdentifier })
      router.refresh()
    } finally {
      setWorkingToken(null)
    }
  }

  if (viewer !== undefined && isLoaded && viewer?.approvalStatus === 'pending' && viewer?.role !== 'admin') {
    return null
  }

  if (viewer !== undefined && isLoaded && viewer?.approvalStatus === 'declined' && viewer?.role !== 'admin') {
    return null
  }

  if (viewer !== undefined && isLoaded && !isAdmin) {
    return null
  }

  return (
    <div className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(236,72,153,0.14),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(20,184,166,0.10),_transparent_22%)]" />
      <div className="space-y-6">
        <section className="rounded-[36px] border border-white/70 bg-gradient-to-br from-white/90 via-rose-50/70 to-amber-50/70 p-6 shadow-[0_24px_90px_rgba(99,102,241,0.10)] backdrop-blur-xl dark:border-white/10 dark:from-zinc-950/85 dark:via-zinc-950/75 dark:to-zinc-900/70 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                <ArrowLeft className="size-4" />
                Back to dashboard
              </Link>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-rose-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-rose-300">
                <Sparkles className="size-3.5" />
                Admin approvals
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                Review access requests
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300 sm:text-base">
                New users who signed up will appear here. Click Approve to let them into the app, or Decline to deny access.
              </p>
            </div>

            <div className="inline-flex items-center gap-3 rounded-3xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-300">
                <Bell className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Waiting</p>
                <p className="text-lg font-semibold text-zinc-950 dark:text-white">{pendingApprovals.length}</p>
              </div>
              <Users className="size-5 text-zinc-400" />
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/75 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70">
          {pendingApprovals.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-zinc-200 bg-zinc-50 px-4 py-16 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-white/5 dark:text-zinc-400">
              No pending approvals right now.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {pendingApprovals.map((entry) => (
                <div
                  key={entry.tokenIdentifier}
                  className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-zinc-950 dark:text-white">
                          {entry.name || 'New user'}
                        </p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                          Email
                        </p>
                        <p className="truncate text-sm text-zinc-600 dark:text-zinc-300">
                          {entry.email || entry.name || 'Email pending'}
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                        Pending
                    </span>
                  </div>

                  <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                    Token: {entry.tokenIdentifier.slice(0, 18)}...
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(entry.tokenIdentifier)}
                      disabled={workingToken === entry.tokenIdentifier}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                    >
                      <CheckCircle2 className="size-4" />
                      {workingToken === entry.tokenIdentifier ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecline(entry.tokenIdentifier)}
                      disabled={workingToken === entry.tokenIdentifier}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/15"
                    >
                      <XCircle className="size-4" />
                      {workingToken === entry.tokenIdentifier ? 'Declining...' : 'Decline'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
