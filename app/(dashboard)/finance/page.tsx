'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { BadgeDollarSign, CalendarDays, ChevronDown, Download, Printer, Search, Users, Wallet, CircleCheckBig, Clock3 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pagination } from '@/components/ui/pagination'
import { toast } from 'sonner'

type FinanceDashboardRecord = {
  salary: Doc<'salaries'>
  employee: Doc<'employees'> | null
  payment: Doc<'salaryPayments'> | null
  attendanceSummary: string
}

type FinanceDashboardResponse = {
  monthKey: string
  monthLabel: string
  totalEmployees: number
  totalRecords: number
  records: FinanceDashboardRecord[]
  summary: {
    totalPayroll: number
    paidPayroll: number
    pendingPayroll: number
    paidCount: number
    pendingCount: number
  }
}

type EmployeeSalaryHistoryResponse = {
  employee: Doc<'employees'> | null
  records: Array<{
    salary: Doc<'salaries'>
    payment: Doc<'salaryPayments'> | null
  }>
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function formatDate(timestamp: number | null | undefined) {
  if (!timestamp) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp))
}

function formatMonthKey(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)
  return `${MONTHS[(month ?? 1) - 1] ?? 'Month'} ${year}`
}

function formatHours(hours: number) {
  return `${hours.toFixed(2)}h`
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildPrintWindow(record: FinanceDashboardRecord) {
  const slipWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1200')
  if (!slipWindow) {
    toast.error('Please allow popups to download the salary slip.')
    return
  }

  const employeeName = record.employee?.fullName ?? record.salary.employeeName
  const employeeCode = record.employee?.employeeId ?? record.salary.employeeCode
  const department = record.employee?.department ?? 'Unassigned'
  const bankName = record.employee?.bankName ?? '—'
  const accountNumber = record.employee?.accountNumber ?? '—'
  const ifscCode = record.employee?.ifscCode ?? '—'
  const html = `
    <html>
      <head>
        <title>Salary Slip - ${employeeName}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: Inter, Arial, sans-serif;
            background: #f4f5f7;
            color: #111827;
          }
          .sheet {
            max-width: 900px;
            margin: 0 auto;
            padding: 32px;
          }
          .card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 24px;
            padding: 32px;
            box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
          }
          .top {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            align-items: flex-start;
            margin-bottom: 24px;
          }
          .brand {
            font-size: 14px;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: #6b7280;
            font-weight: 700;
          }
          .title {
            font-size: 32px;
            margin: 8px 0 4px;
            line-height: 1.1;
          }
          .sub {
            color: #6b7280;
            margin: 0;
          }
          .pill {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border-radius: 999px;
            border: 1px solid #d1d5db;
            padding: 8px 14px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.14em;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
            margin-top: 24px;
          }
          .box {
            border: 1px solid #e5e7eb;
            border-radius: 18px;
            padding: 16px;
            background: #fafafa;
          }
          .label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.18em;
            color: #9ca3af;
            margin-bottom: 6px;
          }
          .value {
            font-size: 16px;
            font-weight: 700;
          }
          .section {
            margin-top: 24px;
            border-top: 1px solid #e5e7eb;
            padding-top: 24px;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }
          .table td {
            padding: 10px 0;
            border-bottom: 1px solid #f3f4f6;
            vertical-align: top;
          }
          .table td:first-child {
            color: #6b7280;
            width: 48%;
          }
          @media print {
            body { background: white; }
            .sheet { padding: 0; }
            .card { box-shadow: none; border: 0; border-radius: 0; }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="card">
            <div class="top">
              <div>
                <div class="brand">SAM MARKET</div>
                <h1 class="title">Salary Slip</h1>
                <p class="sub">${record.salary.monthKey}</p>
              </div>
              <div class="pill">${record.salary.paymentStatus.toUpperCase()}</div>
            </div>

            <div class="grid">
              <div class="box">
                <div class="label">Employee</div>
                <div class="value">${employeeName}</div>
                <div class="sub">${employeeCode}</div>
              </div>
              <div class="box">
                <div class="label">Department</div>
                <div class="value">${department}</div>
                <div class="sub">${record.salary.employeeEmail}</div>
              </div>
              <div class="box">
                <div class="label">Bank Details</div>
                <div class="value">${bankName}</div>
                <div class="sub">${accountNumber} · ${ifscCode}</div>
              </div>
              <div class="box">
                <div class="label">Payment Date</div>
                <div class="value">${formatDate(record.salary.paymentDate ?? record.payment?.paidAt ?? null)}</div>
                <div class="sub">${record.payment?.paymentMethod ?? 'Pending'}</div>
              </div>
            </div>

            <div class="section">
              <h2>Salary Breakdown</h2>
              <table class="table">
                <tr><td>Basic Salary</td><td>${formatCurrency(record.salary.baseSalary)}</td></tr>
                <tr><td>Allowances</td><td>${formatCurrency(record.salary.allowances)}</td></tr>
                <tr><td>Bonus</td><td>${formatCurrency(record.salary.bonus)}</td></tr>
                <tr><td>Overtime Pay</td><td>${formatCurrency(record.salary.overtimePay)}</td></tr>
                <tr><td>Deductions</td><td>${formatCurrency(record.salary.deductions)}</td></tr>
                <tr><td>Absence Deduction</td><td>${formatCurrency(record.salary.absenceDeduction)}</td></tr>
                <tr><td>Final Salary</td><td><strong>${formatCurrency(record.salary.finalSalary)}</strong></td></tr>
              </table>
            </div>

            <div class="section">
              <h2>Attendance Summary</h2>
              <table class="table">
                <tr><td>Working Days</td><td>${record.salary.workingDays}</td></tr>
                <tr><td>Present Days</td><td>${record.salary.presentDays}</td></tr>
                <tr><td>Absent Days</td><td>${record.salary.absentDays}</td></tr>
                <tr><td>Half Days</td><td>${record.salary.halfDays}</td></tr>
                <tr><td>Paid Leave Days</td><td>${record.salary.paidLeaveDays}</td></tr>
                <tr><td>Overtime Hours</td><td>${formatHours(record.salary.overtimeHours)}</td></tr>
              </table>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  slipWindow.document.open()
  slipWindow.document.write(html)
  slipWindow.document.close()
  slipWindow.focus()
  setTimeout(() => slipWindow.print(), 300)
}

function escapePdfText(text: string) {
  return text.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)')
}

function pdfLine(text: string, x: number, y: number, size = 11) {
  return `BT /F1 ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`
}

function downloadSalarySlip(record: FinanceDashboardRecord) {
  const employeeName = record.employee?.fullName ?? record.salary.employeeName
  const employeeCode = record.employee?.employeeId ?? record.salary.employeeCode
  const department = record.employee?.department ?? 'Unassigned'
  const bankName = record.employee?.bankName ?? 'N/A'
  const accountNumber = record.employee?.accountNumber ?? 'N/A'
  const ifscCode = record.employee?.ifscCode ?? 'N/A'
  const paymentDate = formatDate(record.salary.paymentDate ?? record.payment?.paidAt ?? null)

  const content = [
    pdfLine('SAM MARKET', 40, 760, 16),
    pdfLine('Salary Slip', 40, 736, 22),
    pdfLine(`Month: ${record.salary.monthKey}`, 40, 714, 11),
    pdfLine(`Status: ${record.salary.paymentStatus.toUpperCase()}`, 380, 714, 11),
    pdfLine(`Employee: ${employeeName}`, 40, 676, 12),
    pdfLine(`Employee ID: ${employeeCode}`, 40, 658, 11),
    pdfLine(`Department: ${department}`, 40, 640, 11),
    pdfLine(`Email: ${record.salary.employeeEmail}`, 40, 622, 11),
    pdfLine(`Bank: ${bankName}`, 40, 590, 11),
    pdfLine(`Account Number: ${accountNumber}`, 40, 572, 11),
    pdfLine(`IFSC Code: ${ifscCode}`, 40, 554, 11),
    pdfLine(`Payment Date: ${paymentDate}`, 40, 536, 11),
    pdfLine('Salary Breakdown', 40, 498, 14),
    pdfLine(`Basic Salary: Rs. ${record.salary.baseSalary.toLocaleString('en-IN')}`, 40, 476, 11),
    pdfLine(`Allowances: Rs. ${record.salary.allowances.toLocaleString('en-IN')}`, 40, 458, 11),
    pdfLine(`Bonus: Rs. ${record.salary.bonus.toLocaleString('en-IN')}`, 40, 440, 11),
    pdfLine(`Overtime Pay: Rs. ${record.salary.overtimePay.toLocaleString('en-IN')}`, 40, 422, 11),
    pdfLine(`Deductions: Rs. ${record.salary.deductions.toLocaleString('en-IN')}`, 40, 404, 11),
    pdfLine(`Absence Deduction: Rs. ${record.salary.absenceDeduction.toLocaleString('en-IN')}`, 40, 386, 11),
    pdfLine(`Final Salary: Rs. ${record.salary.finalSalary.toLocaleString('en-IN')}`, 40, 362, 13),
    pdfLine('Attendance Summary', 40, 324, 14),
    pdfLine(`Working Days: ${record.salary.workingDays}`, 40, 302, 11),
    pdfLine(`Present Days: ${record.salary.presentDays}`, 40, 284, 11),
    pdfLine(`Absent Days: ${record.salary.absentDays}`, 40, 266, 11),
    pdfLine(`Half Days: ${record.salary.halfDays}`, 40, 248, 11),
    pdfLine(`Paid Leave Days: ${record.salary.paidLeaveDays}`, 40, 230, 11),
    pdfLine(`Overtime Hours: ${formatHours(record.salary.overtimeHours)}`, 40, 212, 11),
  ].join('\n')

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = ['0000000000 65535 f \n']
  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(`${String(pdf.length).padStart(10, '0')} 00000 n \n`)
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`
  }
  const xrefPos = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n${offsets.join('')}`
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`

  const blob = new Blob([pdf], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `salary-slip-${record.salary.monthKey}-${employeeName.replaceAll(' ', '-').toLowerCase()}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function DashboardCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string
  value: string
  subtitle: string
  icon: typeof Wallet
}) {
  return (
    <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-900 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">{title}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">{value}</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-900 dark:bg-zinc-900 dark:text-zinc-300">
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  )
}

export default function FinancePage() {
  const router = useRouter()
  const { isLoaded, user } = useUser()
  const viewer = useQuery(api.users.viewer)
  const [month, setMonth] = useState(() => new Date().getMonth() + 1)
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'paid' | 'pending'>('all')
  const [page, setPage] = useState(1)
  const [selectedRecord, setSelectedRecord] = useState<FinanceDashboardRecord | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)

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
    [isLoaded, user],
  )

  const syncMonthlySalaryRecords = useMutation(api.finance.syncMonthlySalaryRecords)
  const setSalaryPaymentStatus = useMutation(api.finance.setSalaryPaymentStatus)

  useEffect(() => {
    if (!isLoaded || viewer === undefined) return
    if (!isAdmin) {
      router.replace('/')
    }
  }, [viewer, isLoaded, isAdmin, router])

  useEffect(() => {
    if (!viewerIdentity || !isAdmin) return
    let cancelled = false
    void syncMonthlySalaryRecords({
      ...viewerIdentity,
      year,
      month,
    })
      .catch((error) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Failed to sync salary records.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [viewerIdentity, isAdmin, year, month, syncMonthlySalaryRecords])

  const dashboard = useQuery(
    api.finance.getFinanceDashboard,
    viewerIdentity && isAdmin
      ? {
          ...viewerIdentity,
          year,
          month,
          search,
          status,
        }
      : 'skip',
  ) as FinanceDashboardResponse | null | undefined

  const history = useQuery(
    api.finance.getEmployeeSalaryHistory,
    viewerIdentity && isAdmin && selectedRecord
      ? {
          ...viewerIdentity,
          employeeId: selectedRecord.salary.employeeId,
        }
      : 'skip',
  ) as EmployeeSalaryHistoryResponse | null | undefined

  const records = dashboard?.records ?? []
  const totalPages = Math.max(1, Math.ceil(records.length / 8))
  const currentPage = Math.min(page, totalPages)
  const paginatedRecords = records.slice((currentPage - 1) * 8, currentPage * 8)

  const summaryCards = useMemo(() => {
    const totalRecords = dashboard?.totalRecords ?? 0
    const totalEmployees = dashboard?.totalEmployees ?? 0
    const totalPayroll = dashboard?.summary.totalPayroll ?? 0
    const paidCount = dashboard?.summary.paidCount ?? 0
    const pendingCount = dashboard?.summary.pendingCount ?? 0
    return {
      totalRecords,
      totalEmployees,
      totalPayroll,
      paidCount,
      pendingCount,
    }
  }, [dashboard])

  const handleMarkPaid = async (record: FinanceDashboardRecord) => {
    if (actionId) return
    setActionId(record.salary._id)
    try {
      await setSalaryPaymentStatus({
        ...viewerIdentity!,
        salaryId: record.salary._id,
        status: 'paid',
        paymentMethod: record.payment?.paymentMethod ?? 'bank-transfer',
      })
      toast.success('Salary marked as paid.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update salary status.')
    } finally {
      setActionId(null)
    }
  }

  const handleMarkPending = async (record: FinanceDashboardRecord) => {
    if (actionId) return
    setActionId(record.salary._id)
    try {
      await setSalaryPaymentStatus({
        ...viewerIdentity!,
        salaryId: record.salary._id,
        status: 'pending',
      })
      toast.success('Salary reverted to pending.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update salary status.')
    } finally {
      setActionId(null)
    }
  }

  if (viewer !== undefined && isLoaded && !isAdmin) {
    return null
  }

  if (!isLoaded || !dashboard) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-[28px] border border-zinc-200 bg-white text-zinc-500 dark:border-zinc-900 dark:bg-zinc-950 dark:text-zinc-300">
        <div className="flex items-center gap-3">
          <Wallet className="size-5 animate-pulse" />
          Loading finance dashboard...
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 space-y-5 px-4 py-4 text-zinc-950 dark:text-white sm:px-6 lg:px-8">
      <section className="flex flex-col gap-4 rounded-[32px] border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-900 dark:bg-zinc-950 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-400 dark:text-zinc-500">Finance</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            Enterprise Payroll Management
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Auto-generated monthly salary records, attendance-linked calculations, payment tracking, and printable salary slips.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsSyncing(true)
              void syncMonthlySalaryRecords({
                ...viewerIdentity!,
                year,
                month,
              })
                .then(() => toast.success('Salary records refreshed.'))
                .catch((error) => toast.error(error instanceof Error ? error.message : 'Failed to refresh records.'))
                .finally(() => setIsSyncing(false))
            }}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
          >
            <CircleCheckBig className="size-4" />
            {isSyncing ? 'Refreshing...' : 'Refresh Records'}
          </button>
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-600 dark:border-zinc-900 dark:bg-zinc-900 dark:text-zinc-300">
            <Clock3 className="size-4" />
            {dashboard.monthLabel}
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-4">
        <DashboardCard title="Total payroll" value={formatCurrency(summaryCards.totalPayroll)} subtitle="Across the selected month" icon={Wallet} />
        <DashboardCard title="Paid salary" value={`${summaryCards.paidCount}`} subtitle={`Records paid: ${formatCurrency(dashboard.summary.paidPayroll)}`} icon={BadgeDollarSign} />
        <DashboardCard title="Pending salary" value={`${summaryCards.pendingCount}`} subtitle={`Records pending: ${formatCurrency(dashboard.summary.pendingPayroll)}`} icon={Clock3} />
        <DashboardCard title="Employees tracked" value={`${summaryCards.totalEmployees}`} subtitle={`${summaryCards.totalRecords} salary records available`} icon={Users} />
      </div>

      <section className="rounded-[32px] border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-900 dark:bg-zinc-950 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.45fr_0.45fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search employee name, email, or employee ID..."
              className="w-full rounded-2xl border border-zinc-200 bg-white py-3 pl-11 pr-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-900 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-700"
            />
          </div>

          <Select
            value={String(month)}
            onValueChange={(value) => {
              setMonth(Number(value))
              setPage(1)
            }}
          >
            <SelectTrigger className="h-12 rounded-2xl border-zinc-200 bg-white text-sm font-semibold text-zinc-900 dark:border-zinc-900 dark:bg-zinc-950 dark:text-white">
              <CalendarDays className="mr-2 size-4 text-zinc-400" />
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-zinc-200 bg-white text-zinc-950 dark:border-zinc-900 dark:bg-zinc-950 dark:text-white">
              {MONTHS.map((label, index) => (
                <SelectItem key={label} value={String(index + 1)}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(year)}
            onValueChange={(value) => {
              setYear(Number(value))
              setPage(1)
            }}
          >
            <SelectTrigger className="h-12 rounded-2xl border-zinc-200 bg-white text-sm font-semibold text-zinc-900 dark:border-zinc-900 dark:bg-zinc-950 dark:text-white">
              <ChevronDown className="mr-2 size-4 text-zinc-400" />
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-zinc-200 bg-white text-zinc-950 dark:border-zinc-900 dark:bg-zinc-950 dark:text-white">
              {[year - 2, year - 1, year, year + 1, year + 2].map((optionYear) => (
                <SelectItem key={optionYear} value={String(optionYear)}>
                  {optionYear}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(['all', 'paid', 'pending'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setStatus(option)
                setPage(1)
              }}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                status === option
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-950'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900'
              }`}
            >
              {option === 'all' ? 'All statuses' : option === 'paid' ? 'Paid' : 'Pending'}
            </button>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-xs dark:border-zinc-900 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-900">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">Monthly Finance Table</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Salary calculations are generated from the latest attendance collection and employee salary profile.
            </p>
          </div>
          <div className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-500 dark:border-zinc-900 dark:bg-zinc-950 dark:text-zinc-300">
            {records.length} records
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1280px] w-full border-collapse text-left text-sm">
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[10%]" />
              <col className="w-[14%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[8%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-zinc-200 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:border-zinc-900 dark:text-zinc-400">
                <th className="px-5 py-4">Employee Name</th>
                <th className="px-5 py-4">Employee ID</th>
                <th className="px-5 py-4">Attendance Summary</th>
                <th className="px-5 py-4">Basic Salary</th>
                <th className="px-5 py-4">Overtime</th>
                <th className="px-5 py-4">Deductions</th>
                <th className="px-5 py-4">Final Salary</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Payment Date</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    No salary records found for this month.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((record) => {
                  const statusTone = record.salary.paymentStatus === 'paid'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200'

                  return (
                    <tr key={record.salary._id} className="transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-900/60">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-zinc-950 dark:text-white">{record.employee?.fullName ?? record.salary.employeeName}</p>
                          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{record.employee?.email ?? record.salary.employeeEmail}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {record.employee?.employeeId ?? record.salary.employeeCode}
                      </td>
                      <td className="px-5 py-4 text-sm text-zinc-600 dark:text-zinc-300">{record.attendanceSummary}</td>
                      <td className="px-5 py-4 font-semibold text-zinc-950 dark:text-white">{formatCurrency(record.salary.baseSalary)}</td>
                      <td className="px-5 py-4 text-zinc-700 dark:text-zinc-300">
                        {formatHours(record.salary.overtimeHours)} · {formatCurrency(record.salary.overtimePay)}
                      </td>
                      <td className="px-5 py-4 text-zinc-700 dark:text-zinc-300">
                        {formatCurrency(record.salary.deductions + record.salary.absenceDeduction)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-zinc-950 dark:text-white">{formatCurrency(record.salary.finalSalary)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusTone}`}>
                          <span className="size-1.5 rounded-full bg-current opacity-80" />
                          {record.salary.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-zinc-600 dark:text-zinc-300">
                        {formatDate(record.salary.paymentDate ?? record.payment?.paidAt ?? null)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(record)}
                            className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadSalarySlip(record)}
                            className="inline-flex items-center gap-1 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                          >
                            <Download className="size-3.5" />
                            PDF
                          </button>
                          {record.salary.paymentStatus === 'paid' ? (
                            <button
                              type="button"
                              onClick={() => handleMarkPending(record)}
                              disabled={actionId === record.salary._id}
                              className="inline-flex items-center gap-1 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200"
                            >
                              Pending
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMarkPaid(record)}
                              disabled={actionId === record.salary._id}
                              className="inline-flex items-center gap-1 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200"
                            >
                              <BadgeDollarSign className="size-3.5" />
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-zinc-200 px-5 py-4 dark:border-zinc-900">
          <Pagination current={currentPage} total={records.length} pageSize={8} onChange={setPage} />
        </div>
      </section>

      {selectedRecord && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={() => setSelectedRecord(null)} />
      )}

      {selectedRecord && (
        <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[540px] flex-col border-l border-zinc-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.16)] dark:border-zinc-900 dark:bg-zinc-950">
          <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-900">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">Salary history</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              {selectedRecord.employee?.fullName ?? selectedRecord.salary.employeeName}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{selectedRecord.salary.employeeEmail}</p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-900 dark:bg-zinc-950">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">Final Salary</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-white">{formatCurrency(selectedRecord.salary.finalSalary)}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-900 dark:bg-zinc-950">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">Payment Status</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-white">
                  {selectedRecord.salary.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                </p>
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-900 dark:bg-zinc-950">
              <p className="text-sm font-semibold text-zinc-950 dark:text-white">Salary breakdown</p>
              {[
                ['Basic Salary', formatCurrency(selectedRecord.salary.baseSalary)],
                ['Allowances', formatCurrency(selectedRecord.salary.allowances)],
                ['Bonus', formatCurrency(selectedRecord.salary.bonus)],
                ['Overtime Hours', formatHours(selectedRecord.salary.overtimeHours)],
                ['Overtime Pay', formatCurrency(selectedRecord.salary.overtimePay)],
                ['Deductions', formatCurrency(selectedRecord.salary.deductions)],
                ['Absence Deduction', formatCurrency(selectedRecord.salary.absenceDeduction)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900">
                  <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
                  <span className="font-semibold text-zinc-950 dark:text-white">{value}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-900 dark:bg-zinc-950">
              <p className="text-sm font-semibold text-zinc-950 dark:text-white">Attendance summary</p>
              {[
                ['Working Days', String(selectedRecord.salary.workingDays)],
                ['Present Days', String(selectedRecord.salary.presentDays)],
                ['Absent Days', String(selectedRecord.salary.absentDays)],
                ['Half Days', String(selectedRecord.salary.halfDays)],
                ['Paid Leave', String(selectedRecord.salary.paidLeaveDays)],
                ['Attendance', selectedRecord.attendanceSummary],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900">
                  <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
                  <span className="font-semibold text-zinc-950 dark:text-white">{value}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-900 dark:bg-zinc-950">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-950 dark:text-white">Employee salary history</p>
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                  {history?.records.length ?? 0} months
                </span>
              </div>
              <div className="space-y-2">
                {(history?.records ?? []).map((entry) => (
                  <div key={entry.salary._id} className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 dark:border-zinc-900 dark:bg-zinc-950">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-950 dark:text-white">{formatMonthKey(entry.salary.monthKey)}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{entry.salary.presentDays}/{entry.salary.workingDays} days</p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${entry.salary.paymentStatus === 'paid'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
                        : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200'
                      }`}>
                        {entry.salary.paymentStatus}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span>{formatCurrency(entry.salary.finalSalary)}</span>
                      <span>{formatDate(entry.salary.paymentDate ?? entry.payment?.paidAt ?? null)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-200 px-5 py-4 dark:border-zinc-900">
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => downloadSalarySlip(selectedRecord)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
              >
                <Printer className="size-4" />
                Download PDF
              </button>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-zinc-900 bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:border-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Close
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}
