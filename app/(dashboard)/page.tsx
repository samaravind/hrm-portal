'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Gauge,
  GraduationCap,
  Layers3,
  LogIn,
  LogOut,
  Medal,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

const DEPT_COLORS = ['#6366f1', '#06b6d4', '#8b5cf6', '#14b8a6', '#f97316', '#ec4899', '#3b82f6', '#22c55e']

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function formatDuration(ms: number) {
  const hours = Math.floor(ms / 3_600_000)
  const minutes = Math.floor((ms % 3_600_000) / 60_000)
  return `${hours}h ${minutes}m`
}

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`
}

function getWeekDates() {
  const days: string[] = []
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push(date.toISOString().slice(0, 10))
  }
  return days
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function MetricCard({
  icon: Icon,
  label,
  value,
  change,
  accent,
  sparkle,
}: {
  icon: LucideIcon
  label: string
  value: string
  change: string
  accent: string
  sparkle?: string
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-[26px] border border-white/70 bg-white/75 p-4 shadow-[0_18px_55px_rgba(77,81,201,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_70px_rgba(77,81,201,0.14)] dark:border-white/10 dark:bg-zinc-950/70"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-90"
        style={{ backgroundImage: accent }}
      />
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_18px_35px_rgba(99,102,241,0.28)]"
            style={{ backgroundImage: accent }}
          >
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">{value}</p>
          </div>
        </div>
        {sparkle ? (
          <div className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 shadow-sm dark:bg-white/10 dark:text-zinc-200">
            {sparkle}
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
        <ArrowUpRight className="size-4" />
        {change}
      </div>
    </div>
  )
}

function SectionCard({
  title,
  icon: Icon,
  children,
  action,
  className = '',
}: {
  title: string
  icon: LucideIcon
  children: ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`overflow-hidden rounded-[30px] border border-white/70 bg-white/75 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70 ${className}`}
    >
      <div className="flex items-center justify-between gap-4 border-b border-white/70 px-5 py-4 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/15 text-indigo-600 dark:text-indigo-300">
            <Icon className="size-4" />
          </div>
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const viewer = useQuery(api.users.viewer)
  const rawEmployees = useQuery(api.employees.list)
  const rawAllSessions = useQuery(api.attendance.listAllSessionss)
  const employees = useMemo(() => rawEmployees ?? [], [rawEmployees])
  const allSessions = useMemo(() => rawAllSessions ?? [], [rawAllSessions])

  const viewerIdentity = useMemo(() => {
    if (!isLoaded || !user) return null
    return {
      viewerId: user.id,
      viewerName: user.fullName ?? user.username ?? null,
      viewerEmail: user.primaryEmailAddress?.emailAddress ?? null,
    }
  }, [isLoaded, user])

  const punchSheet = useQuery(api.attendance.getPunchSheet, viewerIdentity ?? 'skip')
  const todaySession = useQuery(api.attendance.getTodaySession, viewerIdentity ?? 'skip')
  const punchIn = useMutation(api.attendance.punchIn)
  const punchOut = useMutation(api.attendance.punchOut)
  const [punching, setPunching] = useState(false)
  const [punchError, setPunchError] = useState<string | null>(null)

  const isAdmin = viewer?.role === 'admin' || user?.publicMetadata?.role === 'admin'

  useEffect(() => {
    if (viewer !== undefined && isLoaded && !isAdmin) {
      router.replace('/staff-dashboard')
    }
  }, [viewer, isLoaded, isAdmin, router])

  const todayKey = getTodayKey()

  const attendanceToday = useMemo(
    () => allSessions.filter((session) => session.dateKey === todayKey),
    [allSessions, todayKey],
  )

  const totalEmployees = employees.length
  const presentToday = attendanceToday.filter((session) => session.punchInAt).length
  const punchedInNow = attendanceToday.filter((session) => session.punchInAt && session.punchOutAt === null).length
  const onLeave = Math.max(totalEmployees - presentToday, 0)

  const totalDepartments = useMemo(() => {
    return new Set(employees.map((employee) => employee.department).filter(Boolean)).size
  }, [employees])

  const avgSalary = useMemo(() => {
    const withSalary = employees.filter((employee) => employee.salary)
    if (!withSalary.length) return null
    return withSalary.reduce((sum, employee) => sum + (employee.salary ?? 0), 0) / withSalary.length
  }, [employees])

  const monthlyPayroll = useMemo(() => employees.reduce((sum, employee) => sum + (employee.salary ?? 0), 0), [employees])

  const newThisMonth = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    return employees.filter((employee) => employee._creationTime >= monthStart).length
  }, [employees])

  const weeklyTrend = useMemo(() => {
    const weekDates = getWeekDates()
    const counts: Record<string, number> = {}
    for (const date of weekDates) counts[date] = 0

    for (const session of allSessions) {
      if (counts[session.dateKey] !== undefined) {
        counts[session.dateKey] += session.punchInAt ? 1 : 0
      }
    }

    return weekDates.map((date) => ({
      date,
      label: new Date(date).toLocaleDateString('en-IN', { weekday: 'short' }),
      value: counts[date] ?? 0,
    }))
  }, [allSessions])

  const peakWeekValue = Math.max(...weeklyTrend.map((entry) => entry.value), 1)

  const deptDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const employee of employees) {
      const department = employee.department || 'Unassigned'
      counts[department] = (counts[department] ?? 0) + 1
    }
    return Object.entries(counts).map(([name, value], index) => ({
      name,
      value,
      color: DEPT_COLORS[index % DEPT_COLORS.length],
    }))
  }, [employees])

  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const employee of employees) {
      const type = employee.employeeType || 'Employee'
      counts[type] = (counts[type] ?? 0) + 1
    }
    return Object.entries(counts).map(([name, value], index) => ({
      name,
      value,
      color: DEPT_COLORS[index % DEPT_COLORS.length],
    }))
  }, [employees])

  const recentActivity = useMemo(() => allSessions.slice(0, 8), [allSessions])

  const punchSheetData = punchSheet ?? []
  const absentToday = useMemo(() => {
    if (!punchSheet) return []
    return punchSheet.filter((row) => !row.session).map((row) => row.employee)
  }, [punchSheet])

  const topDept = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const employee of employees) {
      const department = employee.department || 'Unassigned'
      counts[department] = (counts[department] ?? 0) + 1
    }

    let name = 'N/A'
    let count = 0
    for (const [dept, value] of Object.entries(counts)) {
      if (value > count) {
        name = dept
        count = value
      }
    }

    return { name, count }
  }, [employees])

  const attendanceRate = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0

  const myWeekHours = useMemo(() => {
    const weekDates = getWeekDates()
    let total = 0
    for (const session of allSessions) {
      if (weekDates.includes(session.dateKey) && session.punchInAt && session.punchOutAt) {
        total += session.punchOutAt - session.punchInAt
      }
    }
    return total
  }, [allSessions])

  const handlePunchIn = async () => {
    if (!viewerIdentity || punching) return
    setPunching(true)
    setPunchError(null)
    try {
      await punchIn(viewerIdentity)
    } catch (error) {
      setPunchError(error instanceof Error ? error.message : 'Failed to punch in')
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
    } catch (error) {
      setPunchError(error instanceof Error ? error.message : 'Failed to punch out')
    } finally {
      setPunching(false)
    }
  }

  if (viewer !== undefined && isLoaded && !isAdmin) {
    return null
  }

  if (!isLoaded) {
    return (
      <div className="relative overflow-hidden rounded-[34px] border border-white/70 bg-white/75 p-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.10),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(236,72,153,0.10),_transparent_30%)]" />
        <div className="relative flex min-h-[60vh] items-center justify-center">
          <div className="flex items-center gap-3 rounded-full border border-white/70 bg-white/75 px-5 py-3 text-sm font-medium text-zinc-500 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70 dark:text-zinc-300">
            <Sparkles className="size-4 animate-pulse text-indigo-500" />
            Loading dashboard...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(236,72,153,0.14),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(20,184,166,0.10),_transparent_22%)]" />
      <div className="pointer-events-none absolute inset-x-16 top-10 -z-10 h-40 rounded-full bg-gradient-to-r from-indigo-400/20 via-fuchsia-400/20 to-cyan-400/20 blur-3xl" />

      <div className="space-y-6">
        <section className="grid gap-5 rounded-[36px] border border-white/70 bg-gradient-to-br from-white/90 via-indigo-50/70 to-fuchsia-50/70 p-6 shadow-[0_24px_90px_rgba(99,102,241,0.10)] backdrop-blur-xl dark:border-white/10 dark:from-zinc-950/85 dark:via-zinc-950/75 dark:to-zinc-900/70 lg:grid-cols-[1.35fr_0.95fr] lg:p-8">
          <div className="flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-indigo-300">
                <Sparkles className="size-3.5" />
                Premium HR workspace
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl xl:text-5xl">
                  {viewer?.name ? `Welcome back, ${viewer.name.split(' ')[0]}` : 'Welcome back'}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300 sm:text-base">
                  Manage headcount, attendance flow, and payroll signals from a calm, polished command center built for
                  modern HR teams.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-3xl border border-white/70 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">Employees</p>
                <p className="mt-2 text-xl font-semibold text-zinc-950 dark:text-white">{totalEmployees}</p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">Attendance</p>
                <p className="mt-2 text-xl font-semibold text-zinc-950 dark:text-white">{attendanceRate}%</p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">Departments</p>
                <p className="mt-2 text-xl font-semibold text-zinc-950 dark:text-white">{totalDepartments}</p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">Active now</p>
                <p className="mt-2 text-xl font-semibold text-zinc-950 dark:text-white">{punchedInNow}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {todaySession ? (
                todaySession.punchOutAt === null ? (
                  <button
                    type="button"
                    onClick={handlePunchOut}
                    disabled={punching}
                    className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(15,23,42,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                  >
                    <LogOut className="size-4" />
                    {punching ? 'Punching out...' : 'Punch Out'}
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-5 py-3 text-sm font-semibold text-emerald-700 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <CheckCircle2 className="size-4" />
                    Completed for today
                  </div>
                )
              ) : (
                <button
                  type="button"
                  onClick={handlePunchIn}
                  disabled={punching}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(99,102,241,0.34)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogIn className="size-4" />
                  {punching ? 'Punching in...' : 'Punch In'}
                </button>
              )}

              <Link
                href="/attendance"
                className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-5 py-3 text-sm font-semibold text-zinc-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
              >
                <Layers3 className="size-4" />
                Attendance log
              </Link>
            </div>

            {punchError ? (
              <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-rose-200/70 bg-rose-50/80 px-4 py-2 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                <Bell className="size-4" />
                {punchError}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 rounded-[30px] border border-white/70 bg-white/60 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 lg:grid-rows-[auto_auto]">
            <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.25),_transparent_45%),linear-gradient(135deg,_rgba(79,70,229,0.92),_rgba(217,70,239,0.86))] p-5 text-white shadow-[0_22px_50px_rgba(79,70,229,0.32)] dark:border-white/10">
              <div className="absolute -right-10 -top-10 size-36 rounded-full bg-white/15 blur-2xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Today&apos;s pulse</p>
                  <p className="text-3xl font-semibold tracking-tight">{attendanceRate}%</p>
                  <p className="text-sm text-white/75">Attendance rate across your current workforce.</p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-xl">
                  <Gauge className="size-6" />
                </div>
              </div>
              <div className="relative mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white/12 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/65">Present</p>
                  <p className="mt-1 text-lg font-semibold">{presentToday}</p>
                </div>
                <div className="rounded-2xl bg-white/12 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/65">On leave</p>
                  <p className="mt-1 text-lg font-semibold">{onLeave}</p>
                </div>
                <div className="rounded-2xl bg-white/12 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/65">Active</p>
                  <p className="mt-1 text-lg font-semibold">{punchedInNow}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[24px] border border-white/70 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">Avg salary</p>
                <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
                  {avgSalary ? formatCurrency(avgSalary) : '—'}
                </p>
              </div>
              <div className="rounded-[24px] border border-white/70 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">New this month</p>
                <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">{newThisMonth}</p>
              </div>
              <div className="rounded-[24px] border border-white/70 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">Payroll</p>
                <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">{formatCurrency(monthlyPayroll)}</p>
              </div>
              <div className="rounded-[24px] border border-white/70 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">Top team</p>
                <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">{topDept.name}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <MetricCard
            icon={Users}
            label="Total employees"
            value={String(totalEmployees)}
            change="12% growth vs last month"
            accent="linear-gradient(135deg, #4f46e5, #8b5cf6)"
            sparkle="Live"
          />
          <MetricCard
            icon={UserCheck}
            label="Present today"
            value={String(presentToday)}
            change="Attendance is tracking well"
            accent="linear-gradient(135deg, #0ea5e9, #14b8a6)"
          />
          <MetricCard
            icon={UserX}
            label="On leave"
            value={String(onLeave)}
            change="A small daily gap"
            accent="linear-gradient(135deg, #f97316, #f43f5e)"
          />
          <MetricCard
            icon={Building2}
            label="Departments"
            value={String(totalDepartments)}
            change="Org structure is stable"
            accent="linear-gradient(135deg, #8b5cf6, #ec4899)"
          />
          <MetricCard
            icon={Wallet}
            label="Average salary"
            value={avgSalary ? formatCurrency(avgSalary) : '—'}
            change="Payroll visibility at a glance"
            accent="linear-gradient(135deg, #06b6d4, #3b82f6)"
          />
          <MetricCard
            icon={Medal}
            label="New hires"
            value={String(newThisMonth)}
            change="Fresh talent joined this month"
            accent="linear-gradient(135deg, #22c55e, #14b8a6)"
          />
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/employee"
            className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
          >
            <UserPlus className="size-4 text-indigo-500" />
            Create employee
          </Link>
          <Link
            href="/attendance"
            className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
          >
            <Calendar className="size-4 text-cyan-500" />
            Attendance log
          </Link>
          <Link
            href="/my-attendance"
            className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
          >
            <Clock3 className="size-4 text-emerald-500" />
            My attendance
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,0.95fr)]">
          <div className="space-y-6">
            <SectionCard
              title="Today's attendance"
              icon={BarChart3}
              action={
                <Link href="/attendance" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-300">
                  View all
                  <ChevronRight className="size-3.5" />
                </Link>
              }
            >
              <div className="overflow-hidden rounded-[24px] border border-white/70 bg-white/70 dark:border-white/10 dark:bg-white/5">
                <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.7fr] border-b border-white/70 bg-white/60 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:border-white/10 dark:bg-white/5">
                  <span>Employee</span>
                  <span>Department</span>
                  <span>Punch in</span>
                  <span>Punch out</span>
                  <span>Status</span>
                </div>
                <div className="divide-y divide-white/70 dark:divide-white/10">
                  {punchSheetData.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-zinc-500">
                      {punchSheet === null ? 'Loading attendance data...' : 'No employee data available yet.'}
                    </div>
                  ) : (
                    punchSheetData.slice(0, 6).map((row) => {
                      const statusTone =
                        row.session === null
                          ? 'bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-500/10 dark:text-rose-200 dark:border-rose-500/20'
                          : row.session.punchOutAt === null
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-500/20'
                            : 'bg-zinc-100 text-zinc-600 border-zinc-200/70 dark:bg-white/10 dark:text-zinc-200 dark:border-white/10'

                      return (
                        <div
                          key={row.employee._id}
                          className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.7fr] items-center px-4 py-4 transition-all duration-300 hover:bg-white/70 dark:hover:bg-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(99,102,241,0.24)]">
                              {getInitials(row.employee.fullName)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-zinc-950 dark:text-white">{row.employee.fullName}</p>
                              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{row.employee.position || 'Staff'}</p>
                            </div>
                          </div>
                          <div className="text-sm text-zinc-600 dark:text-zinc-300">{row.employee.department || 'Unassigned'}</div>
                          <div className="text-sm text-zinc-600 dark:text-zinc-300">{row.session ? formatTime(row.session.punchInAt) : '—'}</div>
                          <div className="text-sm text-zinc-600 dark:text-zinc-300">
                            {row.session?.punchOutAt ? formatTime(row.session.punchOutAt) : '—'}
                          </div>
                          <div>
                            <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${statusTone}`}>
                              <span className="size-1.5 rounded-full bg-current opacity-80" />
                              {row.session ? (row.session.punchOutAt === null ? 'Active' : 'Done') : 'Absent'}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Weekly attendance pulse" icon={TrendingUp}>
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.85fr)]">
                <div className="h-[320px] rounded-[24px] border border-white/70 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyTrend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="weeklyFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 8" stroke="rgba(148,163,184,0.22)" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        stroke="#94a3b8"
                        fontSize={12}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        stroke="#94a3b8"
                        fontSize={12}
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ stroke: 'rgba(99,102,241,0.12)', strokeWidth: 16 }}
                        contentStyle={{
                          borderRadius: 16,
                          border: '1px solid rgba(148,163,184,0.22)',
                          background: 'rgba(255,255,255,0.96)',
                          boxShadow: '0 18px 50px rgba(15,23,42,0.12)',
                        }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fill="url(#weeklyFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3 rounded-[24px] border border-white/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Week summary</p>
                    <p className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                      {weeklyTrend.reduce((sum, entry) => sum + entry.value, 0)} punch-ins
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Across the last seven days.</p>
                  </div>
                  <div className="space-y-3 pt-2">
                    {weeklyTrend.map((entry) => {
                      const width = `${Math.max((entry.value / peakWeekValue) * 100, entry.value ? 10 : 0)}%`
                      return (
                        <div key={entry.date} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            <span>{entry.label}</span>
                            <span>{entry.value}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all duration-500"
                              style={{ width }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Recent activity" icon={Layers3}>
              <div className="space-y-2">
                {recentActivity.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-white/70 bg-white/60 px-4 py-10 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-white/5">
                    No recent activity yet.
                  </div>
                ) : (
                  recentActivity.map((session) => (
                    <div
                      key={session._id}
                      className="group flex items-center gap-4 rounded-[22px] border border-white/70 bg-white/70 px-4 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    >
                      <div
                        className={`flex size-11 items-center justify-center rounded-2xl text-sm font-semibold shadow-sm ${
                          session.punchOutAt === null
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-200'
                        }`}
                      >
                        {session.punchOutAt === null ? 'IN' : 'OUT'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-950 dark:text-white">
                          {session.userName || session.userEmail || 'Unknown employee'}
                        </p>
                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {session.punchOutAt === null ? 'Punched in' : 'Punched out'} · {formatDate(session.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{formatTime(session.punchInAt)}</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                          {session.punchOutAt ? formatTime(session.punchOutAt) : 'Still active'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard
              title="Weekly overview"
              icon={BarChart3}
              action={
                <span className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                  This week
                </span>
              }
            >
              <div className="h-[280px] rounded-[24px] border border-white/70 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={weeklyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 8" stroke="rgba(148,163,184,0.18)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      stroke="#94a3b8"
                      fontSize={12}
                    />
                    <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(99,102,241,0.08)' }}
                      contentStyle={{
                        borderRadius: 16,
                        border: '1px solid rgba(148,163,184,0.22)',
                        background: 'rgba(255,255,255,0.96)',
                        boxShadow: '0 18px 50px rgba(15,23,42,0.12)',
                      }}
                    />
                    <Bar dataKey="value" radius={[14, 14, 6, 6]} barSize={24}>
                      {weeklyTrend.map((entry, index) => (
                        <Cell key={entry.date} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Department mix" icon={Building2}>
              {deptDistribution.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-white/70 bg-white/60 px-4 py-10 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-white/5">
                  No department data yet.
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_170px]">
                  <div className="space-y-3">
                    {deptDistribution.map((entry) => (
                      <div
                        key={entry.name}
                        className="rounded-[22px] border border-white/70 bg-white/70 px-4 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                      >
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="truncate font-medium text-zinc-700 dark:text-zinc-200">{entry.name}</span>
                          </div>
                          <span className="font-semibold text-zinc-950 dark:text-white">{entry.value}</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max((entry.value / Math.max(...deptDistribution.map((item) => item.value), 1)) * 100, 10)}%`,
                              backgroundColor: entry.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex h-full items-center justify-center rounded-[24px] border border-white/70 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Tooltip
                          contentStyle={{
                            borderRadius: 16,
                            border: '1px solid rgba(148,163,184,0.22)',
                            background: 'rgba(255,255,255,0.96)',
                            boxShadow: '0 18px 50px rgba(15,23,42,0.12)',
                          }}
                        />
                        <Pie
                          data={deptDistribution}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={58}
                          outerRadius={94}
                          paddingAngle={4}
                        >
                          {deptDistribution.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </SectionCard>

            <SectionCard title="People intelligence" icon={UserCheck}>
              <div className="space-y-3">
                <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Largest department</p>
                      <p className="mt-1 text-lg font-semibold text-zinc-950 dark:text-white">{topDept.name}</p>
                    </div>
                    <GraduationCap className="size-5 text-indigo-500" />
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                      style={{ width: `${Math.min(Math.max((topDept.count / Math.max(totalEmployees, 1)) * 100, 8), 100)}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Current clock-ins</p>
                      <p className="mt-1 text-lg font-semibold text-zinc-950 dark:text-white">
                        {punchedInNow}/{totalEmployees}
                      </p>
                    </div>
                    <Clock3 className="size-5 text-cyan-500" />
                  </div>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Real-time presence for the active workday.
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Weekly hours</p>
                      <p className="mt-1 text-lg font-semibold text-zinc-950 dark:text-white">{formatDuration(myWeekHours)}</p>
                    </div>
                    <TrendingUp className="size-5 text-emerald-500" />
                  </div>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Only completed sessions are counted.</p>
                </div>

                {absentToday.length > 0 && (
                  <div className="rounded-[22px] border border-amber-200/70 bg-amber-50/80 p-4 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
                    <div className="flex items-start gap-3">
                      <UserX className="mt-0.5 size-5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">{absentToday.length} employee(s) absent today</p>
                        <p className="mt-1 text-sm text-amber-700 dark:text-amber-200/80">
                          {absentToday.slice(0, 3).map((employee) => employee.fullName).join(', ')}
                          {absentToday.length > 3 ? ` +${absentToday.length - 3} more` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            {typeDistribution.length > 1 ? (
              <SectionCard title="Employee types" icon={Users}>
                <div className="space-y-2">
                  {typeDistribution.map((entry) => (
                    <div
                      key={entry.name}
                      className="flex items-center justify-between rounded-[18px] border border-white/70 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{entry.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-zinc-950 dark:text-white">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
