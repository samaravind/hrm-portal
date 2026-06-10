'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { ArrowLeft, CheckCircle2, XCircle, Bell, Sparkles, Users, CalendarRange, Eye, ExternalLink, X } from 'lucide-react'

type LeaveDocument =
  | string
  | {
      name: string
      storageId: Id<'_storage'>
      contentType?: string | null
      size?: number
    }

type DocumentPreview = {
  name: string
  url: string
  contentType?: string | null
}

function isImageDocument(name: string, contentType?: string | null) {
  return (
    contentType?.startsWith('image/') ||
    /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name)
  )
}

function formatLeaveDuration(request: {
  durationType?: 'fullDay' | 'halfDay' | 'periodWise'
  halfDay?: boolean
  periodWise?: boolean
  session?: 'AM' | 'PM' | null
  selectedPeriod?: string | null
}) {
  if (request.durationType === 'halfDay' || request.halfDay) {
    return `Half Day${request.session ? ` (${request.session})` : ''}`
  }

  if (request.durationType === 'periodWise' || request.periodWise) {
    return `Period Wise${request.selectedPeriod ? ` (${request.selectedPeriod})` : ''}`
  }

  return 'Full Day'
}

function UploadedDocumentLink({
  requestId,
  document,
  onPreview,
}: {
  requestId: Id<'leaveRequests'>
  document: LeaveDocument
  onPreview: (preview: DocumentPreview) => void
}) {
  const isStoredDocument = typeof document !== 'string'
  const fileUrl = useQuery(
    api.leave.getLeaveDocumentUrl,
    isStoredDocument ? { requestId, storageId: document.storageId } : 'skip',
  )
  const documentName = isStoredDocument ? document.name : document

  if (!isStoredDocument) {
    return (
      <div
        className="flex w-full items-center justify-between gap-3 rounded-lg bg-white/80 px-3 py-2 text-left text-xs font-medium text-zinc-700 shadow-sm dark:bg-white/5 dark:text-zinc-200"
        title={documentName}
      >
        <span className="truncate">{documentName}</span>
        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          Re-upload
        </span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (!fileUrl) return
        onPreview({
          name: documentName,
          url: fileUrl,
          contentType: document.contentType,
        })
      }}
      disabled={!fileUrl}
      className="flex w-full items-center justify-between gap-3 rounded-lg bg-white/80 px-3 py-2 text-left text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
      title={documentName}
    >
      <span className="truncate">{documentName}</span>
      <span className="inline-flex shrink-0 items-center gap-1 text-sky-700 dark:text-sky-300">
        <Eye className="size-3.5" />
        Preview
      </span>
    </button>
  )
}

export default function ApprovalsPage() {
  const router = useRouter()
  const { isLoaded } = useUser()
  const viewer = useQuery(api.users.viewer)
  const pendingApprovals = useQuery(api.users.listPendingApprovals) ?? []
  const pendingLeaveRequests = useQuery(api.leave.listPendingLeaveRequests) ?? []
  const approveUser = useMutation(api.users.approveUserByTokenIdentifier)
  const declineUser = useMutation(api.users.declineUserByTokenIdentifier)
  const approveLeaveRequest = useMutation(api.leave.approveLeaveRequest)
  const declineLeaveRequest = useMutation(api.leave.declineLeaveRequest)
  const [workingToken, setWorkingToken] = useState<string | null>(null)
  const [workingLeaveId, setWorkingLeaveId] = useState<Id<'leaveRequests'> | null>(null)
  const [documentPreview, setDocumentPreview] = useState<DocumentPreview | null>(null)

  const isAdmin = viewer?.role === 'admin'
  const totalPending = pendingApprovals.length + pendingLeaveRequests.length

  useEffect(() => {
    if (!isLoaded || viewer === undefined) return

    if (viewer?.approvalStatus === 'pending' && viewer?.role !== 'admin') {
      router.replace('/pending-approval')
      return
    }

    if (viewer?.approvalStatus === 'declined' && viewer?.role !== 'admin') {
      router.replace('/denied')
      return
    }

    if (!isAdmin) {
      router.replace('/staff-dashboard')
    }
  }, [viewer, isAdmin, isLoaded, router])

  const handleApprove = async (tokenIdentifier: string) => {
    setWorkingToken(tokenIdentifier)
    try {
      await approveUser({ tokenIdentifier })
      router.refresh()
    } finally {
      setWorkingToken(null)
    }
  }

  const handleDecline = async (tokenIdentifier: string) => {
    setWorkingToken(tokenIdentifier)
    try {
      await declineUser({ tokenIdentifier })
      router.refresh()
    } finally {
      setWorkingToken(null)
    }
  }

  const handleApproveLeave = async (requestId: Id<'leaveRequests'>) => {
    setWorkingLeaveId(requestId)
    try {
      await approveLeaveRequest({ requestId })
      router.refresh()
    } finally {
      setWorkingLeaveId(null)
    }
  }

  const handleDeclineLeave = async (requestId: Id<'leaveRequests'>) => {
    setWorkingLeaveId(requestId)
    try {
      await declineLeaveRequest({ requestId })
      router.refresh()
    } finally {
      setWorkingLeaveId(null)
    }
  }

  if (viewer !== undefined && isLoaded && viewer?.approvalStatus === 'pending' && viewer?.role !== 'admin') {
    return null
  }

  if (viewer !== undefined && isLoaded && viewer?.approvalStatus === 'declined' && viewer?.role !== 'admin') {
    return null
  }

  if (viewer !== undefined && isLoaded && !isAdmin) {
    return null
  }

  return (
    <div className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(236,72,153,0.14),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(20,184,166,0.10),_transparent_22%)]" />
      <div className="space-y-6">
        <section className="rounded-[36px] border border-white/70 bg-gradient-to-br from-white/90 via-rose-50/70 to-amber-50/70 p-6 shadow-[0_24px_90px_rgba(99,102,241,0.10)] backdrop-blur-xl dark:border-white/10 dark:from-zinc-950/85 dark:via-zinc-950/75 dark:to-zinc-900/70 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                <ArrowLeft className="size-4" />
                Back to dashboard
              </Link>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-rose-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-rose-300">
                <Sparkles className="size-3.5" />
                Admin approvals
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                Review access requests
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300 sm:text-base">
                New users who signed up will appear here. Click Approve to let them into the app, or Decline to deny access.
              </p>
            </div>

            <div className="inline-flex items-center gap-3 rounded-3xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-300">
                <Bell className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Waiting</p>
                <p className="text-lg font-semibold text-zinc-950 dark:text-white">{totalPending}</p>
              </div>
              <Users className="size-5 text-zinc-400" />
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/75 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70">
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between gap-3 px-2 pb-3">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">Access approvals</h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">New users waiting for dashboard access.</p>
                </div>
                <span className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">
                  {pendingApprovals.length}
                </span>
              </div>

              {pendingApprovals.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-zinc-200 bg-zinc-50 px-4 py-16 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-white/5 dark:text-zinc-400">
                  No pending approvals right now.
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {pendingApprovals.map((entry) => (
                    <div
                      key={entry.tokenIdentifier}
                      className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-zinc-950 dark:text-white">
                            {entry.name || 'New user'}
                          </p>
                          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                            Email
                          </p>
                          <p className="truncate text-sm text-zinc-600 dark:text-zinc-300">
                            {entry.email || entry.name || 'Email pending'}
                          </p>
                        </div>
                        <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                          Pending
                        </span>
                      </div>

                      <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                        Token: {entry.tokenIdentifier.slice(0, 18)}...
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(entry.tokenIdentifier)}
                          disabled={workingToken === entry.tokenIdentifier}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-900 disabled:text-white disabled:opacity-100 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-800"
                        >
                          <CheckCircle2 className="size-4" />
                          {workingToken === entry.tokenIdentifier ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecline(entry.tokenIdentifier)}
                          disabled={workingToken === entry.tokenIdentifier}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/15"
                        >
                          <XCircle className="size-4" />
                          {workingToken === entry.tokenIdentifier ? 'Declining...' : 'Decline'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 px-2 pb-3">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">Leave approvals</h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Staff leave requests waiting for admin action.</p>
                </div>
                <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
                  {pendingLeaveRequests.length}
                </span>
              </div>

              {pendingLeaveRequests.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-zinc-200 bg-zinc-50 px-4 py-16 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-white/5 dark:text-zinc-400">
                  No pending leave approvals right now.
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {pendingLeaveRequests.map((request) => (
                    <div
                      key={request._id}
                      className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-zinc-950 dark:text-white">
                            {request.userName || 'Staff member'}
                          </p>
                          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                            Leave type
                          </p>
                          <p className="truncate text-sm text-zinc-600 dark:text-zinc-300">
                            {request.leaveType}
                          </p>
                          <p className="mt-1 truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            {formatLeaveDuration(request)}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
                          <CalendarRange className="size-3.5" />
                          Leave
                        </span>
                      </div>

                      <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                        {request.startDate} to {request.endDate}
                      </div>

                      <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                        {request.reason}
                      </div>

                      {request.documents.length > 0 ? (
                        <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 dark:border-sky-500/20 dark:bg-sky-500/10">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
                            Uploaded documents
                          </p>
                          <div className="mt-2 space-y-1.5">
                            {request.documents.map((document, index) => (
                              <UploadedDocumentLink
                                key={typeof document === 'string' ? `${document}-${index}` : document.storageId}
                                requestId={request._id}
                                document={document}
                                onPreview={setDocumentPreview}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/70 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                          No documents uploaded.
                        </div>
                      )}

                      <div className="mt-4 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApproveLeave(request._id)}
                          disabled={workingLeaveId === request._id}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-900 disabled:text-white disabled:opacity-100 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-800"
                        >
                          <CheckCircle2 className="size-4" />
                          {workingLeaveId === request._id ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeclineLeave(request._id)}
                          disabled={workingLeaveId === request._id}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/15"
                        >
                          <XCircle className="size-4" />
                          {workingLeaveId === request._id ? 'Declining...' : 'Decline'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {documentPreview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm">
          <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.35)] dark:bg-zinc-950">
            <div className="flex items-center justify-between gap-4 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
                  Uploaded document preview
                </p>
                <h3 className="mt-1 truncate text-base font-semibold text-zinc-950 dark:text-white">
                  {documentPreview.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={documentPreview.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex size-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  aria-label="Open document in new tab"
                >
                  <ExternalLink className="size-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setDocumentPreview(null)}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  aria-label="Close document preview"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 bg-zinc-100 p-4 dark:bg-zinc-900">
              {isImageDocument(documentPreview.name, documentPreview.contentType) ? (
                <div className="flex max-h-[68vh] items-center justify-center overflow-auto rounded-2xl bg-white p-3 dark:bg-zinc-950">
                  <object
                    data={documentPreview.url}
                    type={documentPreview.contentType ?? 'image/*'}
                    aria-label={documentPreview.name}
                    className="max-h-[64vh] w-auto max-w-full rounded-xl object-contain shadow-sm"
                  >
                    <a href={documentPreview.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-sky-700 dark:text-sky-300">
                      Open image
                    </a>
                  </object>
                </div>
              ) : (
                <iframe
                  src={documentPreview.url}
                  title={documentPreview.name}
                  className="h-[68vh] w-full rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800"
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
