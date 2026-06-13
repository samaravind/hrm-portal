'use client'

import { useState, useMemo, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useUser } from '@clerk/nextjs'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { Search, Plus, X, Eye, EyeOff, Edit, Trash2, Ban, User, Shield, Users, Wallet } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pagination } from '@/components/ui/pagination'
import { DatePicker } from '@/components/ui/date-picker'
import { hrmsSectionClass, hrmsTableClass, hrmsTableEmptyClass, hrmsTableHeadCellClass, hrmsTableHeadRowClass, hrmsTableRowClass } from '@/components/ui/hrms-table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { getPasswordStrength } from '@/lib/password'
import { useIsMobile } from '@/hooks/use-mobile'

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

//  Types 

type FormData = {
  fullName: string
  email: string
  password: string
  phone: string
  countryCode: string
  dateOfBirth: string
  joiningDate: string
  salary: string
  allowances: string
  overtimeRatePerHour: string
  salaryType: 'monthly' | 'daily'
  bankName: string
  accountNumber: string
  ifscCode: string
  role: 'staff' | 'admin'
}

const EMPTY_FORM: FormData = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
  countryCode: DEFAULT_COUNTRY_CODE,
  dateOfBirth: '',
  joiningDate: new Date().toISOString().split('T')[0],
  salary: '',
  allowances: '',
  overtimeRatePerHour: '',
  salaryType: 'monthly',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  role: 'staff',
}

//  Field wrapper 

function Field({ label, required, children }: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
        {label}{required && <span className="text-zinc-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-zinc-400 dark:border-zinc-900 dark:bg-black dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white'

function parseOptionalNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed.replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : undefined
}

//  Slide-in Panel 

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
    if (!form.joiningDate) return setError('Joining date is required.')
    if (!form.salary.trim()) return setError('Basic salary is required.')
    if (parseOptionalNumber(form.salary) === undefined) return setError('Basic salary must be a valid number.')

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
        joiningDate: form.joiningDate,
        employeeType: 'Employee',
        salary: parseOptionalNumber(form.salary),
        allowances: parseOptionalNumber(form.allowances),
        overtimeRatePerHour: parseOptionalNumber(form.overtimeRatePerHour),
        salaryType: form.salaryType,
        bankName: form.bankName.trim() || undefined,
        accountNumber: form.accountNumber.trim() || undefined,
        ifscCode: form.ifscCode.trim() || undefined,
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
      {open && <div className="fixed inset-0 z-40 bg-black/20 dark:bg-black/20" onClick={onClose} />}

      <aside className={`fixed right-0 top-0 z-50 flex h-full w-[360px] flex-col border-l border-zinc-200 bg-white shadow-none transition-transform duration-300 ease-in-out dark:border-zinc-900 dark:bg-black ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
              <div className="border-b border-zinc-200 px-5 py-4 dark:border-neutral-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Add New Employee</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Enter the employee details below to add them to the system.
          </p>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto">
          <form id="employee-form" onSubmit={handleSubmit} className="space-y-3 px-5 py-4">

            {/* Personal Information */}
            <div className="flex items-center gap-2 pb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-white">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <div className="mt-2 space-y-2">
                <div className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${passwordStrength.isStrong ? 'border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-900 dark:bg-black dark:text-zinc-300' : 'border-zinc-200 bg-white text-zinc-600 dark:border-zinc-900 dark:bg-black dark:text-zinc-300'}`}>
                  {passwordStrength.label} password
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-black">
                  <div
                    className={`h-full rounded-full transition-all ${passwordStrength.isStrong ? 'bg-zinc-700 dark:bg-[#141414]' : 'bg-zinc-400 dark:bg-black'}`}
                    style={{ width: `${Math.max((passwordStrength.score / passwordStrength.total) * 100, form.password ? 18 : 0)}%` }}
                  />
                </div>
                <ul className="grid gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  {passwordStrength.criteria.map((criterion) => (
                    <li key={criterion.label} className={`flex items-center gap-2 ${criterion.met ? 'text-zinc-700 dark:text-zinc-300' : ''}`}>
                      <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${criterion.met ? 'bg-zinc-200 text-zinc-800 dark:bg-black dark:text-zinc-300' : 'bg-zinc-100 text-zinc-400 dark:bg-black dark:text-zinc-500'}`}>
                        {criterion.met ? '+' : '-'}
                      </span>
                      {criterion.label}
                    </li>
                  ))}
                </ul>
                <p className={`text-[11px] font-medium ${passwordStrength.isStrong ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-500 dark:text-zinc-400'}`}>
                  {passwordStrength.message}
                </p>
              </div>
              {passwordError && <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{passwordError}</p>}
            </Field>

            <Field label="Phone Number">
              <div className="flex gap-2">
                <Select
                  value={form.countryCode}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, countryCode: val }))
                  }
                >
                  <SelectTrigger className="w-[104px] border-zinc-200 bg-white text-zinc-900 dark:border-zinc-900 dark:bg-black dark:text-white">
                    <SelectValue>
                      {(() => {
                        const selected = COUNTRY_CODES.find((c) => c.code === form.countryCode) ?? COUNTRY_CODES.find((c) => c.value === form.countryCode) ?? COUNTRY_CODES[0]
                        return (
                          <div className="flex items-center gap-1.5">
                            <img
                              src={`https://flagcdn.com/w40/${selected.code.toLowerCase()}.png`}
                              alt={selected.code}
                              className="h-3.5 w-5 rounded-xs border border-zinc-200 object-cover dark:border-zinc-900"
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
                            className="h-3.5 w-5 rounded-xs border border-zinc-200 object-cover dark:border-zinc-900"
                          />
                          <span className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">{c.code}</span>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">{c.value}</span>
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
                    placeholder="Enter 10-digit number" className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition dark:bg-black dark:text-white dark:placeholder:text-zinc-500 ${phoneError ? 'border-zinc-300 focus:border-zinc-400 dark:border-white/20' : 'border-zinc-200 focus:border-zinc-400 dark:border-zinc-900 dark:focus:border-white/25'}`} />
                </div>
              </div>
              {phoneError && <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{phoneError}</p>}
            </Field>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <Field label="Date of Birth">
                <DatePicker
                  value={form.dateOfBirth}
                  onChange={(val) => {
                    setForm((prev) => ({ ...prev, dateOfBirth: val }))
                    setError(null)
                  }}
                />
              </Field>
              <Field label="Joining Date" required>
                <DatePicker
                  value={form.joiningDate}
                  onChange={(val) => {
                    setForm((prev) => ({ ...prev, joiningDate: val }))
                    setError(null)
                  }}
                />
              </Field>
            </div>

            <div className="border-t border-zinc-200 pt-1 dark:border-zinc-900" />

            <div className="flex items-center gap-2 pb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <Wallet className="size-4" />
              Salary Details
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <Field label="Salary Type" required>
                <div className="grid grid-cols-2 gap-2">
                  {(['monthly', 'daily'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, salaryType: type }))}
                      className={`rounded-md border px-3 py-2 text-sm font-medium transition cursor-pointer ${
                        form.salaryType === type
                          ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-900 dark:bg-black dark:text-white'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 dark:border-zinc-900 dark:bg-black dark:text-zinc-300 dark:hover:border-white/25'
                      }`}
                    >
                      {type === 'monthly' ? 'Monthly' : 'Daily'}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Basic Salary" required>
                <input
                  name="salary"
                  type="number"
                  min="0"
                  step="1"
                  value={form.salary}
                  onChange={handleChange}
                  placeholder="50000"
                  className={inputCls}
                />
              </Field>
              <Field label="Allowances">
                <input
                  name="allowances"
                  type="number"
                  min="0"
                  step="1"
                  value={form.allowances}
                  onChange={handleChange}
                  placeholder="5000"
                  className={inputCls}
                />
              </Field>
              <Field label="Overtime Rate Per Hour">
                <input
                  name="overtimeRatePerHour"
                  type="number"
                  min="0"
                  step="1"
                  value={form.overtimeRatePerHour}
                  onChange={handleChange}
                  placeholder="250"
                  className={inputCls}
                />
              </Field>
              <Field label="Bank Name">
                <input name="bankName" type="text" value={form.bankName} onChange={handleChange} placeholder="HDFC Bank" className={inputCls} />
              </Field>
              <Field label="Account Number">
                <input name="accountNumber" type="text" value={form.accountNumber} onChange={handleChange} placeholder="1234567890" className={inputCls} />
              </Field>
              <Field label="IFSC Code">
                <input name="ifscCode" type="text" value={form.ifscCode} onChange={handleChange} placeholder="HDFC0001234" className={inputCls} />
              </Field>
            </div>

            <div className="border-t border-zinc-200 pt-1 dark:border-zinc-900" />

            {/* Role */}
            <div className="flex items-center gap-2 pb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                    className={`flex items-center justify-center gap-2 rounded-md border py-2 text-sm font-medium transition cursor-pointer ${form.role === r
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-900 dark:bg-black dark:text-white'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 dark:border-zinc-900 dark:bg-black dark:text-zinc-300 dark:hover:border-white/25'
                      }`}
                  >
                    {r === 'staff' ? <User className="size-3.5" /> : <Shield className="size-3.5" />}
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                {form.role === 'admin'
                  ? 'Admin can view all employees\' attendance records.'
                  : 'Staff can only view their own attendance records.'}
              </p>
            </Field>

            {error && (
              <p className="rounded-md border border-zinc-200 bg-zinc-100 px-3 py-2 text-xs text-zinc-700 dark:border-zinc-900 dark:bg-black dark:text-zinc-300">
                {error}
              </p>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 px-5 py-4 dark:border-zinc-900">
          <button
            type="submit"
            form="employee-form"
            disabled={isSubmitting}
            className="w-full rounded-md border border-zinc-200 bg-zinc-900 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-900 dark:bg-black dark:text-white dark:hover:bg-zinc-950 cursor-pointer"
          >
            {isSubmitting ? 'Creating Employee...' : 'Create Employee'}
          </button>
        </div>
      </aside>
    </>
  )
}

//  Employee Row 
// Employee Row

function EmployeeRow({ employee, sno, role, formatDate, onView, onEdit }: {
  employee: Doc<'employees'>
  sno: number
  role: string | undefined
  formatDate: (d: string) => string
  onView: (emp: Doc<'employees'>) => void
  onEdit: (emp: Doc<'employees'>) => void
}) {
  const [blocking, setBlocking] = useState(false)
  const [deleting, setDeleting] = useState(false)
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
    setDeleting(true)
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

      toast.success(
        data?.employeeDeleted
          ? 'Employee deleted from Clerk and the employee list.'
          : 'Employee deleted from Clerk. No matching employee record was found.',
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete employee.')
    } finally {
      setDeleting(false)
    }
  }
  return (
    <tr className={`${hrmsTableRowClass} ${isBlocked ? 'opacity-70' : ''}`}>
      <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold text-zinc-400 dark:text-zinc-500">{sno}</td>
      <td className="px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-[11px] font-semibold text-white shadow-sm ring-1 ring-white/20">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-100">{employee.fullName}</span>
              {isBlocked && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                  <Ban className="size-3" />
                  Blocked
                </span>
              )}
            </div>
            <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">{employee.email}</div>
          </div>
        </div>
      </td>
      <td className="px-3 py-2">
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${role === 'admin' ? 'bg-indigo-500/10 text-indigo-700 ring-1 ring-inset ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/20' : 'bg-zinc-500/10 text-zinc-700 ring-1 ring-inset ring-zinc-200 dark:bg-zinc-500/15 dark:text-zinc-200 dark:ring-zinc-400/20'}`}>{role === 'admin' ? 'Admin' : 'Staff'}</span>
      </td>
      <td className="px-3 py-2">
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${employee.department ? 'bg-cyan-500/10 text-cyan-700 ring-1 ring-inset ring-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-200 dark:ring-cyan-400/20' : 'bg-zinc-500/10 text-zinc-700 ring-1 ring-inset ring-zinc-200 dark:bg-zinc-500/15 dark:text-zinc-200 dark:ring-zinc-400/20'}`}>{employee.department || 'Unassigned'}</span>
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200">{employee.employeeType || 'Employee'}</td>
      <td className="whitespace-nowrap px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200">{employee.phone || <span className="text-zinc-400 dark:text-zinc-500">—</span>}</td>
      <td className="whitespace-nowrap px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200">{formatDate(employee.joiningDate)}</td>
      <td className="px-3 py-2">
        <div className="flex items-center justify-end gap-1">
          <button type="button" onClick={() => onView(employee)} className="inline-flex size-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-indigo-500/20 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300" title="View">
            <Eye className="size-3.5" />
          </button>
          <button type="button" onClick={() => onEdit(employee)} className="inline-flex size-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-amber-500/20 dark:hover:bg-amber-500/10 dark:hover:text-amber-300" title="Edit">
            <Edit className="size-3.5" />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" disabled={deleting} className="inline-flex size-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-rose-500/20 dark:hover:bg-rose-500/10 dark:hover:text-rose-300" title="Delete">
                <Trash2 className="size-3.5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete employee?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {employee.fullName}? This removes the employee from Clerk and the employee list when a matching record exists.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500/30"
                >
                  Delete employee
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <button type="button" onClick={handleBlock} disabled={blocking} className={`inline-flex size-8 items-center justify-center rounded-lg border transition disabled:opacity-50 ${isBlocked ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/15' : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-white/5'}`} title={isBlocked ? 'Unblock' : 'Block'}>
            <Ban className="size-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

function EmployeeMobileCard({ employee, sno, role, formatDate, onView, onEdit }: {
  employee: Doc<'employees'>
  sno: number
  role: string | undefined
  formatDate: (d: string) => string
  onView: (emp: Doc<'employees'>) => void
  onEdit: (emp: Doc<'employees'>) => void
}) {
  const [blocking, setBlocking] = useState(false)
  const [deleting, setDeleting] = useState(false)
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
    setDeleting(true)
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

      toast.success(
        data?.employeeDeleted
          ? 'Employee deleted from Clerk and the employee list.'
          : 'Employee deleted from Clerk. No matching employee record was found.',
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete employee.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <article className={`rounded-xl border border-zinc-200 bg-white p-4 shadow-none transition dark:border-zinc-900 dark:bg-black ${isBlocked ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 px-1.5 text-[10px] font-medium text-zinc-500 dark:border-zinc-900 dark:bg-black dark:text-zinc-400">
            {sno}
          </div>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-[12px] font-semibold text-white dark:bg-black dark:text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{employee.fullName}</span>
              {isBlocked && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-zinc-300 bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600 dark:border-zinc-900 dark:bg-black dark:text-white/60">
                  <Ban className="size-3" />
                  Blocked
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">{employee.email}</p>
          </div>
        </div>
        <div className="shrink-0">
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => onView(employee)} className="inline-flex size-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-900 dark:bg-black dark:text-white/65 dark:hover:bg-zinc-950" title="View">
              <Eye className="size-3.5" />
            </button>
            <button type="button" onClick={() => onEdit(employee)} className="inline-flex size-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-900 dark:bg-black dark:text-white/65 dark:hover:bg-zinc-950" title="Edit">
              <Edit className="size-3.5" />
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button type="button" disabled={deleting} className="inline-flex size-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-900 dark:bg-black dark:text-white/65 dark:hover:bg-zinc-950" title="Delete">
                  <Trash2 className="size-3.5" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete employee?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {employee.fullName}? This removes the employee from Clerk and the employee list when a matching record exists.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500/30"
                  >
                    Delete employee
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <button type="button" onClick={handleBlock} disabled={blocking} className={`inline-flex size-7 items-center justify-center rounded-md border transition disabled:opacity-50 ${isBlocked ? 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:border-zinc-900 dark:bg-black dark:text-white/70 dark:hover:bg-zinc-950' : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 dark:border-zinc-900 dark:bg-black dark:text-white/65 dark:hover:bg-zinc-950'}`} title={isBlocked ? 'Unblock' : 'Block'}>
              <Ban className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-900 dark:bg-black">
          <p className="uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">Role</p>
          <p className="mt-1 font-semibold text-zinc-800 dark:text-zinc-100">{role === 'admin' ? 'Admin' : 'Staff'}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-900 dark:bg-black">
          <p className="uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">Department</p>
          <p className="mt-1 font-semibold text-zinc-800 dark:text-zinc-100">{employee.department || 'Unassigned'}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-900 dark:bg-black">
          <p className="uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">Type</p>
          <p className="mt-1 font-semibold text-zinc-800 dark:text-zinc-100">{employee.employeeType || 'Employee'}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-900 dark:bg-black">
          <p className="uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">Phone</p>
          <p className="mt-1 truncate font-semibold text-zinc-800 dark:text-zinc-100">{employee.phone || '--'}</p>
        </div>
        <div className="col-span-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-900 dark:bg-black">
          <p className="uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">Hired Date</p>
          <p className="mt-1 font-semibold text-zinc-800 dark:text-zinc-100">{formatDate(employee.joiningDate)}</p>
        </div>
      </div>
    </article>
  )
}
//  View Employee Panel 

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
  const [now] = useState(() => Date.now())
  const formatDate = (d: string) => {
    const date = new Date(d)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const fields = [
    { label: 'Full Name', value: employee.fullName },
    { label: 'Email', value: employee.email },
    { label: 'Phone', value: employee.phone || '' },
    { label: 'Department', value: employee.department || '' },
    { label: 'Position', value: employee.position },
    { label: 'Employee ID', value: employee.employeeId },
    { label: 'Employee Type', value: employee.employeeType },
    { label: 'Date of Birth', value: employee.dateOfBirth ? formatDate(employee.dateOfBirth) : '' },
    { label: 'Joining Date', value: formatDate(employee.joiningDate) },
    { label: 'Basic Salary', value: employee.salary ? `${employee.salary.toLocaleString('en-IN')}` : '' },
    { label: 'Allowances', value: employee.allowances ? `${employee.allowances.toLocaleString('en-IN')}` : '' },
    { label: 'Overtime Rate', value: employee.overtimeRatePerHour ? `${employee.overtimeRatePerHour.toLocaleString('en-IN')}` : '' },
    { label: 'Salary Type', value: employee.salaryType || '' },
    { label: 'Bank Name', value: employee.bankName || '' },
    { label: 'Account Number', value: employee.accountNumber || '' },
    { label: 'IFSC Code', value: employee.ifscCode || '' },
    { label: 'Address', value: employee.address || '' },
  ]

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 dark:bg-black/70" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-[460px] flex-col border-l border-zinc-200 bg-white shadow-none dark:border-zinc-900 dark:bg-black">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-900">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Employee Details</h2>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{employee.fullName}</p>
          </div>
          <button onClick={onClose} className="rounded-md border border-zinc-200 p-1.5 text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-950 cursor-pointer">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Personal Details */}
          <div>
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">Personal Details</h3>
            <div className="space-y-2.5">
              {fields.map(({ label, value }) => (
                <div key={label}>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">{label}</label>
                  <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="border-t border-zinc-200 px-6 py-4 dark:border-zinc-900">
          <button
            onClick={onClose}
            className="w-full rounded-md border border-zinc-200 bg-zinc-900 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:border-zinc-900 dark:bg-black dark:text-white dark:hover:bg-zinc-950 cursor-pointer"
          >
            Close
          </button>
        </div>
      </aside>
    </>
  )
}

//  Edit Employee Panel 

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
    salary: employee.salary ? String(employee.salary) : '',
    allowances: employee.allowances ? String(employee.allowances) : '',
    overtimeRatePerHour: employee.overtimeRatePerHour ? String(employee.overtimeRatePerHour) : '',
    salaryType: employee.salaryType ?? 'monthly',
    bankName: employee.bankName ?? '',
    accountNumber: employee.accountNumber ?? '',
    ifscCode: employee.ifscCode ?? '',
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
        allowances: form.allowances ? Number(form.allowances) : undefined,
        overtimeRatePerHour: form.overtimeRatePerHour ? Number(form.overtimeRatePerHour) : undefined,
        salaryType: form.salaryType,
        bankName: form.bankName.trim() || undefined,
        accountNumber: form.accountNumber.trim() || undefined,
        ifscCode: form.ifscCode.trim() || undefined,
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
      <div className="fixed inset-0 z-40 bg-black/30 dark:bg-black/70" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-[400px] flex-col border-l border-zinc-200 bg-white shadow-none dark:border-zinc-900 dark:bg-black">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-900">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Edit Employee</h2>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{employee.fullName}</p>
          </div>
          <button onClick={onClose} className="rounded-md border border-zinc-200 p-1.5 text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-950 cursor-pointer">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-900 dark:bg-black">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-medium text-zinc-900 dark:text-white">Login & Security</h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  User ID is editable now. Password reset wiring can plug into this section later.
                </p>
              </div>
              {syncingLogin && (
                <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">Syncing...</span>
              )}
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">User ID</label>
                <input
                  type="text"
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-900 dark:bg-black dark:text-white dark:focus:border-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">Password</label>
                <input
                  type="password"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  placeholder="Ready for reset flow"
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-zinc-400 dark:border-zinc-900 dark:bg-black dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white"
                />
                <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                  Reserved for the future reset action so we can connect it to Clerk later.
                </p>
              </div>
            </div>
          {securityWarning && (
            <p className="mt-3 rounded-md border border-zinc-200 bg-zinc-100 px-3 py-2 text-xs text-zinc-700 dark:border-zinc-900 dark:bg-black dark:text-zinc-300">
              {securityWarning}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-900 dark:bg-black">
          <div className="flex items-center gap-2 pb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <Wallet className="size-4" />
            Salary Details
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {(['monthly', 'daily'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, salaryType: type }))}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition cursor-pointer ${
                    form.salaryType === type
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-900 dark:bg-black dark:text-white'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 dark:border-zinc-900 dark:bg-black dark:text-zinc-300 dark:hover:border-white/25'
                  }`}
                >
                  {type === 'monthly' ? 'Monthly' : 'Daily'}
                </button>
              ))}
            </div>
            {([
              { label: 'Basic Salary', key: 'salary', type: 'number', placeholder: '50000' },
              { label: 'Allowances', key: 'allowances', type: 'number', placeholder: '5000' },
              { label: 'Overtime Rate Per Hour', key: 'overtimeRatePerHour', type: 'number', placeholder: '250' },
              { label: 'Bank Name', key: 'bankName', type: 'text', placeholder: 'HDFC Bank' },
              { label: 'Account Number', key: 'accountNumber', type: 'text', placeholder: '1234567890' },
              { label: 'IFSC Code', key: 'ifscCode', type: 'text', placeholder: 'HDFC0001234' },
            ] as const).map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-900 dark:bg-black dark:text-white dark:focus:border-white"
                />
              </div>
            ))}
          </div>
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
              <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">{label}</label>
              {type === 'phone' ? (
                <>
                  <div className="mt-1 flex gap-2">
                    <Select
                      value={selectedCountryCode}
                      onValueChange={setSelectedCountryCode}
                    >
                      <SelectTrigger className="w-[104px] border-zinc-200 bg-white text-zinc-900 dark:border-zinc-900 dark:bg-black dark:text-white">
                        <SelectValue>
                          {(() => {
                            const selected = COUNTRY_CODES.find((c) => c.code === selectedCountryCode) ?? COUNTRY_CODES[0]
                            return (
                              <div className="flex items-center gap-1.5">
                                <img
                                  src={`https://flagcdn.com/w40/${selected.code.toLowerCase()}.png`}
                                  alt={selected.code}
                                  className="h-3.5 w-5 rounded-xs border border-zinc-200 object-cover dark:border-zinc-900"
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
                            className="h-3.5 w-5 rounded-xs border border-zinc-200 object-cover dark:border-zinc-900"
                          />
                                <span className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">{c.code}</span>
                                <span className="font-medium text-zinc-700 dark:text-zinc-300">{c.value}</span>
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
                      className={`flex-1 rounded-md border px-3 py-2 text-sm text-zinc-900 bg-white outline-none transition focus:border-zinc-400 dark:bg-black dark:text-white dark:focus:border-white ${phoneError ? 'border-zinc-300 dark:border-white/20' : 'border-zinc-200 dark:border-zinc-900'}`}
                    />
                  </div>
                  {phoneError && <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{phoneError}</p>}
                </>
              ) : (
                <input
                  type={type}
                  value={form[key] ?? ''}
                  onChange={(e) => setForm({ ...form, [key]: type === 'number' ? e.target.valueAsNumber : e.target.value })}
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-900 dark:bg-black dark:text-white dark:focus:border-white"
                />
              )}
            </div>
          ))}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">Date of Birth</label>
            <DatePicker
              value={form.dateOfBirth}
              onChange={(val) => setForm({ ...form, dateOfBirth: val })}
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">Address</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-900 dark:bg-black dark:text-white dark:focus:border-white"
            />
          </div>
        </form>

        <div className="flex gap-2 border-t border-zinc-200 px-5 py-4 dark:border-zinc-900">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md border border-zinc-200 bg-white py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-900 dark:bg-black dark:text-white dark:hover:bg-zinc-950 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-md border border-zinc-200 bg-zinc-900 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:border-zinc-900 dark:bg-black dark:text-white dark:hover:bg-zinc-950 cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </aside>
    </>
  )
}

//  Main Page 

export default function EmployeesPage() {
  const router = useRouter()
  const viewer = useQuery(api.users.viewer)
  const { isLoaded } = useUser()
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
      if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('Only CSV files are supported for import right now.')
        return
      }

      const text = await file.text()
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)

      if (lines.length === 0) {
        alert('The CSV file is empty.')
        return
      }

      const headers = lines[0].split(',').map((header) => header.trim())
      const rows = lines.slice(1).map((line) => {
        const values = line.split(',')
        const row: Record<string, string> = {}
        headers.forEach((header, index) => {
          row[header] = (values[index] ?? '').trim()
        })
        return row
      })

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

      let msg = ` ${clerkOk} employee(s) imported with Clerk accounts.`
      if (clerkFail > 0) {
        msg += `\n ${clerkFail} Clerk account(s) failed:\n${failures.map((r: { email: string; error?: string }) => `  ${r.email}: ${r.error || 'Unknown'}`).join('\n')}`
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
        toast.success(` ${data.ok} employee(s) synced to Clerk automatically.`)
      }
    } catch (err) {
      console.error('Auto-sync failed:', err)
    } finally {
      setSyncing(false)
    }
  }

  // Auto-sync employees to Clerk on mount
  useEffect(() => {
    if (employees.length === 0 || syncing) return
    const timer = window.setTimeout(() => {
      void handleSyncExisting()
    }, 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees.length, userEmails.length])

  const isAdmin = viewer?.role === 'admin'

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

  const isMobile = useIsMobile()

  if (viewer !== undefined && isLoaded && !isAdmin) {
    return null
  }

  const totalEmployees = employees.length
  const departments = new Set(employees.map((e) => e.department)).size
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginatedEmployees = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-4 text-zinc-900 dark:bg-black dark:text-white" suppressHydrationWarning>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-lg shadow-zinc-950/10 dark:bg-white dark:text-zinc-950">
            <Users className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Employees</h1>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">Enterprise roster, search, filters, and quick actions.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {employeesWithoutClerk.length > 0 && (
            <button
              onClick={handleSyncExisting}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-900 dark:bg-black dark:text-white dark:hover:bg-zinc-950 cursor-pointer"
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
            className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-900 dark:bg-black dark:text-white dark:hover:bg-zinc-950 cursor-pointer"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            {importing ? 'Importing...' : 'Import'}
          </button>
          <input
            id="csvInput"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImport(file)
              e.target.value = ''
            }}
          />
          <button
            onClick={() => setPanelOpen(true)}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:border-zinc-900 dark:bg-black dark:text-white dark:hover:bg-zinc-950 cursor-pointer"
          >
            <Plus className="size-4" />
            Create Employee
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 grid gap-3 rounded-[24px] border border-zinc-200/70 bg-white/90 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur dark:border-zinc-900 dark:bg-zinc-950/85 dark:shadow-[0_10px_30px_rgba(0,0,0,0.25)] sm:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees by name, role, or department..."
            className="w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
          />
        </div>
        <div className="relative">
          <input
            type="text"
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            placeholder="Filter by email address..."
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
          />
        </div>
      </div>

      {/* Employee List */}
      <section className={hrmsSectionClass}>
        <div className="border-b border-zinc-200/70 px-4 py-4 dark:border-zinc-900 sm:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white">Employee Directory</h2>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                Compact roster with fast actions and dense table layout.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              <Users className="size-3.5 text-zinc-500 dark:text-zinc-400" />
              {filtered.length} employees
            </div>
          </div>
        </div>

        {isMobile ? (
          <div className="space-y-3 p-3">
            {paginatedEmployees.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-900 dark:bg-black dark:text-zinc-400">
                {search ? 'No employees match your search.' : 'No employees yet. Click "Create Employee" to add one.'}
              </div>
            ) : (
              paginatedEmployees.map((emp, idx) => (
                <EmployeeMobileCard
                  key={emp._id}
                  employee={emp}
                  sno={(page - 1) * PAGE_SIZE + idx + 1}
                  role={roleMap[emp.email]}
                  formatDate={formatDate}
                  onView={setViewingEmployee}
                  onEdit={setEditingEmployee}
                />
              ))
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={hrmsTableClass}>
              <colgroup>
                <col className="w-[5%]" />
                <col className="w-[30%]" />
                <col className="w-[10%]" />
                <col className="w-[14%]" />
                <col className="w-[10%]" />
                <col className="w-[13%]" />
                <col className="w-[12%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead>
                <tr className={hrmsTableHeadRowClass}>
                  {['S.No', 'Employee', 'Role', 'Department', 'Type', 'Phone', 'Hired Date', 'Actions'].map((h) => (
                    <th key={h} className={`${hrmsTableHeadCellClass} ${h === 'Actions' ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={hrmsTableEmptyClass}>
                      {search ? 'No employees match your search.' : 'No employees yet. Click "Create Employee" to add one.'}
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map((emp, idx) => (
                    <EmployeeRow
                      key={emp._id}
                      employee={emp}
                      sno={(page - 1) * PAGE_SIZE + idx + 1}
                      role={roleMap[emp.email]}
                      formatDate={formatDate}
                      onView={setViewingEmployee}
                      onEdit={setEditingEmployee}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-zinc-200/70 px-4 py-4 dark:border-zinc-900 sm:px-5">
          <Pagination current={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>
      </section>

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
