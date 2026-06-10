'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { CalendarRange, Clock3, FileText, Sparkles, TrendingUp, UserRoundCheck } from 'lucide-react'

function formatDisplayDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateRange(startDate: string, endDate: string) {
  return `${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}`
}

function formatDuration(request: {
  halfDay?: boolean
  periodWise?: boolean
}) {
  if (request.halfDay) return 'Half Day'
  if (request.periodWise) return 'Period Wise'
  return 'Full Day'
}

export default function LeavePage() {
  const router = useRouter()
  const { isLoaded, user } = useUser()
  const viewer = useQuery(api.users.viewer)
  const isAdmin = viewer?.role === 'admin'
  const viewerIdentity =
    isLoaded && user
      ? {
          viewerId: user.id,
          viewerName: user.fullName ?? user.username ?? null,
          viewerEmail: user.primaryEmailAddress?.emailAddress ?? null,
        }
      : null
  const leaveRequests = useQuery(api.leave.getMyLeaveRequests, viewerIdentity ?? 'skip') ?? []

  useEffect(() => {
    if (!isLoaded || viewer === undefined) return

    if (viewer?.approvalStatus === 'pending' && !isAdmin) {
      router.replace('/pending-approval')
      return
    }

    if (viewer?.approvalStatus === 'declined' && !isAdmin) {
      router.replace('/denied')
      return
    }

    if (isAdmin) {
      router.replace('/')
    }
  }, [viewer, isAdmin, isLoaded, router])

  if (viewer !== undefined && isLoaded && isAdmin) {
    return null
  }

  if (!isLoaded || viewer === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-pulse text-sm text-zinc-400">Loading leave dashboard...</div>
      </div>
    )
  }

  const submittedCount = leaveRequests.filter((request) => request.status === 'submitted').length
  const approvedCount = leaveRequests.filter((request) => request.status === 'approved').length

  const stats = [
    { label: 'Leaves taken', value: String(leaveRequests.length), helper: 'Saved requests', icon: UserRoundCheck },
    { label: 'Pending review', value: String(submittedCount), helper: 'Awaiting action', icon: Clock3 },
    { label: 'Upcoming leave', value: String(submittedCount), helper: 'Next requests', icon: CalendarRange },
    { label: 'Approved', value: String(approvedCount), helper: 'Completed', icon: TrendingUp },
  ]

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[36px] border border-white/70 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.10),_transparent_24%),linear-gradient(135deg,_rgba(255,255,255,0.92),_rgba(248,250,252,0.78))] p-6 shadow-[0_24px_90px_rgba(99,102,241,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.10),_transparent_22%),linear-gradient(135deg,_rgba(9,9,11,0.92),_rgba(3,7,18,0.78))] lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-sky-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-sky-300">
              <Sparkles className="size-3.5" />
              Staff leave workspace
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
              Apply Leave
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300 sm:text-base">
              Manage balances and review saved leave requests in a premium HRM-style interface.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/leave/apply"
                className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,_#9f1239,_#be185d,_#db2777)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(190,24,93,0.24)] transition hover:-translate-y-px hover:shadow-[0_22px_48px_rgba(190,24,93,0.30)]"
              >
                Apply Leave
              </Link>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Start a new request from the dashboard.
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="rounded-[24px] border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">{stat.label}</p>
                      <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">{stat.value}</p>
                    </div>
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-300">
                      <Icon className="size-5" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{stat.helper}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="rounded-[34px] border border-white/70 bg-white/82 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/72">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
              <FileText className="size-3.5" />
              Saved leave requests
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              Leave request table
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Every save from the form is stored here and shown back on the Leave page.
            </p>
          </div>
          <div className="rounded-[22px] border border-white/70 bg-white/70 px-4 py-3 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
            Total requests: <span className="font-semibold text-zinc-950 dark:text-white">{leaveRequests.length}</span>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[28px] border border-zinc-200/80 dark:border-zinc-800">
          <div className="grid grid-cols-[1.1fr_1.15fr_1.15fr_1.7fr_0.8fr] gap-4 bg-zinc-50 px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:bg-white/5 dark:text-zinc-400">
            <div>Leave Type</div>
            <div>Date Range</div>
            <div>Duration</div>
            <div>Reason</div>
            <div>Status</div>
          </div>

          {leaveRequests.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No leave requests saved yet. Use Apply Leave to create your first request.
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {leaveRequests.map((request) => (
                <div
                  key={request._id}
                  className="grid grid-cols-[1.1fr_1.15fr_1.15fr_1.7fr_0.8fr] gap-4 px-5 py-4 text-sm transition hover:bg-zinc-50/80 dark:hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-zinc-950 dark:text-white">{request.leaveType}</p>
                  </div>
                  <div className="text-zinc-600 dark:text-zinc-300">{formatDateRange(request.startDate, request.endDate)}</div>
                  <div className="min-w-0">
                    <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">
                      {formatDuration(request)}
                    </span>
                  </div>
                  <div className="min-w-0 text-zinc-600 dark:text-zinc-300">
                    <p className="line-clamp-2">{request.reason}</p>
                  </div>
                  <div className="flex items-start justify-start">
                    <span className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] bg-amber-500/10 text-amber-700 border-amber-200/70 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20">
                      {request.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Link
        href="/staff-dashboard"
        className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:-translate-y-px hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
      >
        <UserRoundCheck className="size-4" />
        Back to dashboard
      </Link>
    </div>
  )
}
