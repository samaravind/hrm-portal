'use client'

import { useEffect, useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { useRouter } from 'next/navigation'
import { Printer, Search } from 'lucide-react'
import { api } from '@/convex/_generated/api'
import { Pagination } from '@/components/ui/pagination'
import { hrmsSectionClass, hrmsTableClass, hrmsTableEmptyClass, hrmsTableHeadRowClass, hrmsTableRowClass } from '@/components/ui/hrms-table'

function formatTime(timestamp: number | null) {
  if (!timestamp) return '--:--'
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(timestamp))
}

type PunchSheetEntry = {
  employee: {
    _id: string
    fullName: string
    email: string
    department: string
    position: string
    employeeId: string
    employeeType: string
    role: string
  }
  session: {
    _id: string
    punchInAt: number
    punchOutAt: number | null
    dateKey: string
  } | null
}

function PunchStatusBadge({ session }: { session: PunchSheetEntry['session'] }) {
  if (!session) {
    return (
      <span className="inline-flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
        <span className="h-2 w-2 rounded-full bg-zinc-300 inline-block" />
        Not Punched
      </span>
    )
  }

  if (session.punchOutAt === null) {
    return (
      <span className="inline-flex items-center gap-1.5 text-amber-600 text-xs font-semibold">
        <span className="h-2 w-2 rounded-full bg-amber-500 inline-block animate-pulse" />
        Active
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
      <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
      Completed
    </span>
  )
}

function PunchSheetCardList({
  punchSheet,
  offset,
  now,
}: {
  punchSheet: PunchSheetEntry[]
  offset: number
  now: number
}) {
  if (punchSheet.length === 0) {
    return (
      <div className="rounded-[24px] border border-white/70 bg-white/80 px-4 py-8 text-center text-sm text-zinc-500 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/75 dark:text-zinc-400">
        No employees found. Add employees in the Employee section first.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {punchSheet.map((entry, idx) => {
        const sno = offset + idx + 1
        const emp = entry.employee
        const s = entry.session
        const diff = s ? ((s.punchOutAt ?? now) - s.punchInAt) / (1000 * 60 * 60) : 0

        return (
          <article
            key={emp._id}
            className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-[0_16px_40px_rgba(99,102,241,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_52px_rgba(99,102,241,0.12)] dark:border-white/10 dark:bg-zinc-950/75"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                  S.No {sno}
                </p>
                <button
                  type="button"
                  onClick={() => window.open(`/employee-attendance?email=${encodeURIComponent(emp.email)}&name=${encodeURIComponent(emp.fullName)}`, '_blank')}
                  className="mt-1 block text-left text-base font-semibold tracking-tight text-zinc-950 transition hover:text-indigo-600 dark:text-white dark:hover:text-indigo-300"
                >
                  {emp.fullName}
                </button>
                <p className="break-all text-xs text-zinc-400 dark:text-zinc-500 sm:break-normal">{emp.email}</p>
              </div>
              <div className="shrink-0 rounded-full bg-white/70 px-3 py-1.5 shadow-sm dark:bg-white/5">
                <PunchStatusBadge session={s} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-2xl bg-gradient-to-br from-indigo-50/80 to-white px-3 py-2.5 dark:from-white/5 dark:to-white/0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Department</p>
                <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">{emp.department || '—'}</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-fuchsia-50/80 to-white px-3 py-2.5 dark:from-white/5 dark:to-white/0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Hours</p>
                <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  {s ? `${diff.toFixed(2)}h` : '—'}
                </p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-cyan-50/80 to-white px-3 py-2.5 dark:from-white/5 dark:to-white/0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Check In</p>
                <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  {s ? formatTime(s.punchInAt) : '—'}
                </p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50/80 to-white px-3 py-2.5 dark:from-white/5 dark:to-white/0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Check Out</p>
                <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  {s ? (s.punchOutAt ? formatTime(s.punchOutAt) : 'Active') : '—'}
                </p>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function AdminPunchSheet({
  punchSheet,
  offset,
  now,
}: {
  punchSheet: PunchSheetEntry[]
  offset: number
  now: number
}) {
  return (
    <table className={hrmsTableClass}>
      <colgroup>
        <col className="w-[5%]" />
        <col className="w-[30%]" />
        <col className="w-[16%]" />
        <col className="w-[16%]" />
        <col className="w-[13%]" />
        <col className="w-[13%]" />
        <col className="w-[7%]" />
      </colgroup>
      <thead>
        <tr className={hrmsTableHeadRowClass}>
          <th className="py-3 px-4">S.No</th>
          <th className="py-3 px-4">Employee</th>
          <th className="py-3 px-4">Department</th>
          <th className="py-3 px-4">Status</th>
          <th className="py-3 px-4">Check In</th>
          <th className="py-3 px-4">Check Out</th>
          <th className="py-3 px-4 text-right">Hours</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
        {punchSheet.length === 0 ? (
          <tr>
          <td className={hrmsTableEmptyClass} colSpan={7}>
              No employees found. Add employees in the Employee section first.
            </td>
          </tr>
        ) : (
          punchSheet.map((entry, idx) => {
            const sno = offset + idx + 1
            const emp = entry.employee
            const s = entry.session
            const diff = s ? ((s.punchOutAt ?? now) - s.punchInAt) / (1000 * 60 * 60) : 0

            return (
              <tr key={emp._id} className={hrmsTableRowClass}>
                <td className="px-4 py-4 text-xs font-mono font-semibold text-zinc-400 dark:text-zinc-500">{sno}</td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => window.open(`/employee-attendance?email=${encodeURIComponent(emp.email)}&name=${encodeURIComponent(emp.fullName)}`, '_blank')}
                    className="block text-left font-semibold text-zinc-900 transition hover:text-[#6c47ff] dark:text-zinc-100"
                  >
                    {emp.fullName}
                  </button>
                  <div className="mt-0.5 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">{emp.email}</div>
                </td>
                <td className="px-4 py-4">
                  {emp.department ? (
                    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                      {emp.department}
                    </span>
                  ) : (
                    <span className="text-zinc-300 text-xs">—</span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <PunchStatusBadge session={s} />
                </td>
                <td className="px-4 py-4 font-medium text-zinc-700 dark:text-zinc-200">
                  {s ? formatTime(s.punchInAt) : <span className="text-zinc-300">—</span>}
                </td>
                <td className="px-4 py-4 font-medium text-zinc-700 dark:text-zinc-200">
                  {s ? (s.punchOutAt ? formatTime(s.punchOutAt) : 'Active') : <span className="text-zinc-300">—</span>}
                </td>
                <td className="px-4 py-4 text-right font-bold text-zinc-950 dark:text-zinc-100">
                  {s ? `${diff.toFixed(2)}h` : <span className="text-zinc-300">—</span>}
                </td>
              </tr>
            )
          })
        )}
      </tbody>
    </table>
  )
}

export default function EmployeeAttendancePage() {
  const { isLoaded, user } = useUser()
  const router = useRouter()
  const viewer = useQuery(api.users.viewer)
  const isAdmin = viewer?.role === 'admin'

  const viewerIdentity = useMemo(
    () =>
      isLoaded && user
        ? {
            viewerId: user.id,
            viewerName: user.fullName ?? user.username ?? null,
            viewerEmail: user.primaryEmailAddress?.emailAddress ?? null,
          }
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      isLoaded,
      user,
      user?.id,
      user?.fullName,
      user?.username,
      user?.primaryEmailAddress?.emailAddress,
    ],
  )

  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [now, setNow] = useState(() => Date.now())

  const punchSheet = useQuery(api.attendance.getPunchSheet, viewerIdentity ?? 'skip')
  const allPunchSheet = useMemo(() => punchSheet ?? [], [punchSheet])
  const PAGE_SIZE = 10

  const filteredPunchSheet = useMemo(() => {
    if (!searchQuery.trim()) return allPunchSheet
    const q = searchQuery.toLowerCase()
    return allPunchSheet.filter((e) => e.employee.fullName.toLowerCase().includes(q))
  }, [allPunchSheet, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredPunchSheet.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginatedPunchSheet = filteredPunchSheet.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (isLoaded && viewerIdentity && !isAdmin) {
      router.replace('/')
    }
  }, [isLoaded, viewerIdentity, isAdmin, router])

  const handlePrint = () => window.print()

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm font-medium text-zinc-400">
        Loading...
      </div>
    )
  }

  if (viewerIdentity && !isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm font-medium text-zinc-400">
        Redirecting...
      </div>
    )
  }

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #punch-sheet-print-area, #punch-sheet-print-area * { visibility: visible; }
          #punch-sheet-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
            Employee Attendance
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Today&apos;s attendance status for all employees.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee..."
              className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-zinc-700 placeholder:text-zinc-400 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-black dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
            />
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="no-print inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-xs transition hover:border-zinc-300 hover:bg-zinc-50 cursor-pointer dark:border-zinc-800 dark:bg-black dark:text-white dark:hover:bg-zinc-950"
          >
            <Printer className="size-4" />
            Export PDF
          </button>
        </div>
      </div>

      <section
        id="punch-sheet-print-area"
        className={hrmsSectionClass}
      >
        <div className="md:hidden">
          <PunchSheetCardList punchSheet={paginatedPunchSheet} offset={(currentPage - 1) * PAGE_SIZE} now={now} />
        </div>

        <div className="hidden overflow-x-auto md:block">
          <AdminPunchSheet punchSheet={paginatedPunchSheet} offset={(currentPage - 1) * PAGE_SIZE} now={now} />
        </div>

        <div className="border-t border-zinc-200/70 px-4 py-4 dark:border-zinc-900 sm:px-5">
          <Pagination current={currentPage} total={filteredPunchSheet.length} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>
      </section>
    </div>
  )
}
