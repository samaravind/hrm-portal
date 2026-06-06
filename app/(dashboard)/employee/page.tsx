'use client'

import { useState, useMemo, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useUser } from '@clerk/nextjs'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { Search, Plus, X, Eye, EyeOff, Edit, Trash2, Ban, User, Shield, Users } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pagination } from '@/components/ui/pagination'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { getPasswordStrength } from '@/lib/password'

const COUNTRY_CODES = [
  { code: 'IN', value: '+91', name: 'India' },
  { code: 'US', value: '+1', name: 'United States' },
  { code: 'GB', value: '+44', name: 'United Kingdom' },
  { code: 'CA', value: '+1', name: 'Canada' },
  { code: 'AU', value: '+61', name: 'Australia' },
  { code: 'NZ', value: '+64', name: 'New Zealand' },
  { code: 'JP', value: '+81', name: 'Japan' },
  { code: 'CN', value: '+86', name: 'China' },
  { code: 'DE', value: '+49', name: 'Germany' },
  { code: 'FR', value: '+33', name: 'France' },
  { code: 'IT', value: '+39', name: 'Italy' },
  { code: 'ES', value: '+34', name: 'Spain' },
  { code: 'SG', value: '+65', name: 'Singapore' },
  { code: 'MY', value: '+60', name: 'Malaysia' },
  { code: 'LK', value: '+94', name: 'Sri Lanka' },
  { code: 'BD', value: '+880', name: 'Bangladesh' },
  { code: 'NP', value: '+977', name: 'Nepal' },
  { code: 'PK', value: '+92', name: 'Pakistan' },
  { code: 'AE', value: '+971', name: 'United Arab Emirates' },
  { code: 'SA', value: '+966', name: 'Saudi Arabia' },
  { code: 'QA', value: '+974', name: 'Qatar' },
  { code: 'OM', value: '+968', name: 'Oman' },
  { code: 'KW', value: '+965', name: 'Kuwait' },
  { code: 'BH', value: '+973', name: 'Bahrain' },
  { code: 'ZA', value: '+27', name: 'South Africa' },
  { code: 'RU', value: '+7', name: 'Russia' },
  { code: 'BR', value: '+55', name: 'Brazil' },
  { code: 'MX', value: '+52', name: 'Mexico' },
  { code: 'TH', value: '+66', name: 'Thailand' },
  { code: 'ID', value: '+62', name: 'Indonesia' },
  { code: 'PH', value: '+63', name: 'Philippines' },
  { code: 'VN', value: '+84', name: 'Vietnam' },
]

const DEFAULT_COUNTRY_CODE = 'IN'

function parseStoredPhone(stored: string): { code: string; number: string } {
  if (stored.startsWith('+')) {
    const spaceIdx = stored.indexOf(' ')
    if (spaceIdx !== -1) {
      return { code: stored.slice(0, spaceIdx), number: stored.slice(spaceIdx + 1) }
    }
  }
  return { code: '+91', number: stored }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type FormData = {
  fullName: string
  email: string
  password: string
  phone: string
  countryCode: string
  dateOfBirth: string
  role: 'staff' | 'admin'
}

const EMPTY_FORM: FormData = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
  countryCode: DEFAULT_COUNTRY_CODE,
  dateOfBirth: '',
  role: 'staff',
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, required, children }: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-white/35">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-white/10 bg-[#111111] px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-white/25 focus:outline-none transition'

// ─── Slide-in Panel ───────────────────────────────────────────────────────────

function AddEmployeePanel({ open, onClose, onSuccess }: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const registerEmployee = useMutation(api.users.registerEmployee)
  const createEmployeeRecord = useMutation(api.employees.create)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 10)
      setForm((prev) => ({ ...prev, phone: digits }))
      if (digits.length > 0 && digits.length !== 10) {
        setPhoneError('Phone must be exactly 10 digits')
      } else {
        setPhoneError(null)
      }
    } else if (name === 'password') {
      setForm((prev) => ({ ...prev, password: value }))
      setPasswordError(null)
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.fullName.trim()) return setError('Full name is required.')
    if (!form.email.trim()) return setError('Email is required.')
    if (!form.password) return setPasswordError('Password is required.')
    if (!passwordStrength.isStrong) return setPasswordError('Password is weak. Use uppercase, lowercase, numbers, and symbols.')
    if (form.phone.length > 0 && form.phone.length !== 10) return setError('Phone must be exactly 10 digits')

    try {
      setIsSubmitting(true)

      // Step 1: Create user in Clerk via API route
      const res = await fetch('/api/create-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          dateOfBirth: form.dateOfBirth || undefined,
          role: form.role,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to create account.')
        return
      }

      // Step 2: Save user + role to Convex
      await registerEmployee({
        tokenIdentifier: data.tokenIdentifier,
        userName: form.fullName.trim(),
        userEmail: form.email.trim(),
        role: form.role,
      })

      // Step 3: Create employee record for the list
      const fullPhone = form.phone ? `${form.countryCode} ${form.phone}` : ''
      const employeeId = `EMP-${Date.now()}`
      await createEmployeeRecord({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: fullPhone,
        department: '',
        position: form.role === 'admin' ? 'Admin' : 'Staff',
        employeeId,
        joiningDate: new Date().toISOString().split('T')[0],
        employeeType: 'Employee',
        dateOfBirth: form.dateOfBirth || undefined,
        password: form.password,
        appUrl: window.location.origin,
      })

      let notificationWarning: string | null = null
      try {
        const notificationRes = await fetch('/api/send-employee-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            password: form.password,
            baseUrl: window.location.origin,
          }),
        })

        const notificationData = await notificationRes.json().catch(() => null)
        if (!notificationRes.ok) {
          notificationWarning =
            notificationData?.error ?? 'Employee created, but the welcome email could not be sent.'
        }
      } catch {
        notificationWarning = 'Employee created, but the welcome email could not be sent.'
      }

      setForm(EMPTY_FORM)
      if (notificationWarning) {
        toast.success('Employee created successfully.')
        toast.warning(notificationWarning)
      } else {
        toast.success('Employee created. Welcome email sent successfully.')
      }
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      toast.error(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />}

      <aside className={`fixed right-0 top-0 z-50 h-full w-[380px] border-l border-white/10 bg-[#0b0b0b] shadow-none transition-transform duration-300 ease-in-out flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="px-6 pt-8 pb-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Add New Employee</h2>
          <p className="mt-1 text-sm text-white/55">
            Enter the employee details below to add them to the system.
          </p>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto">
          <form id="employee-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

            {/* Personal Information */}
            <div className="flex items-center gap-2 text-sm font-semibold text-white/80 pb-1">
              <User className="size-4" />
              Personal Information
            </div>

            <Field label="Full Name" required>
              <input name="fullName" type="text" value={form.fullName} onChange={handleChange}
                placeholder="John Doe" className={inputCls} />
            </Field>

            <Field label="Email Address" required>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="m@example.com" className={inputCls} />
            </Field>

            <Field label="Password" required>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  className={inputCls + ' pr-10'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <div className="mt-2 space-y-2">
                <div className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${passwordStrength.isStrong ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
                  {passwordStrength.label} password
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all ${passwordStrength.isStrong ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.max((passwordStrength.score / passwordStrength.total) * 100, form.password ? 18 : 0)}%` }}
                  />
                </div>
                <ul className="grid gap-1 text-[11px] text-white/45">
                  {passwordStrength.criteria.map((criterion) => (
                    <li key={criterion.label} className={`flex items-center gap-2 ${criterion.met ? 'text-emerald-300' : ''}`}>
                      <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${criterion.met ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/10 text-white/30'}`}>
                        {criterion.met ? '+' : '-'}
                      </span>
                      {criterion.label}
                    </li>
                  ))}
                </ul>
                <p className={`text-[11px] font-medium ${passwordStrength.isStrong ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {passwordStrength.message}
                </p>
              </div>
              {passwordError && <p className="text-[11px] text-rose-300 mt-1">{passwordError}</p>}
            </Field>

            <Field label="Phone Number">
              <div className="flex gap-2">
                <Select
                  value={form.countryCode}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, countryCode: val }))
                  }
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue>
                      {(() => {
                        const selected = COUNTRY_CODES.find((c) => c.code === form.countryCode) ?? COUNTRY_CODES.find((c) => c.value === form.countryCode) ?? COUNTRY_CODES[0]
                        return (
                          <div className="flex items-center gap-1.5">
                            <img
                              src={`https://flagcdn.com/w40/${selected.code.toLowerCase()}.png`}
                              alt={selected.code}
                              className="w-5 h-3.5 object-cover rounded-xs border border-white/10"
                            />
                            <span className="text-sm font-medium">{selected.value}</span>
                          </div>
                        )
                      })()}
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent>
                    {COUNTRY_CODES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                            alt={c.code}
                            className="w-5 h-3.5 object-cover rounded-xs border border-white/10"
                          />
                          <span className="text-xs text-white/45 font-semibold uppercase">{c.code}</span>
                          <span className="text-white/70 font-medium">{c.value}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex-1">
                  <input
                    name="phone"
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "")

                      if (value.length <= 10) {
                        setForm((prev) => ({
                          ...prev,
                          phone: value,
                        }))
                      }
                    }}
                    placeholder="Enter 10-digit number" className={`w-full rounded-lg border bg-[#111111] px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:outline-none transition ${phoneError ? 'border-rose-300 focus:border-rose-400' : 'border-white/10 focus:border-white/25'}`} />
                </div>
              </div>
              {phoneError && <p className="text-[11px] text-rose-300 mt-1">{phoneError}</p>}
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Date of Birth">
                <DatePicker
                  value={form.dateOfBirth}
                  onChange={(val) => {
                    setForm((prev) => ({ ...prev, dateOfBirth: val }))
                    setError(null)
                  }}
                />
              </Field>
            </div>

            <div className="border-t border-white/10 pt-1" />

            {/* Role */}
            <div className="flex items-center gap-2 text-sm font-semibold text-white/80 pb-1">
              <Shield className="size-4" />
              Role & Access
            </div>

            <Field label="Role" required>
              <div className="grid grid-cols-2 gap-2">
                {(['staff', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, role: r }))}
                    className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition cursor-pointer ${form.role === r
                      ? 'border-white/20 bg-white/10 text-white'
                      : 'border-white/10 bg-[#111111] text-white/70 hover:border-white/25'
                      }`}
                  >
                    {r === 'staff' ? <User className="size-3.5" /> : <Shield className="size-3.5" />}
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-white/40">
                {form.role === 'admin'
                  ? 'Admin can view all employees\' attendance records.'
                  : 'Staff can only view their own attendance records.'}
              </p>
            </Field>

            {error && (
              <p className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-300">
                {error}
              </p>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10">
          <button
            type="submit"
            form="employee-form"
            disabled={isSubmitting}
            className="w-full rounded-lg border border-white/10 bg-[#111111] py-2.5 text-sm font-semibold text-white hover:bg-white/5 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? 'Creating Employee...' : 'Create Employee'}
          </button>
        </div>
      </aside>
    </>
  )
}

// ─── Employee Row ─────────────────────────────────────────────────────────────

function EmployeeRow({ employee, sno, role, formatDate, onView, onEdit }: {
  employee: Doc<'employees'>
  sno: number
  role: string | undefined
  formatDate: (d: string) => string
  onView: (emp: Doc<'employees'>) => void
  onEdit: (emp: Doc<'employees'>) => void
}) {
  const [blocking, setBlocking] = useState(false)
  const toggleBlock = useMutation(api.employees.toggleBlockEmployee)
  const initials = employee.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  const isBlocked = employee.blocked ?? false

  const handleBlock = async () => {
    setBlocking(true)
    try {
      const result = await toggleBlock({ id: employee._id })
      await fetch('/api/block-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: result.email, block: result.blocked }),
      })
    } finally {
      setBlocking(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${employee.fullName}?`)) return

    try {
      const res = await fetch('/api/delete-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: employee.email }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error ?? 'Failed to delete employee.')
      }

      toast.success(data?.employeeDeleted
        ? 'Employee deleted from Clerk and the employee list.'
        : 'Employee deleted from Clerk. No matching employee record was found.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete employee.')
    }
  }

  return (
    <tr className={`hover:bg-white/5 transition-colors ${isBlocked ? 'opacity-60' : ''}`}>
      <td className="px-4 py-3 text-xs text-white/35 font-mono">{sno}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/75">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{employee.fullName}</span>
              {isBlocked && (
                <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-300 uppercase tracking-wider">
                  <Ban className="size-3" />
                  Blocked
                </span>
              )}
            </div>
            <div className="text-xs text-white/40">{employee.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${role === 'admin' ? 'bg-white/10 text-white' : 'bg-white/10 text-white/75'
          }`}>
          {role === 'admin' ? 'Admin' : 'Staff'}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="inline-block rounded bg-white/10 px-2 py-0.5 text-xs font-medium text-white/75">
          {employee.department}
        </span>
      </td>
      <td className="px-4 py-3 text-white/75">{employee.employeeType}</td>
      <td className="px-4 py-3 text-white/75">
        {employee.phone || <span className="text-white/35">—</span>}
      </td>
      <td className="px-4 py-3 text-white/60">{formatDate(employee.joiningDate)}</td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex items-center gap-1">
          <button
            onClick={() => onView(employee)}
            className="rounded-md border border-white/10 p-1.5 text-blue-300 hover:bg-white/5 transition cursor-pointer"
            title="View"
          >
            <Eye className="size-4" />
          </button>
          <button
            onClick={() => onEdit(employee)}
            className="rounded-md border border-white/10 p-1.5 text-amber-300 hover:bg-white/5 transition cursor-pointer"
            title="Edit"
          >
            <Edit className="size-4" />
          </button>
          <button
            onClick={handleDelete}
            className="rounded-md border border-white/10 p-1.5 text-rose-300 hover:bg-white/5 transition cursor-pointer"
            title="Delete"
          >
            <Trash2 className="size-4" />
          </button>
          <button
            onClick={handleBlock}
            disabled={blocking}
            className={`rounded-md border p-1.5 transition cursor-pointer disabled:opacity-50 ${isBlocked
              ? 'border-green-500/20 text-green-300 hover:bg-white/5'
              : 'border-white/10 text-white/70 hover:bg-white/5'
              }`}
            title={isBlocked ? 'Unblock' : 'Block'}
          >
            <Ban className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── View Employee Panel ──────────────────────────────────────────────────────

function formatTime(timestamp: number | null) {
  if (!timestamp) return '--:--'
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(timestamp))
}

function ViewEmployeePanel({ employee, onClose }: {
  employee: Doc<'employees'>
  onClose: () => void
}) {
  const sessions = useQuery(api.attendance.getEmployeeSessions, { email: employee.email }) ?? []
  const formatDate = (d: string) => {
    const date = new Date(d)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const fields = [
    { label: 'Full Name', value: employee.fullName },
    { label: 'Email', value: employee.email },
    { label: 'Phone', value: employee.phone || '—' },
    { label: 'Department', value: employee.department || '—' },
    { label: 'Position', value: employee.position },
    { label: 'Employee ID', value: employee.employeeId },
    { label: 'Employee Type', value: employee.employeeType },
    { label: 'Date of Birth', value: employee.dateOfBirth ? formatDate(employee.dateOfBirth) : '—' },
    { label: 'Joining Date', value: formatDate(employee.joiningDate) },
    { label: 'Salary', value: employee.salary ? `₹${employee.salary.toLocaleString('en-IN')}` : '—' },
    { label: 'Address', value: employee.address || '—' },
  ]

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 h-full w-[500px] border-l border-white/10 bg-[#0b0b0b] shadow-none flex flex-col">
        <div className="flex items-center justify-between px-6 pt-8 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">Employee Details</h2>
            <p className="mt-0.5 text-sm text-white/55">{employee.fullName}</p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-white/10 p-1.5 text-white/60 hover:bg-white/5 transition cursor-pointer">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Personal Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/35 mb-3">Personal Details</h3>
            <div className="space-y-3">
              {fields.map(({ label, value }) => (
                <div key={label}>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/35">{label}</label>
                  <p className="mt-1 text-sm font-medium text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance History */}
          <div className="border-t border-white/10 pt-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/35 mb-3">
              Attendance History ({sessions.length} records)
            </h3>
            {sessions.length === 0 ? (
              <p className="text-sm text-white/35 py-4 text-center">No attendance records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] font-semibold text-white/45 uppercase tracking-wider">
                      <th className="py-2 pr-2">Date</th>
                      <th className="py-2 px-2">In</th>
                      <th className="py-2 px-2">Out</th>
                      <th className="py-2 pl-2 text-right">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sessions.map((s) => {
                      const diff = s.punchOutAt
                        ? (s.punchOutAt - s.punchInAt) / (1000 * 60 * 60)
                        : (Date.now() - s.punchInAt) / (1000 * 60 * 60)
                      return (
                        <tr key={s._id} className="hover:bg-white/5">
                          <td className="py-2.5 pr-2 font-medium text-white/80">{s.dateKey}</td>
                          <td className="py-2.5 px-2 text-white/65">{formatTime(s.punchInAt)}</td>
                          <td className="py-2.5 px-2 text-white/65">
                            {s.punchOutAt ? formatTime(s.punchOutAt) : <span className="text-amber-300 font-semibold">Active</span>}
                          </td>
                          <td className="py-2.5 pl-2 text-right font-semibold text-white">{diff.toFixed(2)}h</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-white/10 bg-[#111111] py-2.5 text-sm font-semibold text-white hover:bg-white/5 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </aside>
    </>
  )
}

// ─── Edit Employee Panel ───────────────────────────────────────────────────────

function EditEmployeePanel({ employee, onClose }: {
  employee: Doc<'employees'>
  onClose: () => void
}) {
  const updateEmployee = useMutation(api.employees.updateEmployee)
  const [saving, setSaving] = useState(false)
  const [syncingLogin, setSyncingLogin] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [securityWarning, setSecurityWarning] = useState<string | null>(null)
  const parsedPhone = parseStoredPhone(employee.phone ?? '')
  const initialCountry = COUNTRY_CODES.find((c) => c.value === parsedPhone.code) ?? COUNTRY_CODES[0]
  const [selectedCountryCode, setSelectedCountryCode] = useState(initialCountry.code)
  const [form, setForm] = useState({
    fullName: employee.fullName,
    email: employee.email,
    employeeId: employee.employeeId,
    phone: parsedPhone.number,
    department: employee.department ?? '',
    position: employee.position,
    employeeType: employee.employeeType ?? '',
    salary: employee.salary ?? undefined,
    dateOfBirth: employee.dateOfBirth ?? '',
    address: employee.address ?? '',
    newPassword: '',
  })

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10)
    setForm((prev) => ({ ...prev, phone: digits }))
    if (digits.length > 0 && digits.length !== 10) {
      setPhoneError('Phone must be exactly 10 digits')
    } else {
      setPhoneError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.phone.length > 0 && form.phone.length !== 10) {
      setPhoneError('Phone must be exactly 10 digits')
      return
    }
    const selectedCountry = COUNTRY_CODES.find((c) => c.code === selectedCountryCode) ?? COUNTRY_CODES[0]
    const fullPhone = form.phone ? `${selectedCountry.value} ${form.phone}` : ''
    setSaving(true)
    try {
      const { newPassword, ...profile } = form
      await updateEmployee({
        id: employee._id,
        ...profile,
        employeeId: form.employeeId.trim(),
        phone: fullPhone,
        salary: form.salary ? Number(form.salary) : undefined,
      })

      setSyncingLogin(true)
      try {
        const syncRes = await fetch('/api/create-employee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            employeeId: form.employeeId.trim(),
          }),
        })
        const syncData = await syncRes.json().catch(() => null)
        if (!syncRes.ok) {
          setSecurityWarning(syncData?.error ?? 'User ID saved, but Clerk sync could not be completed.')
        } else {
          setSecurityWarning(null)
        }
      } catch {
        setSecurityWarning('User ID saved, but Clerk sync could not be completed.')
      } finally {
        setSyncingLogin(false)
      }

      if (newPassword.trim()) {
        setSecurityWarning('Password reset flow is ready for the next backend step.')
      }

      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 h-full w-[420px] border-l border-white/10 bg-[#0b0b0b] shadow-none flex flex-col">
        <div className="flex items-center justify-between px-6 pt-8 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">Edit Employee</h2>
            <p className="mt-0.5 text-sm text-white/55">{employee.fullName}</p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-white/10 p-1.5 text-white/60 hover:bg-white/5 transition cursor-pointer">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Login & Security</h3>
                <p className="mt-1 text-xs text-white/50">
                  User ID is editable now. Password reset wiring can plug into this section next.
                </p>
              </div>
              {syncingLogin && (
                <span className="text-[11px] font-medium text-white/45">Syncing...</span>
              )}
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/35">User ID</label>
                <input
                  type="text"
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/10"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/35">Password</label>
                <input
                  type="password"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  placeholder="Ready for reset flow"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-white/10"
                />
                <p className="mt-1 text-[11px] text-white/35">
                  This field is in place for the future reset action, so we can connect it to Clerk next.
                </p>
              </div>
            </div>
            {securityWarning && (
              <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                {securityWarning}
              </p>
            )}
          </div>

          {([
            { label: 'Full Name', key: 'fullName', type: 'text' },
            { label: 'Email', key: 'email', type: 'email' },
            { label: 'Phone', key: 'phone', type: 'phone' },
            { label: 'Department', key: 'department', type: 'text' },
            { label: 'Position', key: 'position', type: 'text' },
            { label: 'Employee Type', key: 'employeeType', type: 'text' },
            { label: 'Salary', key: 'salary', type: 'number' },
          ] as const).map(({ label, key, type }) => (
            <div key={key}>
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/35">{label}</label>
              {type === 'phone' ? (
                <>
                  <div className="mt-1 flex gap-2">
                    <Select
                      value={selectedCountryCode}
                      onValueChange={setSelectedCountryCode}
                    >
                      <SelectTrigger className="w-[110px] bg-[#111111] border-white/10 text-white">
                        <SelectValue>
                          {(() => {
                            const selected = COUNTRY_CODES.find((c) => c.code === selectedCountryCode) ?? COUNTRY_CODES[0]
                            return (
                              <div className="flex items-center gap-1.5">
                                <img
                                  src={`https://flagcdn.com/w40/${selected.code.toLowerCase()}.png`}
                                  alt={selected.code}
                                  className="w-5 h-3.5 object-cover rounded-xs border border-white/10"
                                />
                                <span className="text-sm font-medium">{selected.value}</span>
                              </div>
                            )
                          })()}
                        </SelectValue>
                      </SelectTrigger>

                      <SelectContent>
                        {COUNTRY_CODES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            <div className="flex items-center gap-2">
                              <img
                                src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                                alt={c.code}
                                className="w-5 h-3.5 object-cover rounded-xs border border-white/10"
                              />
                                <span className="text-xs text-white/45 font-semibold uppercase">{c.code}</span>
                                <span className="text-white/70 font-medium">{c.value}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      value={form.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm text-white bg-[#111111] focus:outline-none focus:ring-2 focus:ring-white/10 ${phoneError ? 'border-rose-300' : 'border-white/10'}`}
                    />
                  </div>
                  {phoneError && <p className="text-[11px] text-rose-300 mt-1">{phoneError}</p>}
                </>
              ) : (
                <input
                  type={type}
                  value={form[key] ?? ''}
                  onChange={(e) => setForm({ ...form, [key]: type === 'number' ? e.target.valueAsNumber : e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/10"
                />
              )}
            </div>
          ))}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/35">Date of Birth</label>
            <DatePicker
              value={form.dateOfBirth}
              onChange={(val) => setForm({ ...form, dateOfBirth: val })}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/35">Address</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/10"
            />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-white/10 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/10 bg-[#111111] py-2.5 text-sm font-semibold text-white hover:bg-white/5 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-lg border border-white/10 bg-[#111111] py-2.5 text-sm font-semibold text-white hover:bg-white/5 disabled:opacity-50 transition cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </aside>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const router = useRouter()
  const viewer = useQuery(api.users.viewer)
  const { isLoaded, user } = useUser()
  const employees = useQuery(api.employees.list) ?? []
  const allRoles = useQuery(api.users.getAllUserRoles)
  const userEmails = useQuery(api.users.getAllUserEmails) ?? []
  const setUserRole = useMutation(api.users.setUserRoleByEmail)
  const registerEmployee = useMutation(api.users.registerEmployee)
  const createEmployeeRecord = useMutation(api.employees.create)
  const [panelOpen, setPanelOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [emailFilter, setEmailFilter] = useState('')
  const [importing, setImporting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [viewingEmployee, setViewingEmployee] = useState<Doc<'employees'> | null>(null)
  const [editingEmployee, setEditingEmployee] = useState<Doc<'employees'> | null>(null)

  const roleMap = useMemo(() => {
    if (!allRoles) return {}
    const map: Record<string, string> = {}
    for (const r of allRoles) {
      if (r.email) map[r.email] = r.role
    }
    return map
  }, [allRoles])

  const handleRoleChange = async (email: string, newRole: 'admin' | 'staff') => {
    try {
      await setUserRole({ email, role: newRole })
    } catch (err) {
      console.error('Failed to update role:', err)
    }
  }

  const handleImport = async (file: File) => {
    setImporting(true)
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet) as Record<string, unknown>[]

      const employees: {
        fullName: string; email: string; password: string; dateOfBirth?: string; role: 'admin' | 'staff'
        phone: string; department: string; position: string; employeeType: string; salary?: number; address?: string
      }[] = []

      for (const row of rows) {
        const fullName = String(row['Full Name'] || row['fullName'] || row['Name'] || row['name'] || '').trim()
        const email = String(row['Email'] || row['email'] || row['E-mail'] || row['e-mail'] || row['Email Address'] || row['email_address'] || row['emailAddress'] || '').trim().toLowerCase()
        if (!fullName || !email) continue

        const password = String(row['Password'] || row['password'] || 'Employee@123')
        const role = String(row['Role'] || row['role'] || 'staff').toLowerCase() === 'admin' ? 'admin' : 'staff'
        let dateOfBirth = String(row['Date of Birth'] || row['dateOfBirth'] || row['DOB'] || '')
        if (dateOfBirth && /^\d{2}-\d{2}-\d{4}$/.test(dateOfBirth)) {
          const [d, m, y] = dateOfBirth.split('-')
          dateOfBirth = `${y}-${m}-${d}`
        }
        const phone = String(row['Phone'] || row['phone'] || '')
        const department = String(row['Department'] || row['department'] || '')
        const position = String(row['Position'] || row['position'] || role === 'admin' ? 'Admin' : row['Role'] || row['role'] || 'Staff')
        const employeeType = String(row['Employee Type'] || row['employeeType'] || row['Type'] || row['type'] || 'Employee')
        const salary = (row['Salary'] || row['salary']) ? Number(row['Salary'] || row['salary']) : undefined
        const address = String(row['Address'] || row['address'] || '')

        employees.push({ fullName, email, password, dateOfBirth: dateOfBirth || undefined, role, phone, department, position, employeeType, salary, address: address || undefined })
      }

      if (employees.length === 0) {
        alert('No valid rows found. Make sure the file has Full Name and Email columns.')
        return
      }

      const res = await fetch('/api/import-employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees }),
      })
      const result = await res.json()

      if (!res.ok) {
        alert(`Import failed: ${result.error || 'Unknown error'}`)
        return
      }

      const clerkOk = result.clerkOk ?? 0
      const clerkFail = result.clerkFail ?? 0
      const failures = result.results?.filter((r: { clerkCreated: boolean }) => !r.clerkCreated) ?? []

      let msg = `✓ ${clerkOk} employee(s) imported with Clerk accounts.`
      if (clerkFail > 0) {
        msg += `\n⚠ ${clerkFail} Clerk account(s) failed:\n${failures.map((r: { email: string; error?: string }) => `  ${r.email}: ${r.error || 'Unknown'}`).join('\n')}`
      }
      toast.success(msg, { duration: 10000 })
    } catch (e) {
      alert(`Failed to parse the file: ${e instanceof Error ? e.message : 'Invalid format'}`)
    } finally {
      setImporting(false)
    }
  }

  const employeesWithoutClerk = useMemo(() => {
    const emailSet = new Set(userEmails.map((e) => e?.toLowerCase()))
    return employees.filter((e) => !emailSet.has(e.email?.toLowerCase()))
  }, [employees, userEmails])

  const handleSyncExisting = async () => {
    const toSync = employeesWithoutClerk
    if (toSync.length === 0) return
    setSyncing(true)
    try {
      const payload = toSync.map((e) => ({
        fullName: e.fullName || '',
        email: e.email || '',
        role: 'staff' as const,
      }))
      const res = await fetch('/api/sync-to-clerk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees: payload }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('Sync failed:', data.error)
        return
      }
      if (data.ok > 0) {
        toast.success(`✓ ${data.ok} employee(s) synced to Clerk automatically.`)
      }
    } catch (err) {
      console.error('Auto-sync failed:', err)
    } finally {
      setSyncing(false)
    }
  }

  // Auto-sync employees to Clerk on mount
  useEffect(() => {
    if (employees.length > 0 && userEmails.length >= 0 && !syncing) {
      handleSyncExisting()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees.length, userEmails.length])

  const isAdmin = viewer?.role === 'admin' || user?.publicMetadata?.role === 'admin'

  useEffect(() => {
    if (viewer !== undefined && isLoaded && !isAdmin) {
      router.replace('/')
    }
  }, [viewer, isLoaded, isAdmin, router])

  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  const avgSalary = useMemo(() => {
    const withSalary = employees.filter((e) => e.salary)
    if (!withSalary.length) return null
    const avg = withSalary.reduce((s, e) => s + (e.salary ?? 0), 0) / withSalary.length
    return avg.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
  }, [employees])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    const emailQ = emailFilter.toLowerCase().trim()
    if (!q && !emailQ) return employees
    return employees.filter((e) =>
      (!q || (
        e.fullName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q)
      )) &&
      (!emailQ || e.email.toLowerCase().includes(emailQ))
    )
  }, [employees, search, emailFilter])

  useEffect(() => { setPage(1) }, [filtered])

  if (viewer !== undefined && isLoaded && !isAdmin) {
    return null
  }

  const totalEmployees = employees.length
  const departments = new Set(employees.map((e) => e.department)).size
  const paginatedEmployees = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
  }

  return (
    <div className="px-6 py-6 min-h-screen bg-[#050505] text-white" suppressHydrationWarning>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="size-6 text-white/75" />
          <h1 className="text-2xl font-bold text-white">Employees</h1>
        </div>
        <div className="flex items-center gap-2">
          {employeesWithoutClerk.length > 0 && (
            <button
              onClick={handleSyncExisting}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-500/15 transition cursor-pointer disabled:opacity-50"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {syncing ? 'Syncing...' : `Sync ${employeesWithoutClerk.length} to Clerk`}
            </button>
          )}
          <button
            onClick={() => document.getElementById('csvInput')?.click()}
            disabled={importing}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#111111] px-4 py-2 text-sm font-semibold text-white hover:bg-white/5 transition cursor-pointer disabled:opacity-50"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            {importing ? 'Importing...' : 'Import'}
          </button>
          <input
            id="csvInput"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImport(file)
              e.target.value = ''
            }}
          />
          <button
            onClick={() => setPanelOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#111111] px-4 py-2 text-sm font-semibold text-white hover:bg-white/5 transition cursor-pointer"
          >
            <Plus className="size-4" />
            Create Employee
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Employees', value: totalEmployees },
          { label: 'Departments', value: departments },
          { label: 'Avg. Salary', value: avgSalary ?? '—' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-[#0b0b0b] border border-white/10 px-5 py-4 shadow-none">
            <div className="text-3xl font-bold text-white">{s.value}</div>
            <div className="mt-1 text-sm text-white/45">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/35" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees by name, role, or department..."
            className="w-full rounded-lg border border-white/10 bg-[#111111] pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/35 focus:border-white/25 focus:outline-none transition"
          />
        </div>
        <div className="relative">
          <input
            type="text"
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            placeholder="Filter by email address..."
            className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-2 text-sm text-white placeholder:text-white/35 focus:border-white/25 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-[#0b0b0b] border border-white/10 shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['S.No', 'Employee', 'Role', 'Department', 'Type', 'Phone', 'Hired Date', 'Actions'].map((h) => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold text-white/45 ${h === 'Actions' ? 'text-right' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-white/35">
                    {search ? 'No employees match your search.' : 'No employees yet. Click "Create Employee" to add one.'}
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp, idx) => (
                  <EmployeeRow key={emp._id} employee={emp} sno={(page - 1) * PAGE_SIZE + idx + 1} role={roleMap[emp.email]} formatDate={formatDate} onView={setViewingEmployee} onEdit={setEditingEmployee} />
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination current={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      {/* View Employee Panel */}
      {viewingEmployee && (
        <ViewEmployeePanel
          employee={viewingEmployee}
          onClose={() => setViewingEmployee(null)}
        />
      )}

      {/* Edit Employee Panel */}
      {editingEmployee && (
        <EditEmployeePanel
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
        />
      )}

      <AddEmployeePanel
        key={panelOpen ? 'employee-create-open' : 'employee-create-closed'}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onSuccess={() => {
          toast.success('Employee account created. They can now log in to SAM MARKET.')
        }}
      />
    </div>
  )
}
