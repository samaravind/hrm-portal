'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { ClipboardList, CheckCircle2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

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

type FormData = {
  fullName: string
  email: string
  phone: string
  department: string
  role: string
  joiningDate: string
  address: string
  emergencyContact: string
  notes: string
}

const DEPARTMENTS = [
  'Engineering',
  'Sales',
  'Marketing',
  'Human Resources',
  'Finance',
  'Operations',
  'Support',
  'Design',
]

const ROLES = ['Staff', 'Senior Staff', 'Team Lead', 'Manager']

const initialForm: FormData = {
  fullName: '',
  email: '',
  phone: '',
  department: '',
  role: '',
  joiningDate: '',
  address: '',
  emergencyContact: '',
  notes: '',
}

export default function EmployeeFormPage() {
  const { user, isLoaded } = useUser()
  const [form, setForm] = useState<FormData>(initialForm)
  const [countryCode, setCountryCode] = useState('IN')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitEmployeeForm = useMutation(api.employees.submitForm)

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-zinc-400 text-sm">
        Loading...
      </div>
    )
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
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
    if (!user) return
    if (form.phone.length > 0 && form.phone.length !== 10) {
      setPhoneError('Phone must be exactly 10 digits')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) ?? COUNTRY_CODES[0]
      const fullPhone = form.phone ? `${selectedCountry.value} ${form.phone}` : ''
      await submitEmployeeForm({
        viewerId: user.id,
        viewerName: user.fullName ?? user.username ?? null,
        viewerEmail: user.primaryEmailAddress?.emailAddress ?? null,
        ...form,
        phone: fullPhone,
      })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="size-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900">Form Submitted!</h2>
          <p className="text-zinc-500 text-sm max-w-sm">
            Your employee details have been submitted successfully. The admin will review and activate your profile.
          </p>
          <button
            onClick={() => { setForm(initialForm); setCountryCode('IN'); setPhoneError(null); setSubmitted(false) }}
            className="mt-4 rounded-xl bg-zinc-950 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition"
          >
            Submit Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6c47ff]/10">
          <ClipboardList className="size-5 text-[#6c47ff]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Employee Registration</h1>
          <p className="text-sm text-zinc-500">Fill in your details to complete your employee profile</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">
            Personal Information
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700" htmlFor="fullName">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={form.fullName}
                onChange={handleChange}
                placeholder="Sam Aravind"
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#6c47ff] focus:outline-none focus:ring-2 focus:ring-[#6c47ff]/20 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700" htmlFor="email">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="sam@example.com"
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#6c47ff] focus:outline-none focus:ring-2 focus:ring-[#6c47ff]/20 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700" htmlFor="phone">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <Select
                  value={countryCode}
                  onValueChange={setCountryCode}
                >
                  <SelectTrigger className="w-[110px] flex items-center gap-1.5 px-3 py-2.5 bg-zinc-50 text-zinc-900 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#6c47ff]/20">
                    {(() => {
                      const selected = COUNTRY_CODES.find((c) => c.code === countryCode) ?? COUNTRY_CODES[0]
                      return (
                        <div className="flex items-center gap-1.5">
                          <img
                            src={`https://flagcdn.com/w40/${selected.code.toLowerCase()}.png`}
                            alt={selected.code}
                            className="w-5 h-3.5 object-cover rounded-xs border border-zinc-200"
                          />
                          <span className="text-sm font-medium">{selected.value}</span>
                        </div>
                      )
                    })()}
                  </SelectTrigger>

                  <SelectContent>
                    {COUNTRY_CODES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                            alt={c.code}
                            className="w-5 h-3.5 object-cover rounded-xs border border-zinc-200"
                          />
                          <span className="text-xs text-zinc-400 font-semibold uppercase">{c.code}</span>
                          <span className="text-zinc-600 font-medium">{c.value}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex-1">
                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    required
                    value={form.phone}
                    onChange={handlePhoneChange}
                    placeholder="Enter 10-digit number"
                    className={`w-full rounded-xl border bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#6c47ff]/20 transition ${
                      phoneError
                        ? 'border-rose-300 focus:border-rose-400'
                        : 'border-zinc-200 focus:border-[#6c47ff]'
                    }`}
                  />
                </div>
              </div>
              {phoneError && <p className="text-[11px] text-rose-500 mt-1">{phoneError}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700" htmlFor="joiningDate">
                Joining Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="joiningDate"
                name="joiningDate"
                type="date"
                required
                value={form.joiningDate}
                onChange={handleChange}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#6c47ff] focus:outline-none focus:ring-2 focus:ring-[#6c47ff]/20 transition"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700" htmlFor="address">
              Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              value={form.address}
              onChange={handleChange}
              placeholder="123 Main St, Chennai, Tamil Nadu"
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#6c47ff] focus:outline-none focus:ring-2 focus:ring-[#6c47ff]/20 transition"
            />
          </div>
        </section>

        {/* Work Details */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">
            Work Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700" htmlFor="department">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                id="department"
                name="department"
                required
                value={form.department}
                onChange={handleChange}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#6c47ff] focus:outline-none focus:ring-2 focus:ring-[#6c47ff]/20 transition"
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700" htmlFor="role">
                Role <span className="text-rose-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                required
                value={form.role}
                onChange={handleChange}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#6c47ff] focus:outline-none focus:ring-2 focus:ring-[#6c47ff]/20 transition"
              >
                <option value="">Select role</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-700" htmlFor="emergencyContact">
                Emergency Contact
              </label>
              <input
                id="emergencyContact"
                name="emergencyContact"
                type="text"
                value={form.emergencyContact}
                onChange={handleChange}
                placeholder="Name — +91 98765 43210"
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#6c47ff] focus:outline-none focus:ring-2 focus:ring-[#6c47ff]/20 transition"
              />
            </div>
          </div>
        </section>

        {/* Additional Notes */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">
            Additional Notes
          </h2>
          <textarea
            id="notes"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={4}
            placeholder="Any additional information you'd like to share..."
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#6c47ff] focus:outline-none focus:ring-2 focus:ring-[#6c47ff]/20 transition resize-none"
          />
        </section>

        {error && (
          <p className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#6c47ff] px-8 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#5a3ae0] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Form'}
          </button>
        </div>
      </form>
    </div>
  )
}
