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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_2fr]">
        
        {/* Left Column: Live Punch Status */}
        <section className="rounded-3xl border border-zinc-200 dark:border-black bg-white dark:bg-black p-6 shadow-xs flex flex-col justify-between min-h-[480px]">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-950 inline-block"></span>
              <h2 className="text-lg font-bold text-zinc-900">Live Punch Status</h2>
            </div>
            <p className="mt-1 text-sm text-zinc-500" suppressHydrationWarning>
              {mounted ? todayDateString : 'Loading date...'}
            </p>
          </div>

          <div className="my-8 flex justify-center items-center">
            {!isComplete ? (
              <span 
                className="text-5xl font-bold tracking-tight text-zinc-900 font-mono"
                suppressHydrationWarning
              >
                {mounted ? clockTimeString : '--:--:--'}
              </span>
            ) : (
              <span className="text-lg font-semibold tracking-wide text-emerald-700">
                Shift Completed
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-zinc-50 border border-zinc-100 p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Start Time</p>
                <p className="mt-1 text-sm font-semibold text-zinc-800">
                  {punchInAt ? formatTimeWithSeconds(punchInAt) : '--:--:--'}
                </p>
              </div>
              <button
                type="button"
                onClick={togglePunch}
                disabled={isSaving || isComplete}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
              <div className="rounded-2xl bg-[#edfcf2] p-5 text-center flex flex-col items-center justify-center border border-emerald-100">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100/60 text-emerald-600">
                  <ClipboardCheck className="size-6" />
                </div>
                <p className="mt-3 text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Shift Completed
                </p>
                <p className="mt-1 text-xl font-extrabold text-emerald-700">
                  {punchInAt && punchOutAt ? ((punchOutAt - punchInAt) / 3600000).toFixed(2) : '0.16'} Hours Logged
                </p>
              </div>
            ) : isWorking ? (
              <div className="rounded-2xl bg-blue-50/50 p-5 text-center flex flex-col items-center justify-center border border-blue-100">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 animate-pulse">
                  <Clock3 className="size-6 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <p className="mt-3 text-xs font-bold uppercase tracking-wider text-blue-600">
                  Shift In Progress
                </p>
                <p className="mt-1 text-xl font-extrabold text-blue-700">
                  {liveHours} Hours Logged
                </p>
                <button
                  type="button"
                  onClick={handlePunchOut}
                  disabled={isSaving}
                  className="mt-4 w-full max-w-[200px] inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOut className="size-3.5" />
                  Punch Out
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-zinc-50 p-5 text-center flex flex-col items-center justify-center border border-zinc-100">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                  <UserX className="size-6" />
                </div>
                <p className="mt-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Ready to Start
                </p>
                <p className="mt-1 text-xl font-extrabold text-zinc-400">
                  0.00 Hours Logged
                </p>
                <button
                  type="button"
                  onClick={handlePunchIn}
                  disabled={isSaving}
                  className="mt-4 w-full max-w-[200px] inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white px-5 py-2.5 text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogIn className="size-3.5" />
                  Punch In
                </button>
              </div>
            )}
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-600 text-center">
              {error}
            </p>
          )}

        </section>

        {/* Right Column: Statistics & Logs */}
        <div className="flex flex-col gap-6">
          {/* Top Statistics cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            
            {/* Life-Time Contribution Card */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="text-blue-500 bg-blue-50/50 p-1.5 rounded-lg">
                  <TrendingUp className="size-4" />
                </div>
                <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                  Life-Time Contribution
                </h3>
              </div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-zinc-900">{totalHours}</span>
                <span className="text-xs text-zinc-500">Total Hours</span>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500 border-t border-zinc-50 pt-3">
                <Calendar className="size-3.5 text-zinc-400" />
                <span>Since Joining:</span>
                <span className="font-bold text-zinc-800">{sinceJoiningDate}</span>
              </div>
            </div>

            {/* This Month's Activity Card */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="text-emerald-500 bg-emerald-50/50 p-1.5 rounded-lg">
                  <Timer className="size-4" />
                </div>
                <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                  This Month&apos;s Activity
                </h3>
              </div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-zinc-900">{daysPresent}</span>
                <span className="text-xs text-zinc-500">Days Present</span>
              </div>
              <div className="mt-6">
                <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercent || 5}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Attendance History */}
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs flex-1 flex flex-col">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Attendance History</h2>
              <p className="mt-0.5 text-sm text-zinc-400">
                Your daily punch records and working hours.
              </p>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <Calendar className="size-4 text-zinc-400 shrink-0" />
              <div className="w-full max-w-[220px]">
                <DatePicker
                  value={from}
                  onChange={setFrom}
                />
              </div>
              {from && (
                <button
                  onClick={() => setFrom('')}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-500 hover:bg-zinc-50 transition cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-black text-xs font-semibold text-zinc-800 dark:text-white">
                    <th className="py-3 px-2 w-8">S.No</th>
                    <th className="py-3 px-2">Date & Day</th>
                    <th className="py-3 px-2">Check In</th>
                    <th className="py-3 px-2">Check Out</th>
                    <th className="py-3 px-2 text-right">Work Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-black">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td className="py-8 px-2 text-center text-zinc-400 font-medium" colSpan={5}>
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
                        <tr key={record._id} className="hover:bg-zinc-50/50 transition-colors dark:hover:bg-black">
                          <td className="py-4 px-2 text-xs text-zinc-400 font-mono">{sno}</td>
                          <td className="py-4 px-2">
                            <div className="font-semibold text-zinc-800">{dateStr}</div>
                            <div className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase mt-0.5">
                              {dayStr}
                            </div>
                          </td>
                          <td className="py-4 px-2 font-medium text-zinc-700">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                              {formatTime(record.punchInAt)}
                            </span>
                          </td>
                          <td className="py-4 px-2 font-medium text-zinc-700">
                            {isRecordActive ? (
                              <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-amber-500 inline-block animate-pulse" />
                                <span className="text-amber-600 font-semibold">Active</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
                                {formatTime(record.punchOutAt)}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-2 font-bold text-zinc-950 text-right">
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
