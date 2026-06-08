'use client'

import { useEffect, useState, useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { useRouter } from 'next/navigation'
import { Printer, Search } from 'lucide-react'
import { api } from '@/convex/_generated/api'
import { Pagination } from '@/components/ui/pagination'

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

function AdminPunchSheet({ punchSheet, offset }: {
  punchSheet: PunchSheetEntry[]
  offset: number
}) {
  return (
    <table className="w-full text-left text-sm border-collapse">
      <thead>
        <tr className="border-b border-zinc-200 dark:border-black text-xs font-semibold text-zinc-800 dark:text-white">
          <th className="py-3 px-2 w-8">S.No</th>
          <th className="py-3 px-2">Employee</th>
          <th className="py-3 px-2">Department</th>
          <th className="py-3 px-2">Status</th>
          <th className="py-3 px-2">Check In</th>
          <th className="py-3 px-2">Check Out</th>
          <th className="py-3 px-2 text-right">Hours</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-200 dark:divide-black">
        {punchSheet.length === 0 ? (
          <tr>
            <td className="py-8 px-2 text-center text-zinc-400 font-medium" colSpan={7}>
              No employees found. Add employees in the Employee section first.
            </td>
          </tr>
        ) : (
          punchSheet.map((entry, idx) => {
            const sno = offset + idx + 1
            const emp = entry.employee
            const s = entry.session
            const isActive = s && s.punchOutAt === null
            const isComplete = s && s.punchOutAt !== null
            const diff = s ? ((s.punchOutAt ?? Date.now()) - s.punchInAt) / (1000 * 60 * 60) : 0
            return (
              <tr key={emp._id} className="hover:bg-zinc-50/50 transition-colors dark:hover:bg-black">
                <td className="py-4 px-2 text-xs text-zinc-400 font-mono">{sno}</td>
                <td className="py-4 px-2">
                  <button type="button" onClick={() => window.open(`/employee-attendance?email=${encodeURIComponent(emp.email)}&name=${encodeURIComponent(emp.fullName)}`, '_blank')} className="text-left font-semibold text-zinc-800 hover:text-[#6c47ff] transition-colors cursor-pointer">
                    {emp.fullName}
                  </button>
                  <div className="text-[10px] font-medium text-zinc-400 mt-0.5">{emp.email}</div>
                </td>
                <td className="py-4 px-2 text-zinc-700">
                  {emp.department ? (
                    <span className="inline-block rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
                      {emp.department}
                    </span>
                  ) : (
                    <span className="text-zinc-300 text-xs">—</span>
                  )}
                </td>
                <td className="py-4 px-2">
                  {!s ? (
                    <span className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
                      <span className="h-2 w-2 rounded-full bg-zinc-300 inline-block" />
                      Not Punched
                    </span>
                  ) : isActive ? (
                    <span className="flex items-center gap-1.5 text-amber-600 text-xs font-semibold">
                      <span className="h-2 w-2 rounded-full bg-amber-500 inline-block animate-pulse" />
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                      Completed
                    </span>
                  )}
                </td>
                <td className="py-4 px-2 font-medium text-zinc-700">
                  {s ? formatTime(s.punchInAt) : <span className="text-zinc-300">—</span>}
                </td>
                <td className="py-4 px-2 font-medium text-zinc-700">
                  {isComplete ? formatTime(s!.punchOutAt) : <span className="text-zinc-300">—</span>}
                </td>
                <td className="py-4 px-2 font-bold text-zinc-950 text-right">
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
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const viewer = useQuery(api.users.viewer)
  const isAdmin = viewer?.role === 'admin' || user?.publicMetadata?.role === 'admin'

  const viewerIdentity = isLoaded && user
    ? {
        viewerId: user.id,
        viewerName: user.fullName ?? user.username ?? null,
        viewerEmail: user.primaryEmailAddress?.emailAddress ?? null,
      }
    : null

  const [searchQuery, setSearchQuery] = useState('')

  const punchSheet = useQuery(
    api.attendance.getPunchSheet,
    viewerIdentity ?? 'skip',
  )

  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10
  const allPunchSheet = punchSheet ?? []

  const filteredPunchSheet = useMemo(() => {
    if (!searchQuery.trim()) return allPunchSheet
    const q = searchQuery.toLowerCase()
    return allPunchSheet.filter((e) =>
      e.employee.fullName.toLowerCase().includes(q),
    )
  }, [allPunchSheet, searchQuery])

  const paginatedPunchSheet = filteredPunchSheet.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [searchQuery])

  useEffect(() => {
    if (isLoaded && viewerIdentity && !isAdmin) {
      router.replace('/')
    }
  }, [isLoaded, viewerIdentity, isAdmin, router])

  const handlePrint = () => window.print()

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-zinc-400 text-sm font-medium">
        Loading...
      </div>
    )
  }

  if (viewerIdentity && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-zinc-400 text-sm font-medium">
        Redirecting...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #punch-sheet-print-area, #punch-sheet-print-area * { visibility: visible; }
          #punch-sheet-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Employee Attendance</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Today&apos;s attendance status for all employees.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee..."
              className="w-48 rounded-lg border border-zinc-200 bg-white pl-8 pr-3 py-2 text-xs font-medium text-zinc-700 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none transition"
            />
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="no-print inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-xs transition cursor-pointer"
          >
            <Printer className="size-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      <section id="punch-sheet-print-area" className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs">
        <AdminPunchSheet punchSheet={paginatedPunchSheet} offset={(page - 1) * PAGE_SIZE} />
        <Pagination current={page} total={filteredPunchSheet.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </section>
    </div>
  )
}
