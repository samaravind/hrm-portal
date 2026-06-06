'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useRouter } from 'next/navigation'
import {
  Users, Clock, Building2, UserPlus, LogIn, LogOut,
  TrendingUp, Calendar, ChevronRight, Activity, List,
  BarChart3, PieChart, UserX, Bell,
  UserCheck, Wallet, Medal,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend,
} from 'recharts'

const DEPT_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444', '#ec4899']

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function formatDuration(ms: number) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h}h ${m}m`
}

function getWeekDates() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
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

  const punchSheet = useQuery(
    api.attendance.getPunchSheet,
    viewerIdentity ?? 'skip',
  )

  const todaySession = useQuery(
    api.attendance.getTodaySession,
    viewerIdentity ?? 'skip',
  )

  const mySessions = useQuery(
    api.attendance.getMySessions,
    viewerIdentity ?? 'skip',
  )

  const punchIn = useMutation(api.attendance.punchIn)
  const punchOut = useMutation(api.attendance.punchOut)
  const [punching, setPunching] = useState(false)
  const [punchError, setPunchError] = useState<string | null>(null)

  const isAdmin = viewer?.role === 'admin'

  useEffect(() => {
    if (viewer !== undefined && isLoaded && !isAdmin) {
      router.replace('/staff-dashboard')
    }
  }, [viewer, isLoaded, isAdmin, router])

  const handlePunchIn = async () => {
    if (!viewerIdentity || punching) return
    setPunching(true)
    setPunchError(null)
    try {
      await punchIn(viewerIdentity)
    } catch (e) {
      setPunchError(e instanceof Error ? e.message : 'Failed to punch in')
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
    } catch (e) {
      setPunchError(e instanceof Error ? e.message : 'Failed to punch out')
    } finally {
      setPunching(false)
    }
  }

  const todayKey = getTodayKey()

  const attendanceToday = useMemo(() => {
    return allSessions.filter((s) => s.dateKey === todayKey)
  }, [allSessions, todayKey])

  const presentToday = attendanceToday.filter((s) => s.punchInAt).length
  const punchedInNow = attendanceToday.filter((s) => s.punchInAt && s.punchOutAt === null).length
  const onLeave = employees.length - presentToday

  const totalDepartments = useMemo(() => {
    return new Set(employees.map((e) => e.department).filter(Boolean)).size
  }, [employees])

  const totalEmployees = employees.length

  const avgSalary = useMemo(() => {
    const withSalary = employees.filter((e) => e.salary)
    if (!withSalary.length) return null
    const avg = withSalary.reduce((s, e) => s + (e.salary ?? 0), 0) / withSalary.length
    return avg
  }, [employees])

  const newThisMonth = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    return employees.filter((e) => e._creationTime >= monthStart).length
  }, [employees])

  const weeklyTrend = useMemo(() => {
    const weekDates = getWeekDates()
    const counts: Record<string, number> = {}
    for (const d of weekDates) counts[d] = 0
    for (const s of allSessions) {
      if (counts[s.dateKey] !== undefined) {
        counts[s.dateKey]++
      }
    }
    return weekDates.map((date) => ({
      date: formatDate(new Date(date).getTime()),
      punches: counts[date] ?? 0,
      fullDate: date,
    }))
  }, [allSessions])

  const deptDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of employees) {
      const dept = e.department || 'Unassigned'
      counts[dept] = (counts[dept] ?? 0) + 1
    }
    return Object.entries(counts).map(([name, value], i) => ({
      name,
      value,
      color: DEPT_COLORS[i % DEPT_COLORS.length],
    }))
  }, [employees])

  const recentActivity = useMemo(() => {
    return allSessions.slice(0, 10)
  }, [allSessions])

  const punchSheetData = useMemo(() => {
    if (!punchSheet) return []
    return punchSheet
  }, [punchSheet])

  const myWeekHours = useMemo(() => {
    if (!mySessions) return 0
    const weekDates = getWeekDates()
    let total = 0
    for (const s of mySessions) {
      if (weekDates.includes(s.dateKey) && s.punchInAt && s.punchOutAt) {
        total += s.punchOutAt - s.punchInAt
      }
    }
    return total
  }, [mySessions])

  // Type distribution
  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of employees) {
      const t = e.employeeType || 'Employee'
      counts[t] = (counts[t] ?? 0) + 1
    }
    return Object.entries(counts).map(([name, value], i) => ({
      name,
      value,
      color: DEPT_COLORS[i % DEPT_COLORS.length],
    }))
  }, [employees])

  // Employees not punched in today (absent/on leave)
  const absentToday = useMemo(() => {
    if (!punchSheet) return []
    return punchSheet.filter((row) => !row.session).map((r) => r.employee)
  }, [punchSheet])

  // Top department
  const topDept = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of employees) {
      const dept = e.department || 'Unassigned'
      counts[dept] = (counts[dept] ?? 0) + 1
    }
    let maxDept = ''
    let maxCount = 0
    for (const [dept, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count
        maxDept = dept
      }
    }
    return { name: maxDept, count: maxCount }
  }, [employees])

  // Total payroll this month (approximate)
  const monthlyPayroll = useMemo(() => {
    const total = employees.reduce((s, e) => s + (e.salary ?? 0), 0)
    return total
  }, [employees])

  const formatCurrency = (amount: number) => {
    return '₹' + amount.toLocaleString('en-IN')
  }

  if (viewer !== undefined && isLoaded && !isAdmin) {
    return null
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-zinc-400">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            {viewer?.name ? `Welcome back, ${viewer.name.split(' ')[0]}` : 'Dashboard'}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isAdmin
              ? `Manage your team — ${totalEmployees} employees across ${totalDepartments} departments`
              : 'Track your attendance and activity'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {todaySession ? (
            todaySession.punchOutAt === null ? (
              <button
                onClick={handlePunchOut}
                disabled={punching}
                className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition cursor-pointer disabled:opacity-50"
              >
                <LogOut className="size-4" />
                {punching ? 'Punching out...' : 'Punch Out'}
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm text-zinc-500">
                <Clock className="size-4" />
                Completed
              </span>
            )
          ) : (
            <button
              onClick={handlePunchIn}
              disabled={punching}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition cursor-pointer disabled:opacity-50"
            >
              <LogIn className="size-4" />
              {punching ? 'Punching in...' : 'Punch In'}
            </button>
          )}
        </div>
      </div>

      {punchError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {punchError}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl bg-white border border-zinc-200 shadow-xs px-4 py-3.5 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
              <Users className="size-4.5 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-bold text-zinc-900">{totalEmployees}</div>
              <div className="text-[11px] text-zinc-500 truncate">Total Employees</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white border border-zinc-200 shadow-xs px-4 py-3.5 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <UserCheck className="size-4.5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-bold text-zinc-900">{presentToday}</div>
              <div className="text-[11px] text-zinc-500 truncate">Present Today</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white border border-zinc-200 shadow-xs px-4 py-3.5 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <UserX className="size-4.5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-bold text-zinc-900">{onLeave}</div>
              <div className="text-[11px] text-zinc-500 truncate">On Leave</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white border border-zinc-200 shadow-xs px-4 py-3.5 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
              <Building2 className="size-4.5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-bold text-zinc-900">{totalDepartments}</div>
              <div className="text-[11px] text-zinc-500 truncate">Departments</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white border border-zinc-200 shadow-xs px-4 py-3.5 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
              <Wallet className="size-4.5 text-rose-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-bold text-zinc-900">
                {isAdmin && avgSalary ? formatCurrency(avgSalary) : formatCurrency(monthlyPayroll)}
              </div>
              <div className="text-[11px] text-zinc-500 truncate">
                {isAdmin ? 'Avg Salary' : 'Monthly Payroll'}
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white border border-zinc-200 shadow-xs px-4 py-3.5 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
              <Medal className="size-4.5 text-sky-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-bold text-zinc-900">{newThisMonth}</div>
              <div className="text-[11px] text-zinc-500 truncate">New This Month</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        {isAdmin && (
          <>
            <Link
              href="/employee"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition shadow-xs"
            >
              <UserPlus className="size-4" />
              Create Employee
            </Link>
            <Link
              href="/attendance"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition shadow-xs"
            >
              <List className="size-4" />
              Attendance Log
            </Link>
          </>
        )}
        <Link
          href="/my-attendance"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition shadow-xs"
        >
          <Calendar className="size-4" />
          My Attendance
        </Link>
      </div>

      {/* Main Grid — Attendance / Activity (left) + Charts / Widgets (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left column: Attendance Table + Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Attendance (Admin) / My Sessions (Staff) */}
          <div className="rounded-xl bg-white border border-zinc-200 shadow-xs overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-zinc-500" />
                <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                  {isAdmin ? "Today's Attendance" : 'My Recent Sessions'}
                </h2>
              </div>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">{todayKey}</span>
            </div>
            <div className="overflow-x-auto">
              {isAdmin ? (
                punchSheetData.length === 0 ? (
                  <div className="py-12 text-center text-sm text-zinc-400">
                    {punchSheet === null ? 'Loading...' : 'No employee data available'}
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">Employee</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">Department</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">Punch In</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">Punch Out</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {punchSheetData.slice(0, 6).map((row) => (
                        <tr key={row.employee._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="size-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700">
                                {row.employee.fullName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-zinc-800">{row.employee.fullName}</div>
                                <div className="text-xs text-zinc-400">{row.employee.position}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-zinc-600">{row.employee.department || '—'}</td>
                          <td className="px-4 py-3 text-zinc-600">
                            {row.session ? formatTime(row.session.punchInAt) : '—'}
                          </td>
                          <td className="px-4 py-3 text-zinc-600">
                            {row.session?.punchOutAt ? formatTime(row.session.punchOutAt) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {row.session ? (
                              row.session.punchOutAt === null ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                  <span className="size-1.5 rounded-full bg-emerald-500" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                                  <span className="size-1.5 rounded-full bg-zinc-400" />
                                  Done
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-400">
                                <span className="size-1.5 rounded-full bg-zinc-300" />
                                Absent
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : (
                <table className="w-full text-sm">
                  <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">Punch In</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">Punch Out</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {(mySessions ?? []).slice(0, 5).map((s) => (
                      <tr key={s._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                        <td className="px-4 py-3 text-zinc-700 font-medium">
                          {new Date(s.dateKey).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </td>
                        <td className="px-4 py-3 text-zinc-600">{formatTime(s.punchInAt)}</td>
                        <td className="px-4 py-3 text-zinc-600">
                          {s.punchOutAt ? formatTime(s.punchOutAt) : (
                            <span className="text-emerald-600 font-medium">Active</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-zinc-600">
                          {s.punchOutAt ? formatDuration(s.punchOutAt - s.punchInAt) : '—'}
                        </td>
                      </tr>
                    ))}
                    {(mySessions ?? []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-sm text-zinc-400">
                          No attendance records yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            <div className="border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
              <Link
                href={isAdmin ? '/attendance' : '/my-attendance'}
                className="flex items-center justify-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition"
              >
                View all <ChevronRight className="size-3" />
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl bg-white border border-zinc-200 shadow-xs overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-zinc-500" />
                <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Recent Activity</h2>
              </div>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {recentActivity.length === 0 ? (
                <div className="py-8 text-center text-sm text-zinc-400">
                  No activity yet. Start by punching in!
                </div>
              ) : (
                recentActivity.slice(0, 6).map((s) => (
                  <div key={s._id} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                    <div className={`size-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                      s.punchOutAt === null
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {s.punchOutAt === null ? '→' : '←'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-800 truncate dark:text-zinc-100">
                        {s.userName || s.userEmail || 'Unknown'}
                      </div>
                      <div className="text-xs text-zinc-400 dark:text-zinc-500">
                        {s.punchOutAt === null ? 'Punched in' : 'Punched out'} &middot; {formatDate(s.createdAt)}
                      </div>
                    </div>
                    <div className="text-xs text-zinc-400 shrink-0 dark:text-zinc-500">
                      {formatTime(s.punchInAt)}
                      {s.punchOutAt && ` - ${formatTime(s.punchOutAt)}`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column: Charts + Widgets */}
        <div className="space-y-6">
          {/* Weekly Trend Chart */}
          <div className="rounded-xl bg-white border border-zinc-200 shadow-xs p-5 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="size-4 text-zinc-500" />
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Weekly Attendance</h3>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTrend}>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#a1a1aa' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#a1a1aa' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e4e4e7',
                      fontSize: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                  />
                  <Bar dataKey="punches" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Distribution */}
          {deptDistribution.length > 0 && (
            <div className="rounded-xl bg-white border border-zinc-200 shadow-xs p-5 dark:bg-zinc-900 dark:border-zinc-800">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="size-4 text-zinc-500" />
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Departments</h3>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={deptDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={68}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {deptDistribution.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={6}
                      formatter={(value: string) => (
                        <span style={{ fontSize: '11px', color: '#71717a' }}>{value}</span>
                      )}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Notifications / Alerts (admin) or This Week Hours (staff) */}
          {isAdmin ? (
            <div className="rounded-xl bg-white border border-zinc-200 shadow-xs p-5 dark:bg-zinc-900 dark:border-zinc-800">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="size-4 text-zinc-500" />
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Notifications</h3>
              </div>
              <div className="space-y-3">
                {absentToday.length > 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <UserX className="size-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-amber-800">{absentToday.length} employee(s) absent today</div>
                      <div className="text-xs text-amber-600 mt-0.5">
                        {absentToday.slice(0, 3).map((e) => e.fullName).join(', ')}
                        {absentToday.length > 3 && ` +${absentToday.length - 3} more`}
                      </div>
                    </div>
                  </div>
                )}
                {newThisMonth > 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-sky-50 border border-sky-200">
                    <UserPlus className="size-4 text-sky-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-sky-800">{newThisMonth} new hire(s) this month</div>
                    </div>
                  </div>
                )}
                {punchedInNow > 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <UserCheck className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-emerald-800">{punchedInNow} employee(s) currently active</div>
                    </div>
                  </div>
                )}
                {absentToday.length === 0 && newThisMonth === 0 && (
                  <div className="text-sm text-zinc-400 text-center py-4">No new notifications</div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-white border border-zinc-200 shadow-xs p-5 dark:bg-zinc-900 dark:border-zinc-800">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="size-4 text-zinc-500" />
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">This Week</h3>
              </div>
              <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatDuration(myWeekHours || 0)}
              </div>
              <div className="text-sm text-zinc-500 mt-1 dark:text-zinc-400">Total hours worked</div>
              {mySessions && (
                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Sessions this week</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                      {mySessions.filter((s) => getWeekDates().includes(s.dateKey)).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-zinc-500 dark:text-zinc-400">Today completed</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                      {todaySession?.punchOutAt ? 'Yes' : todaySession ? 'In progress' : 'No'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Employee Type Distribution (admin only) */}
          {isAdmin && typeDistribution.length > 1 && (
            <div className="rounded-xl bg-white border border-zinc-200 shadow-xs p-5 dark:bg-zinc-900 dark:border-zinc-800">
              <div className="flex items-center gap-2 mb-4">
                <Users className="size-4 text-zinc-500" />
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Employee Types</h3>
              </div>
              <div className="space-y-2.5">
                {typeDistribution.map((t) => (
                  <div key={t.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                      <span className="text-sm text-zinc-600 dark:text-zinc-300">{t.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{t.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick employee stats (admin) */}
          {isAdmin && (
            <div className="rounded-xl bg-white border border-zinc-200 shadow-xs p-5 dark:bg-zinc-900 dark:border-zinc-800">
              <div className="flex items-center gap-2 mb-4">
                <Medal className="size-4 text-zinc-500" />
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Snapshot</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Largest department</span>
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{topDept.name} ({topDept.count})</span>
                </div>
                <div className="border-t border-zinc-100 dark:border-zinc-800" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Monthly payroll</span>
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{formatCurrency(monthlyPayroll)}</span>
                </div>
                <div className="border-t border-zinc-100 dark:border-zinc-800" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Attendance rate</span>
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                    {totalEmployees > 0
                      ? `${Math.round((presentToday / totalEmployees) * 100)}%`
                      : '—'}
                  </span>
                </div>
                <div className="border-t border-zinc-100 dark:border-zinc-800" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Currently clocked in</span>
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{punchedInNow}/{totalEmployees}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
