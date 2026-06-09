'use client'

import { Suspense, useMemo, useState } from 'react'
import { useQuery } from 'convex/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/convex/_generated/api'
import { Calendar, TrendingUp, Timer } from 'lucide-react'
import { Pagination } from '@/components/ui/pagination'

function formatTime(timestamp: number | null) {
  if (!timestamp) return '--:--'
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(timestamp))
}

function formatDate(dateKey: string) {
  const d = new Date(dateKey + 'T00:00:00')
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
}

export default function EmployeeAttendanceHistoryPage() {
  return (
    <Suspense fallback={<div className="p-6 text-zinc-500">Loading...</div>}>
      <EmployeeAttendanceContent />
    </Suspense>
  )
}

function EmployeeAttendanceContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const name = searchParams.get('name')
  const from = searchParams.get('from') ?? ''
  const [now] = useState(() => Date.now())
  const [page, setPage] = useState(1)

  const employeeSessions = useQuery(
    api.attendance.getEmployeeSessions,
    email ? { email } : 'skip',
  ) ?? []
  const sessions = employeeSessions

  const filteredSessions = useMemo(() => {
    if (!from) return sessions
    return sessions.filter((s) => s.dateKey >= from)
  }, [sessions, from])

  const setFrom = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('from', value)
    } else {
      params.delete('from')
    }
    setPage(1)
    router.replace(`/employee-attendance?${params.toString()}`, { scroll: false })
  }

  const totalHours = useMemo(() => {
    let sum = 0
    for (const s of filteredSessions) {
      if (s.punchOutAt) {
        sum += (s.punchOutAt - s.punchInAt) / (1000 * 60 * 60)
      }
    }
    return sum.toFixed(1)
  }, [filteredSessions])

  const daysPresent = useMemo(() => {
    const unique = new Set(filteredSessions.map((s) => s.dateKey))
    return unique.size
  }, [filteredSessions])

  const PAGE_SIZE = 10
  const paginatedSessions = filteredSessions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-5 px-3 py-5 sm:px-5 md:px-6 lg:px-8 lg:py-8">
      <section className="rounded-[28px] border border-zinc-200 bg-white px-4 py-4 shadow-xs dark:border-zinc-900 dark:bg-zinc-950 sm:px-5 sm:py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-400 dark:text-zinc-500">
              Employee Profile
            </p>
            <h1 className="mt-2 break-words text-xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-2xl">
              {name || 'Employee Attendance'}
            </h1>
            <p className="mt-1 break-all text-sm text-zinc-500 dark:text-zinc-400 sm:break-normal">
              {email || ''}
            </p>
          </div>
          <div className="inline-flex w-fit items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            Attendance History
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-900 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-blue-500" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">Total Hours</h3>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{totalHours}</p>
        </div>
        <div className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-900 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <Timer className="size-4 text-emerald-500" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">Days Present</h3>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{daysPresent}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-xs dark:border-zinc-900 dark:bg-zinc-950 sm:flex-1">
          <Calendar className="size-4 shrink-0 text-zinc-400" />
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
              Filter from
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
        </div>
        {from && (
          <button
            onClick={() => setFrom('')}
            className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900 sm:w-auto"
          >
            Clear
          </button>
        )}
      </div>

      <section className="min-w-0 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-xs dark:border-zinc-900 dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs font-semibold text-zinc-800 dark:border-zinc-900 dark:text-zinc-100">
                <th className="w-8 px-3 py-3">#</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Check In</th>
                <th className="px-3 py-3">Check Out</th>
                <th className="px-3 py-3 text-right">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {paginatedSessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                paginatedSessions.map((s, idx) => {
                  const sno = (page - 1) * PAGE_SIZE + idx + 1
                  const diff = s.punchOutAt
                    ? (s.punchOutAt - s.punchInAt) / (1000 * 60 * 60)
                    : (now - s.punchInAt) / (1000 * 60 * 60)
                  return (
                    <tr key={s._id} className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/60">
                      <td className="px-3 py-3 font-mono text-xs text-zinc-400">{sno}</td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-zinc-800 dark:text-zinc-100">{formatDate(s.dateKey)}</div>
                      </td>
                      <td className="px-3 py-3 font-medium text-zinc-700 dark:text-zinc-200">{formatTime(s.punchInAt)}</td>
                      <td className="px-3 py-3 font-medium text-zinc-700 dark:text-zinc-200">
                        {s.punchOutAt ? formatTime(s.punchOutAt) : <span className="font-semibold text-amber-500">Active</span>}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-zinc-950 dark:text-zinc-100">{diff.toFixed(2)}h</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination current={page} total={filteredSessions.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </section>
    </div>
  )
}
