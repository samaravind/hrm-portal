'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import {
  Bell,
  Calendar,
  Clock3,
  CircleAlert,
  LogIn,
  LogOut,
  MapPin,
  Medal,
  MoreHorizontal,
  Sparkles,
  UserRound,
  BadgeCheck,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

function formatDuration(ms: number) {
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  return `${hours}h ${minutes}m`
}

function getWeekDates() {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push(date.toISOString().slice(0, 10))
  }
  return days
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

export default function StaffDashboardPage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const viewer = useQuery(api.users.viewer)
  const rawEmployees = useQuery(api.employees.list)
  const employees = useMemo(() => rawEmployees ?? [], [rawEmployees])

  const isAdmin = viewer?.role === 'admin' || user?.publicMetadata?.role === 'admin'

  useEffect(() => {
    if (viewer !== undefined && isLoaded && isAdmin) {
      router.replace('/')
    }
  }, [viewer, isLoaded, isAdmin, router])

  const viewerIdentity = useMemo(() => {
    if (!isLoaded || !user) return null
    return {
      viewerId: user.id,
      viewerName: user.fullName ?? user.username ?? null,
      viewerEmail: user.primaryEmailAddress?.emailAddress ?? null,
    }
  }, [isLoaded, user])

  const mySessions = useQuery(api.attendance.getMySessions, viewerIdentity ?? 'skip')
  const todaySession = useQuery(api.attendance.getTodaySession, viewerIdentity ?? 'skip')

  const punchIn = useMutation(api.attendance.punchIn)
  const punchOut = useMutation(api.attendance.punchOut)
  const [punching, setPunching] = useState(false)
  const [punchError, setPunchError] = useState<string | null>(null)

  const myEmployee = useMemo(() => {
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? ''
    return employees.find((employee) => employee.email?.toLowerCase() === email) ?? null
  }, [employees, user])

  const weekDates = useMemo(() => getWeekDates(), [])

  const sessions = useMemo(() => mySessions ?? [], [mySessions])
  const sessionsThisWeek = useMemo(
    () => sessions.filter((session) => weekDates.includes(session.dateKey)),
    [sessions, weekDates],
  )

  const completedSessionsThisWeek = useMemo(
    () => sessionsThisWeek.filter((session) => session.punchOutAt !== null),
    [sessionsThisWeek],
  )

  const weekHours = useMemo(
    () =>
      completedSessionsThisWeek.reduce(
        (total, session) => total + ((session.punchOutAt ?? session.punchInAt) - session.punchInAt),
        0,
      ),
    [completedSessionsThisWeek],
  )

  const performanceScore = Math.min(100, Math.round((weekHours / (40 * 60 * 60 * 1000)) * 100))
  const attendanceRate = Math.min(100, Math.round((sessionsThisWeek.length / 5) * 100))
  const todayKey = getTodayKey()
  const currentStatus = todaySession
    ? todaySession.punchOutAt === null
      ? 'On duty'
      : 'Present'
    : 'Not punched in'
  const leaveStatus = todaySession ? 'No leave marked today' : 'Awaiting punch in'

  const notifications: Array<{ tone: 'info' | 'warning' | 'success'; title: string; body: string }> = []

  if (!todaySession) {
    notifications.push({
      tone: 'warning',
      title: 'Punch in reminder',
      body: 'You have not punched in yet today. Start your shift from the dashboard when you are ready.',
    })
  } else if (todaySession.punchOutAt === null) {
    notifications.push({
      tone: 'success',
      title: 'Shift active',
      body: 'You are currently punched in. Punch out when your shift ends.',
    })
  } else {
    notifications.push({
      tone: 'info',
      title: 'Shift completed',
      body: 'Your latest attendance entry for today has been closed successfully.',
    })
  }

  if (sessionsThisWeek.length > 0) {
    notifications.push({
      tone: 'info',
      title: 'Weekly progress',
      body: `You logged ${formatDuration(weekHours)} this week across ${sessionsThisWeek.length} session(s).`,
    })
  }

  if (myEmployee?.department) {
    notifications.push({
      tone: 'success',
      title: 'Profile ready',
      body: `Your profile is assigned to ${myEmployee.department}.`,
    })
  }

  const handlePunchIn = async () => {
    if (!viewerIdentity || punching) return
    setPunching(true)
    setPunchError(null)
    try {
      await punchIn(viewerIdentity)
      toast.success('Punched in successfully.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to punch in'
      setPunchError(message)
      toast.error(message)
    } finally {
      setPunching(false)
    }
  }

  const handlePunchOut = async () => {
    if (!viewerIdentity || punching) return
    setPunching(true)
    setPunchError(null)
    try {
      await punchOut(viewerIdentity)
      toast.success('Punched out successfully.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to punch out'
      setPunchError(message)
      toast.error(message)
    } finally {
      setPunching(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-pulse text-sm text-zinc-400">Loading staff dashboard...</div>
      </div>
    )
  }

  if (viewer !== undefined && isLoaded && isAdmin) {
    return null
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.10),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-6 text-zinc-950 sm:px-6 dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_20%),linear-gradient(180deg,_#030712_0%,_#111827_100%)] dark:text-zinc-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[30px] border border-white/70 bg-white/90 shadow-[0_30px_80px_rgba(15,23,42,0.10)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85 dark:shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.35fr_0.85fr]">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                <Sparkles className="size-3.5" />
                Staff Dashboard
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
                  {user?.fullName ? `Welcome back, ${user.fullName.split(' ')[0]}` : 'Welcome back'}
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base dark:text-zinc-300">
                  Your workspace is focused on attendance, personal progress, and daily updates.
                  Quick actions are one tap away, and the screen stays clean so you can get in and out fast.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/my-attendance"
                  className="inline-flex items-center gap-2 rounded-2xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                >
                  <Calendar className="size-4" />
                  My Attendance
                </Link>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <UserRound className="size-4" />
                  Profile
                </Link>
              </div>
            </div>

            <div className="rounded-[24px] border border-zinc-200/70 bg-white p-5 text-zinc-950 shadow-[0_20px_50px_rgba(15,23,42,0.10)] dark:border-zinc-800 dark:bg-gradient-to-br dark:from-zinc-950 dark:via-zinc-900 dark:to-indigo-950 dark:text-white dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-white/60">Profile</p>
                  <h2 className="mt-2 text-2xl font-semibold">{user?.fullName ?? 'Team Member'}</h2>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-white/70">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-emerald-500 dark:bg-white/10 dark:text-emerald-300">
                  <BadgeCheck className="size-6" />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-white/50">Department</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">{myEmployee?.department || 'Unassigned'}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-white/50">Role</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">{myEmployee?.position || 'Staff'}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-white/50">Today</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">{currentStatus}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-white/50">Date</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">{new Date(todayKey).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {punchError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            {punchError}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            <section className="rounded-[28px] border border-zinc-200/70 bg-white/95 p-6 shadow-[0_24px_50px_rgba(15,23,42,0.08)] dark:border-zinc-800 dark:bg-zinc-950/85 dark:shadow-[0_24px_50px_rgba(0,0,0,0.35)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Punch In / Out</h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Start or end your shift from here.
                  </p>
                </div>
                {todaySession ? (
                  todaySession.punchOutAt === null ? (
                    <button
                      onClick={handlePunchOut}
                      disabled={punching}
                      className="inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-rose-500 dark:hover:bg-rose-400"
                    >
                      <LogOut className="size-4" />
                      {punching ? 'Punching out...' : 'Punch Out'}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      <Clock3 className="size-4" />
                      Completed
                    </span>
                  )
                ) : (
                  <button
                    onClick={handlePunchIn}
                    disabled={punching}
                    className="inline-flex items-center gap-2 rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                  >
                    <LogIn className="size-4" />
                    {punching ? 'Punching in...' : 'Punch In'}
                  </button>
                )}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                    <Clock3 className="size-4" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Attendance</span>
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{currentStatus}</div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Based on your latest punch status.</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                    <CircleAlert className="size-4" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Leave Status</span>
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{leaveStatus}</div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">No leave features exposed here for staff.</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                    <TrendingUp className="size-4" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">This Week</span>
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{formatDuration(weekHours)}</div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{sessionsThisWeek.length} session(s) logged</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                    <Medal className="size-4" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Performance</span>
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{performanceScore}%</div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Weekly performance score</p>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-zinc-200/70 bg-white/95 p-6 shadow-[0_24px_50px_rgba(15,23,42,0.08)] dark:border-zinc-800 dark:bg-zinc-950/85 dark:shadow-[0_24px_50px_rgba(0,0,0,0.35)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Recent Activity</h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Your latest attendance sessions.</p>
                </div>
                <Link
                  href="/my-attendance"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  View all
                  <MoreHorizontal className="size-4" />
                </Link>
              </div>

              <div className="mt-5 divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                {sessions.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-zinc-400 dark:text-zinc-500">
                    No attendance records yet.
                  </div>
                ) : (
                  sessions.slice(0, 5).map((session) => (
                    <div key={session._id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${session.punchOutAt === null ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                          {session.punchOutAt === null ? <LogIn className="size-4" /> : <LogOut className="size-4" />}
                        </div>
                        <div>
                          <div className="font-medium text-zinc-950 dark:text-zinc-50">{formatDate(session.punchInAt)}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {session.punchOutAt === null ? 'Active session' : 'Completed session'}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-300">
                        <span className="font-medium text-zinc-950 dark:text-zinc-50">{formatTime(session.punchInAt)}</span>
                        {session.punchOutAt ? (
                          <span className="text-zinc-400 dark:text-zinc-500"> - {formatTime(session.punchOutAt)}</span>
                        ) : (
                          <span className="ml-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                            Live
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        {session.punchOutAt ? formatDuration(session.punchOutAt - session.punchInAt) : 'In progress'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-[28px] border border-zinc-200/70 bg-white/95 p-6 shadow-[0_24px_50px_rgba(15,23,42,0.08)] dark:border-zinc-800 dark:bg-zinc-950/85 dark:shadow-[0_24px_50px_rgba(0,0,0,0.35)]">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-zinc-500 dark:text-zinc-400" />
                <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Notifications</h2>
              </div>
              <div className="mt-5 space-y-3">
                {notifications.map((note) => (
                  <div
                    key={note.title}
                    className={`rounded-2xl border p-4 ${
                      note.tone === 'warning'
                        ? 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10'
                        : note.tone === 'success'
                          ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                          : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/70'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl ${
                        note.tone === 'warning'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                          : note.tone === 'success'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}>
                        <Bell className="size-4" />
                      </div>
                      <div>
                        <div className={`text-sm font-semibold ${
                          note.tone === 'warning'
                            ? 'text-amber-800 dark:text-amber-200'
                            : note.tone === 'success'
                              ? 'text-emerald-800 dark:text-emerald-200'
                              : 'text-zinc-800 dark:text-zinc-100'
                        }`}>
                          {note.title}
                        </div>
                        <div className={`mt-1 text-sm leading-6 ${
                          note.tone === 'warning'
                            ? 'text-amber-700 dark:text-amber-300'
                            : note.tone === 'success'
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : 'text-zinc-600 dark:text-zinc-300'
                        }`}>
                          {note.body}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-zinc-200/70 bg-white p-6 text-zinc-950 shadow-[0_24px_50px_rgba(15,23,42,0.08)] dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:shadow-[0_24px_50px_rgba(0,0,0,0.35)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-white/50">Profile</p>
                  <h2 className="mt-2 text-xl font-semibold">{user?.fullName ?? 'Employee'}</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10">
                  <UserRound className="size-6 text-zinc-900 dark:text-white" />
                </div>
              </div>

              <div className="mt-5 space-y-3 rounded-[24px] border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-zinc-500 dark:text-white/60">Email</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">{user?.primaryEmailAddress?.emailAddress ?? 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-zinc-500 dark:text-white/60">Department</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">{myEmployee?.department || 'Unassigned'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-zinc-500 dark:text-white/60">Role</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">{myEmployee?.position || 'Staff'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-zinc-500 dark:text-white/60">Joined</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">{myEmployee?._creationTime ? formatDate(myEmployee._creationTime) : 'Recently'}</span>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/profile"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                >
                  Open Profile
                </Link>
                <Link
                  href="/my-attendance"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  Attendance
                </Link>
              </div>
            </section>

            <section className="rounded-[28px] border border-zinc-200/70 bg-white/95 p-6 shadow-[0_24px_50px_rgba(15,23,42,0.08)] dark:border-zinc-800 dark:bg-zinc-950/85 dark:shadow-[0_24px_50px_rgba(0,0,0,0.35)]">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-zinc-500 dark:text-zinc-400" />
                <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Personal Performance</h2>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Attendance Rate</p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{attendanceRate}%</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Based on sessions this week</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Sessions</p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{sessionsThisWeek.length}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">This week</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Hours</p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{formatDuration(weekHours)}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Tracked this week</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Score</p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{performanceScore}%</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Personal performance</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
