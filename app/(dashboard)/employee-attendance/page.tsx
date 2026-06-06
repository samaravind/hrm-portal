'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
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

  const sessions = useQuery(
    api.attendance.getEmployeeSessions,
    email ? { email } : 'skip',
  ) ?? []

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

  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10
  const paginatedSessions = filteredSessions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [from])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">{name || 'Employee Attendance'}</h1>
        <p className="mt-1 text-sm text-zinc-500">{email || ''}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-blue-500" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Hours</h3>
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{totalHours}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2">
            <Timer className="size-4 text-emerald-500" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Days Present</h3>
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{daysPresent}</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <Calendar className="size-4 text-zinc-400 shrink-0" />
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none"
        />
        {from && (
          <button
            onClick={() => setFrom('')}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-500 hover:bg-zinc-50 transition cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 text-xs font-semibold text-zinc-800">
                <th className="py-3 px-3 w-8">#</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Check In</th>
                <th className="py-3 px-3">Check Out</th>
                <th className="py-3 px-3 text-right">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginatedSessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-zinc-400">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                paginatedSessions.map((s, idx) => {
                  const sno = (page - 1) * PAGE_SIZE + idx + 1
                  const diff = s.punchOutAt
                    ? (s.punchOutAt - s.punchInAt) / (1000 * 60 * 60)
                    : (Date.now() - s.punchInAt) / (1000 * 60 * 60)
                  return (
                    <tr key={s._id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-3 px-3 text-xs text-zinc-400 font-mono">{sno}</td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-zinc-800">{formatDate(s.dateKey)}</div>
                      </td>
                      <td className="py-3 px-3 font-medium text-zinc-700">{formatTime(s.punchInAt)}</td>
                      <td className="py-3 px-3 font-medium text-zinc-700">
                        {s.punchOutAt ? formatTime(s.punchOutAt) : <span className="text-amber-500 font-semibold">Active</span>}
                      </td>
                      <td className="py-3 px-3 font-bold text-zinc-950 text-right">{diff.toFixed(2)}h</td>
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
