'use client'

import { Suspense, useMemo, useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery } from 'convex/react'
import { 
  Calendar, 
  Clock3, 
  UserX, 
  LogOut, 
  TrendingUp, 
  Timer, 
  ClipboardCheck, 
  LogIn,
} from 'lucide-react'
import type { Doc } from '@/convex/_generated/dataModel'
import { api } from '@/convex/_generated/api'
import { Pagination } from '@/components/ui/pagination'
import { DatePicker } from '@/components/ui/date-picker'
import { hrmsSectionClass, hrmsTableClass, hrmsTableEmptyClass, hrmsTableHeadRowClass, hrmsTableRowClass, hrmsTableViewportClass } from '@/components/ui/hrms-table'

const DATE_LOCALE = 'en-US'

function getOrdinalSuffix(day: number) {
  if (day > 3 && day < 21) return 'th'
  switch (day % 10) {
    case 1:  return 'st'
    case 2:  return 'nd'
    case 3:  return 'rd'
    default: return 'th'
  }
}

function formatTodayDate(date: Date) {
  const weekday = new Intl.DateTimeFormat(DATE_LOCALE, { weekday: 'long' }).format(date)
  const month = new Intl.DateTimeFormat(DATE_LOCALE, { month: 'long' }).format(date)
  const dayNum = date.getDate()
  const year = date.getFullYear()
  return `${weekday}, ${month} ${dayNum}${getOrdinalSuffix(dayNum)}, ${year}`
}

function formatTime(timestamp: number | null) {
  if (!timestamp) return '--:--'
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(new Date(timestamp))
}

function formatTimeWithSeconds(timestamp: number | null) {
  if (!timestamp) return '--:--:--'
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(new Date(timestamp))
}

function formatDateAndDay(timestamp: number) {
  const date = new Date(timestamp)
  const dateStr = new Intl.DateTimeFormat(DATE_LOCALE, {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  }).format(date)
  const dayStr = new Intl.DateTimeFormat(DATE_LOCALE, {
    weekday: 'long'
  }).format(date).toUpperCase()
  return { dateStr, dayStr }
}

export default function MyAttendancePage() {
  return (
    <Suspense fallback={<div className="p-6 text-zinc-500">Loading...</div>}>
      <MyAttendanceContent />
    </Suspense>
  )
}

function MyAttendanceContent() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') ?? ''

  const viewerIdentity = isLoaded && user ? {
    viewerId: user.id,
    viewerName: user.fullName ?? user.username ?? null,
    viewerEmail: user.primaryEmailAddress?.emailAddress ?? null,
  } : null

  const session = useQuery(
    api.attendance.getTodaySession,
    viewerIdentity ?? 'skip'
  )
  const attendanceRecords = useQuery(
    api.attendance.getMySessions,
    viewerIdentity ?? 'skip'
  ) ?? []

  const setFrom = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('from', value)
    } else {
      params.delete('from')
    }
    router.replace(`/my-attendance?${params.toString()}`, { scroll: false })
  }

  const filteredRecords = useMemo(() => {
    if (!from) return attendanceRecords
    return attendanceRecords.filter((r) => r.dateKey >= from)
  }, [attendanceRecords, from])

  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10
  const totalRecords = filteredRecords.length
  const paginatedRecords = filteredRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const punchIn = useMutation(api.attendance.punchIn)
  const punchOut = useMutation(api.attendance.punchOut)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localSession, setLocalSession] = useState<Doc<'attendanceSessions'> | null>(null)

  useEffect(() => { setPage(1) }, [from])

  const activeSession = localSession ?? session ?? null
  const punchInAt = activeSession ? activeSession.punchInAt : null
  const punchOutAt = activeSession ? activeSession.punchOutAt : null
  const isWorking = !!activeSession && activeSession.punchOutAt === null
  const isComplete = !!activeSession && activeSession.punchOutAt !== null

  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const clockTimeString = useMemo(() => {
    if (!currentTime) return '--:--:--'
    const hours = currentTime.getHours()
    const minutes = String(currentTime.getMinutes()).padStart(2, '0')
    const seconds = String(currentTime.getSeconds()).padStart(2, '0')
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    const formattedHours = String(displayHours).padStart(2, '0')
    return `${formattedHours}:${minutes}:${seconds}`
  }, [currentTime])

  const todayDateString = useMemo(() => {
    if (!currentTime) return 'Loading date...'
    return formatTodayDate(currentTime)
  }, [currentTime])

  const [liveHours, setLiveHours] = useState('0.00')
  useEffect(() => {
    if (!isWorking || !punchInAt) {
      setLiveHours('0.00')
      return
    }
    const updateLiveHours = () => {
      const elapsedMs = Date.now() - punchInAt
      const hours = elapsedMs / (1000 * 60 * 60)
      setLiveHours(hours.toFixed(2))
    }
    updateLiveHours()
    const timer = setInterval(updateLiveHours, 1000)
    return () => clearInterval(timer)
  }, [isWorking, punchInAt])

  const handlePunchIn = async () => {
    if (!viewerIdentity) return
    try {
      setError(null)
      setIsSaving(true)
      const result = await punchIn(viewerIdentity)
      setLocalSession(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to punch in.')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePunchOut = async () => {
    if (!viewerIdentity) return
    try {
      setError(null)
      setIsSaving(true)
      const result = await punchOut(viewerIdentity)
      setLocalSession(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to punch out.')
    } finally {
      setIsSaving(false)
    }
  }

  const togglePunch = async () => {
    if (isWorking) {
      await handlePunchOut()
    } else if (!activeSession) {
      await handlePunchIn()
    }
  }

  const totalHours = useMemo(() => {
    let sum = 0
    filteredRecords.forEach((record) => {
      if (record.punchOutAt !== null) {
        sum += (record.punchOutAt - record.punchInAt) / (1000 * 60 * 60)
      }
    })
    if (isWorking && punchInAt) {
      sum += (Date.now() - punchInAt) / (1000 * 60 * 60)
    }
    return sum.toFixed(1)
  }, [filteredRecords, isWorking, punchInAt])

  const sinceJoiningDate = useMemo(() => {
    if (attendanceRecords.length === 0) return 'May 06, 2026'
    const minTimestamp = Math.min(...attendanceRecords.map(r => r.createdAt))
    return new Intl.DateTimeFormat(DATE_LOCALE, {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    }).format(new Date(minTimestamp))
  }, [attendanceRecords])

  const daysPresent = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    const thisMonthSessions = filteredRecords.filter((record) => {
      const d = new Date(record.createdAt)
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth
    })
    const uniqueDays = new Set(thisMonthSessions.map(s => s.dateKey))
    return uniqueDays.size
  }, [attendanceRecords])

  const progressPercent = useMemo(() => {
    if (daysPresent === 0) return 0
    return Math.min((daysPresent / 30) * 100, 100)
  }, [daysPresent])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-zinc-400 text-sm font-medium">
        Loading...
      </div>
    )
  }

  return (
    <div className="w-full max-w-none px-1 py-1 sm:px-2 md:px-3 lg:px-4 xl:px-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(360px,0.92fr)_minmax(0,1.95fr)] 2xl:gap-6">
        
        {/* Left Column: Live Punch Status */}
        <section className="flex min-h-[min(78vh,860px)] flex-col justify-between rounded-[32px] border border-zinc-200/80 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-zinc-900 dark:bg-black dark:shadow-[0_18px_50px_rgba(0,0,0,0.35)] sm:p-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-950 inline-block"></span>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">Live Punch Status</h2>
            </div>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400" suppressHydrationWarning>
              {mounted ? todayDateString : 'Loading date...'}
            </p>
          </div>

          <div className="my-10 flex min-h-[220px] items-center justify-center lg:min-h-[280px]">
            {!isComplete ? (
              <span 
                className="font-mono text-5xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-6xl"
                suppressHydrationWarning
              >
                {mounted ? clockTimeString : '--:--:--'}
              </span>
            ) : (
              <span className="text-lg font-semibold tracking-wide text-emerald-600 dark:text-emerald-300">
                Shift Completed
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-[24px] border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/80">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">Start Time</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {punchInAt ? formatTimeWithSeconds(punchInAt) : '--:--:--'}
                </p>
              </div>
              <button
                type="button"
                onClick={togglePunch}
                disabled={isSaving || isComplete}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-800 shadow-xs transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                title={isWorking ? "Punch Out" : "Punch In"}
              >
                {isWorking ? (
                  <LogOut className="size-4" />
                ) : (
                  <LogIn className="size-4 text-emerald-600" />
                )}
              </button>
            </div>

            {isComplete ? (
              <div className="flex flex-col items-center justify-center rounded-[24px] border border-emerald-100 bg-emerald-50/60 p-5 text-center dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100/70 text-emerald-600 dark:bg-zinc-900 dark:text-emerald-300">
                  <ClipboardCheck className="size-6" />
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-300">
                  Shift Completed
                </p>
                <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-200">
                  {punchInAt && punchOutAt ? ((punchOutAt - punchInAt) / 3600000).toFixed(2) : '0.16'} Hours Logged
                </p>
              </div>
            ) : isWorking ? (
              <div className="flex flex-col items-center justify-center rounded-[24px] border border-blue-100 bg-blue-50/60 p-5 text-center dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 animate-pulse dark:bg-zinc-900 dark:text-blue-300">
                  <Clock3 className="size-6 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">
                  Shift In Progress
                </p>
                <p className="mt-1 text-xl font-bold text-blue-700 dark:text-blue-200">
                  {liveHours} Hours Logged
                </p>
                <button
                  type="button"
                  onClick={handlePunchOut}
                  disabled={isSaving}
                  className="mt-4 inline-flex w-full max-w-[220px] items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <LogOut className="size-3.5" />
                  Punch Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-[24px] border border-zinc-200/80 bg-zinc-50/80 p-5 text-center dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500">
                  <UserX className="size-6" />
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                  Ready to Start
                </p>
                <p className="mt-1 text-xl font-bold text-zinc-400 dark:text-zinc-500">
                  0.00 Hours Logged
                </p>
                <button
                  type="button"
                  onClick={handlePunchIn}
                  disabled={isSaving}
                  className="mt-4 inline-flex w-full max-w-[220px] items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-white shadow-[0_14px_30px_rgba(16,185,129,0.28)] ring-1 ring-emerald-300/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer dark:bg-emerald-400 dark:text-zinc-950 dark:shadow-[0_14px_30px_rgba(16,185,129,0.32)] dark:ring-emerald-200/40 dark:hover:bg-emerald-300"
                >
                  <LogIn className="size-3.5" />
                  Punch In
                </button>
              </div>
            )}
          </div>

          {error && (
            <p className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-center text-xs text-rose-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-rose-300">
              {error}
            </p>
          )}

        </section>

        {/* Right Column: Statistics & Logs */}
        <div className="flex min-w-0 flex-col gap-6">
          {/* Top Statistics cards */}
          <div className="grid gap-4 xl:grid-cols-2">
            
            {/* Life-Time Contribution Card */}
            <div className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)] dark:border-zinc-900 dark:bg-zinc-950 dark:shadow-[0_14px_40px_rgba(0,0,0,0.25)]">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-blue-50/70 p-1.5 text-blue-500 dark:bg-zinc-900 dark:text-blue-300">
                  <TrendingUp className="size-4" />
                </div>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                  Life-Time Contribution
                </h3>
              </div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">{totalHours}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Total Hours</span>
              </div>
              <div className="mt-4 flex items-center gap-1.5 border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <Calendar className="size-3.5 text-zinc-400 dark:text-zinc-500" />
                <span>Since Joining:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">{sinceJoiningDate}</span>
              </div>
            </div>

            {/* This Month's Activity Card */}
            <div className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)] dark:border-zinc-900 dark:bg-zinc-950 dark:shadow-[0_14px_40px_rgba(0,0,0,0.25)]">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-emerald-50/70 p-1.5 text-emerald-500 dark:bg-zinc-900 dark:text-emerald-300">
                  <Timer className="size-4" />
                </div>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                  This Month&apos;s Activity
                </h3>
              </div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">{daysPresent}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Days Present</span>
              </div>
              <div className="mt-6">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercent || 5}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Attendance History */}
          <section className={hrmsSectionClass}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">Attendance History</h2>
                <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
                  Your daily punch records and working hours.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Calendar className="size-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
              <div className="w-full max-w-[260px]">
                <DatePicker
                  value={from}
                  onChange={setFrom}
                />
              </div>
              {from && (
                <button
                  onClick={() => setFrom('')}
                  className="rounded-2xl border border-zinc-200/80 px-3 py-2 text-xs font-medium text-zinc-500 transition hover:bg-zinc-50 cursor-pointer dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
                >
                  Clear
                </button>
              )}
            </div>

            <div className={`${hrmsTableViewportClass} mt-6 min-h-0`}>
    <table className={hrmsTableClass}>
      <thead>
        <tr className={hrmsTableHeadRowClass}>
          <th className="w-12 px-4 py-3">S.No</th>
          <th className="px-4 py-3">Date & Day</th>
          <th className="px-4 py-3">Check In</th>
          <th className="px-4 py-3">Check Out</th>
          <th className="px-4 py-3 text-right">Work Hours</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
        {filteredRecords.length === 0 ? (
          <tr>
            <td className={hrmsTableEmptyClass} colSpan={5}>
              No attendance records yet. Click the start button to punch in.
            </td>
          </tr>
                  ) : (
                    paginatedRecords.map((record, idx) => {
                      const sno = (page - 1) * PAGE_SIZE + idx + 1
                      const { dateStr, dayStr } = formatDateAndDay(record.createdAt)
                      const isRecordActive = record.punchOutAt === null
                      const diff = (record.punchOutAt ?? Date.now()) - record.punchInAt
                      const hoursStr = (diff / (1000 * 60 * 60)).toFixed(2)

                      return (
                        <tr key={record._id} className={hrmsTableRowClass}>
                          <td className="px-4 py-4 font-mono text-xs font-semibold text-zinc-400 dark:text-zinc-500">{sno}</td>
                          <td className="px-4 py-4">
                            <div className="font-semibold text-zinc-950 dark:text-zinc-100">{dateStr}</div>
                            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                              {dayStr}
                            </div>
                          </td>
                          <td className="px-4 py-4 font-medium text-zinc-700 dark:text-zinc-300">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                              {formatTime(record.punchInAt)}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-medium text-zinc-700 dark:text-zinc-300">
                            {isRecordActive ? (
                              <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-amber-500 inline-block animate-pulse" />
                                <span className="font-semibold text-amber-600 dark:text-amber-300">Active</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
                                {formatTime(record.punchOutAt)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right font-bold text-zinc-950 dark:text-zinc-100">
                            {hoursStr}h
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            <Pagination current={page} total={filteredRecords.length} pageSize={PAGE_SIZE} onChange={setPage} />
          </section>
        </div>
      </div>
    </div>
  )
}
