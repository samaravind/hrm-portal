'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { ArrowLeft, FileText, Paperclip, Save, RotateCcw, X, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

const leaveTypes = ['Sick Leave', 'Casual Leave', 'Earned Leave', 'Comp Off', 'Other']
const periodOptions = ['1st Period', '2nd Period', '3rd Period', '4th Period', '5th Period']
type LeaveDurationType = 'fullDay' | 'halfDay' | 'periodWise'

export default function ApplyLeavePage() {
  const router = useRouter()
  const { isLoaded, user } = useUser()
  const viewer = useQuery(api.users.viewer)
  const isAdmin = viewer?.role === 'admin'
  const createLeaveRequest = useMutation(api.leave.createLeaveRequest)
  const generateUploadUrl = useMutation(api.leave.generateUploadUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [documents, setDocuments] = useState<File[]>([])
  const [leaveType, setLeaveType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [durationType, setDurationType] = useState<LeaveDurationType>('fullDay')
  const [partialDate, setPartialDate] = useState('')
  const [session, setSession] = useState<'AM' | 'PM' | ''>('')
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [saving, setSaving] = useState(false)
  const halfDay = durationType === 'halfDay'
  const periodWise = durationType === 'periodWise'

  useEffect(() => {
    if (!isLoaded || viewer === undefined) return

    if (viewer?.approvalStatus === 'pending' && !isAdmin) {
      router.replace('/pending-approval')
      return
    }

    if (viewer?.approvalStatus === 'declined' && !isAdmin) {
      router.replace('/denied')
      return
    }

    if (isAdmin) {
      router.replace('/')
    }
  }, [viewer, isAdmin, isLoaded, router])

  if (viewer !== undefined && isLoaded && isAdmin) {
    return null
  }

  if (!isLoaded || viewer === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-pulse text-sm text-zinc-400">Loading apply leave form...</div>
      </div>
    )
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    setDocuments(Array.from(files))
  }

  const handleSave = async () => {
    if (saving) return

    setSaving(true)
    try {
      const uploadedDocuments = await Promise.all(
        documents.map(async (file) => {
          const uploadUrl = await generateUploadUrl()
          const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 'Content-Type': file.type || 'application/octet-stream' },
            body: file,
          })

          if (!response.ok) {
            throw new Error(`Failed to upload ${file.name}`)
          }

          const { storageId } = (await response.json()) as { storageId: Id<'_storage'> }
          return {
            name: file.name,
            storageId,
            contentType: file.type || null,
            size: file.size,
          }
        }),
      )

      await createLeaveRequest({
        viewerId: user?.id ?? null,
        viewerName: user?.fullName ?? user?.username ?? null,
        viewerEmail: user?.primaryEmailAddress?.emailAddress ?? null,
        leaveType,
        startDate,
        endDate,
        durationType,
        halfDay,
        periodWise,
        partialDate: partialDate || null,
        session: session || null,
        selectedPeriod: selectedPeriod || null,
        reason,
        documents: uploadedDocuments,
      })
      toast.success('Leave request saved.')
      router.push('/leave')
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save leave request'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-rose-100 bg-[linear-gradient(180deg,_#fff5f7_0%,_#fff_100%)] p-4 shadow-[0_16px_50px_rgba(190,24,93,0.06)] dark:border-white/10 dark:bg-zinc-950/70">
        <div className="flex items-center gap-3">
          <Link
            href="/leave"
            className="inline-flex size-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
            aria-label="Back to leave dashboard"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
            Apply Leave
          </h1>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] dark:border-zinc-800 dark:bg-zinc-950/80">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-base font-medium text-zinc-950 dark:text-zinc-100">
                Leave Type <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="h-14 w-full appearance-none rounded-md border border-zinc-200 bg-white px-4 text-base text-zinc-600 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:focus:border-rose-500/40 dark:focus:ring-rose-500/10"
                >
                  <option value="">Select</option>
                  {leaveTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-zinc-300 dark:text-zinc-600" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-base font-medium text-zinc-950 dark:text-zinc-100">
                Leave Duration <span className="text-rose-500">*</span>
              </label>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { value: 'fullDay', label: 'Full Day', helper: 'Regular full day leave' },
                  { value: 'halfDay', label: 'Half Day', helper: 'Choose partial date and AM/PM' },
                  { value: 'periodWise', label: 'Period Wise', helper: 'Choose a specific period' },
                ].map((option) => {
                  const selected = durationType === option.value
                  return (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 text-base transition ${
                        selected
                          ? 'border-rose-300 bg-rose-50 text-rose-900 ring-2 ring-rose-100 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100 dark:ring-rose-500/10'
                          : 'border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <input
                        type="radio"
                        name="durationType"
                        value={option.value}
                        checked={selected}
                        onChange={() => setDurationType(option.value as LeaveDurationType)}
                        className="mt-1 size-5 border-zinc-300 text-rose-600 focus:ring-rose-200 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-rose-500/20"
                      />
                      <span>
                        <span className="block font-semibold">{option.label}</span>
                        <span className="mt-1 block text-sm text-zinc-500 dark:text-zinc-400">{option.helper}</span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {durationType === 'halfDay' ? (
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.55fr)]">
                <div>
                  <label className="mb-2 block text-base font-medium text-zinc-950 dark:text-zinc-100">
                    Partial date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={partialDate}
                    onChange={(e) => setPartialDate(e.target.value)}
                    className="h-14 w-full rounded-md border border-zinc-200 bg-white px-4 text-base text-zinc-600 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:focus:border-rose-500/40 dark:focus:ring-rose-500/10"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-base font-medium text-zinc-950 dark:text-zinc-100">
                    Session <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex h-14 items-center gap-5">
                    {(['AM', 'PM'] as const).map((value) => (
                      <label key={value} className="flex cursor-pointer items-center gap-3 text-2xl text-zinc-950 dark:text-zinc-100">
                        <input
                          type="radio"
                          name="session"
                          value={value}
                          checked={session === value}
                          onChange={() => setSession(value)}
                          className="size-6 border-zinc-300 text-rose-600 focus:ring-rose-200 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-rose-500/20"
                        />
                        {value}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-base font-medium text-zinc-950 dark:text-zinc-100">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-14 w-full rounded-md border border-zinc-200 bg-white px-4 text-base text-zinc-600 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:focus:border-rose-500/40 dark:focus:ring-rose-500/10"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-base font-medium text-zinc-950 dark:text-zinc-100">
                    To Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-14 w-full rounded-md border border-zinc-200 bg-white px-4 text-base text-zinc-600 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:focus:border-rose-500/40 dark:focus:ring-rose-500/10"
                  />
                </div>
              </div>
            )}

            {durationType === 'periodWise' ? (
              <div>
                <label className="mb-2 block text-base font-medium text-zinc-950 dark:text-zinc-100">
                  Select period <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="h-14 w-full appearance-none rounded-md border border-zinc-200 bg-white px-4 text-base text-zinc-600 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:focus:border-rose-500/40 dark:focus:ring-rose-500/10"
                  >
                    <option value="">Select periods</option>
                    {periodOptions.map((period) => (
                      <option key={period} value={period}>
                        {period}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-zinc-300 dark:text-zinc-600" />
                </div>
              </div>
            ) : null}

            <div>
              <label className="mb-2 block text-base font-medium text-zinc-950 dark:text-zinc-100">
                Reason for Leave <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for Leave"
                className="h-14 w-full rounded-md border border-zinc-200 bg-white px-4 text-base text-zinc-600 outline-none transition placeholder:text-zinc-400 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:border-rose-500/40 dark:focus:ring-rose-500/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-base font-medium text-zinc-950 dark:text-zinc-100">
                Upload Documents
              </label>
              <div className="rounded-md border border-dashed border-sky-200 bg-sky-50/40 p-4 dark:border-sky-500/20 dark:bg-sky-500/5">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                    <Paperclip className="size-5 text-sky-600 dark:text-sky-300" />
                    <span className="text-base">Drag and drop some files here</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base text-zinc-500 dark:text-zinc-400">OR</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg border border-zinc-200 bg-white px-5 py-3 text-base font-semibold text-slate-900 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                    >
                      Choose a file
                    </button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>
              <p className="mt-3 text-base text-zinc-600 dark:text-zinc-300">
                Supported files: .doc,.png,.jpg,.jpeg,.pdf,.xlsx,.docx
              </p>
              {documents.length > 0 ? (
                <div className="mt-3 rounded-md border border-sky-100 bg-sky-50/60 p-3 dark:border-sky-500/20 dark:bg-sky-500/10">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">
                    Selected documents
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {documents.map((file) => (
                      <button
                        type="button"
                        key={`${file.name}-${file.size}`}
                        onClick={() => {
                          const url = URL.createObjectURL(file)
                          window.open(url, '_blank', 'noopener,noreferrer')
                        }}
                        className="truncate rounded-lg bg-white px-3 py-2 text-left text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-sky-50 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                        title={file.name}
                      >
                        {file.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-rose-100 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] dark:border-zinc-800 dark:bg-zinc-950/80">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Preview</p>
                <h2 className="mt-2 text-xl font-semibold text-zinc-950 dark:text-white">Application summary</h2>
              </div>
              <div className="rounded-2xl bg-rose-50 p-3 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                <FileText className="size-5" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                ['Leave Type', leaveType || 'Select'],
                ['Duration', durationType === 'fullDay' ? 'Full Day' : durationType === 'halfDay' ? 'Half Day' : 'Period Wise'],
                ['Start Date', halfDay ? partialDate || 'Partial Date' : startDate || 'Start Date'],
                ['To Date', halfDay ? partialDate || 'Partial Date' : endDate || 'To Date'],
                ['Session', halfDay ? session || 'AM / PM' : 'Not applicable'],
                ['Period', periodWise ? selectedPeriod || 'Select period' : 'Not applicable'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">{label}</p>
                  <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-rose-100 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] dark:border-zinc-800 dark:bg-zinc-950/80">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                <Save className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">Action bar</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Save your request when ready.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-800 px-5 py-3 text-base font-semibold text-white shadow-[0_18px_40px_rgba(153,27,27,0.22)] transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-rose-800"
              >
                <Save className="size-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLeaveType('')
                  setStartDate('')
                  setEndDate('')
                  setReason('')
                  setDurationType('fullDay')
                  setPartialDate('')
                  setSession('')
                  setSelectedPeriod('')
                  setDocuments([])
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3 text-base font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                <RotateCcw className="size-4" />
                Reset
              </button>
              <Link
                href="/leave"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3 text-base font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                <X className="size-4" />
                Cancel
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
