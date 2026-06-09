"use client"

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import Image from 'next/image'
import { useMutation, useQuery } from 'convex/react'
import { useUser } from '@clerk/nextjs'
import { api } from '@/convex/_generated/api'
import { Mail, Phone, User, GitBranch, Crown, Pencil, Check, X, Activity, ShieldCheck, Clock3, Bell, Link2, Gauge, Server, Sparkles, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

const inputCls =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-zinc-400 dark:border-neutral-950 dark:bg-black dark:text-white dark:placeholder:text-zinc-600 dark:focus:border-neutral-950'

const sanitizePhoneInput = (value: string) => value.replace(/\D/g, '').slice(0, 10)

const normalizeStoredPhone = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits.length > 10 ? digits.slice(-10) : digits
}

export function ProfilePage() {
  const { isLoaded, user } = useUser()
  const viewer = useQuery(api.users.viewer)
  const employees = useQuery(api.employees.list) ?? []
  const updateCurrentProfile = useMutation(api.users.updateCurrentProfile)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [savedPhone, setSavedPhone] = useState<string | null>(null)
  const [form, setForm] = useState({ fullName: '', phone: '', github: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const employee = viewer?.email ? employees.find((e) => e.email === viewer.email) : null
  const roleLabel = viewer?.role === 'admin' ? 'Admin' : 'Staff'
  const avatarUrl = photoPreview || user?.imageUrl || null
  const displayName = viewer?.name || user?.fullName || 'Sam Aravind'
  const emailValue = viewer?.email || user?.primaryEmailAddress?.emailAddress || 'Not set'
  const clerkPhone =
    typeof user?.unsafeMetadata?.phone === 'string' ? user.unsafeMetadata.phone : null
  const phoneValue = savedPhone || viewer?.phone || employee?.phone || clerkPhone || user?.primaryPhoneNumber?.phoneNumber || 'Not set'
  const githubAccount = user?.externalAccounts?.find((a) => a.provider === 'github')
  const githubValue = useMemo(() => {
    if (viewer?.github) return viewer.github
    if (!githubAccount) return 'Not connected'
    return githubAccount.username ? `@${githubAccount.username}` : githubAccount.accountIdentifier()
  }, [githubAccount, viewer?.github])

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    const previewUrl = URL.createObjectURL(file)
    setPhotoPreview((current) => {
      if (current) URL.revokeObjectURL(current)
      return previewUrl
    })
    setUploadingPhoto(true)

    try {
      await user.setProfileImage({ file })
    } finally {
      setUploadingPhoto(false)
      event.target.value = ''
      window.setTimeout(() => {
        setPhotoPreview((current) => {
          if (current) URL.revokeObjectURL(current)
          return null
        })
      }, 300)
    }
  }

  const startEditing = () => {
    setSaveError(null)
    setForm({
      fullName: displayName,
      phone: phoneValue === 'Not set' ? '' : normalizeStoredPhone(phoneValue),
      github: githubValue === 'Not connected' ? '' : githubValue,
    })
    setEditing(true)
  }

  const cancelEditing = () => {
    setSaveError(null)
    setEditing(false)
  }

  const saveChanges = async () => {
    if (!isLoaded || viewer === undefined) {
      const message = 'Please wait while your profile loads.'
      setSaveError(message)
      toast.error(message)
      return
    }

    if (!form.fullName.trim()) {
      const message = 'Name is required.'
      setSaveError(message)
      toast.error(message)
      return
    }

    setSaving(true)
    setSaveError(null)
    try {
      await updateCurrentProfile({
        fullName: form.fullName.trim(),
        phone: sanitizePhoneInput(form.phone),
        github: form.github.trim(),
      })

      const nextPhone = sanitizePhoneInput(form.phone) || null
      setSavedPhone(nextPhone)

      try {
        const syncRes = await fetch('/api/update-profile-phone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: nextPhone ?? '',
          }),
        })

        if (!syncRes.ok) {
          const syncData = await syncRes.json().catch(() => null)
          toast.warning(
            syncData?.error ?? 'Profile saved, but phone sync to your account provider could not be completed.'
          )
        }
      } catch {
        toast.warning('Profile saved, but phone sync to your account provider could not be completed.')
      }

      if (!employee && viewer?.email) {
        toast.info('Profile saved. Employee record was not linked, so only your user profile was updated.')
      }

      setEditing(false)
      toast.success('Profile saved successfully.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save profile.'
      setSaveError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const detailRows = [
    {
      icon: User,
      label: 'Name',
      value: editing ? (
        <input
          type="text"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          className={inputCls}
        />
      ) : (
        displayName
      ),
      fallback: 'Not set',
    },
    {
      icon: Mail,
      label: 'Email',
      value: (
        <div className="space-y-1">
          <div>{emailValue}</div>
          {editing && (
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Login email is managed by your account provider.
            </div>
          )}
        </div>
      ),
      fallback: 'Not set',
    },
    {
      icon: Phone,
      label: 'Phone',
      value: editing ? (
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={10}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: sanitizePhoneInput(e.target.value) })}
          className={inputCls}
          placeholder="Not set"
        />
      ) : (
        phoneValue
      ),
      fallback: 'Not set',
    },
    {
      icon: GitBranch,
      label: 'GitHub',
      value: editing ? (
        <input
          type="text"
          value={form.github}
          onChange={(e) => setForm({ ...form, github: e.target.value })}
          className={inputCls}
          placeholder="Not connected"
        />
      ) : (
        githubValue
      ),
      fallback: 'Not connected',
    },
  ]

  const recentActivity = [
    { title: 'Profile updated', meta: 'Today · 10:42 AM' },
    { title: 'Phone synced', meta: 'Today · 10:31 AM' },
    { title: 'Viewed attendance', meta: 'Yesterday · 04:18 PM' },
  ]

  const loginHistory = [
    { label: 'Current session', value: 'Chrome on Windows' },
    { label: 'Last login', value: 'Today · 10:14 AM' },
    { label: 'Location', value: 'India' },
  ]

  const quickActions = [
    'Edit profile',
    'Update phone',
    'Link GitHub',
    'Review attendance',
  ]

  const notifications = [
    'Employee sync completed successfully.',
    'Attendance summary is ready.',
    'Profile data matches current account state.',
  ]

  const accountChecks = [
    { label: 'Profile data', value: 'Complete' },
    { label: 'Phone sync', value: phoneValue === 'Not set' ? 'Pending' : 'Synced' },
    { label: 'GitHub', value: githubValue === 'Not connected' ? 'Disconnected' : 'Connected' },
    { label: 'Security status', value: editing ? 'Editing' : 'Stable' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-zinc-50 to-zinc-100 text-zinc-900 dark:from-black dark:via-black dark:to-black dark:text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col justify-start px-3 py-3 sm:px-5 sm:py-4">
        <main className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)] dark:border-neutral-950 dark:bg-black dark:shadow-none sm:px-5 sm:py-5">
          <div className="mx-auto max-w-[1120px]">
            <div className="grid gap-4 lg:grid-cols-[1.12fr_0.88fr] lg:items-start">
              <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-neutral-950 dark:bg-black dark:shadow-none sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={handleAvatarClick}
                        disabled={uploadingPhoto || !isLoaded || !user}
                        className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed dark:border-neutral-950 dark:bg-black dark:hover:border-neutral-950 dark:hover:bg-black sm:h-18 sm:w-18 shadow-[0_8px_24px_rgba(15,23,42,0.08)] dark:shadow-none"
                        aria-label={uploadingPhoto ? 'Uploading photo' : 'Change profile photo'}
                      >
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt={displayName}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-700 text-sm font-semibold tracking-[0.2em] text-white dark:from-white dark:to-zinc-300 dark:text-black">
                            SM
                          </div>
                        )}
                        <div className="absolute bottom-1.5 right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-zinc-200 bg-white text-[8px] font-bold text-zinc-700 dark:border-neutral-950 dark:bg-black dark:text-zinc-600">
                          {uploadingPhoto ? '...' : '•'}
                        </div>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoChange}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-[2rem]">
                          {displayName}
                        </h2>
                        <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700 dark:border-neutral-950 dark:bg-black dark:text-zinc-500">
                          <Crown className="size-3" />
                          {roleLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{emailValue}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {editing ? (
                      <>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-neutral-950 dark:bg-black dark:text-zinc-500 dark:hover:bg-black cursor-pointer"
                        >
                          <X className="size-4" />
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={saveChanges}
                          disabled={saving || !isLoaded || viewer === undefined}
                          className="inline-flex items-center gap-2 rounded-md border border-zinc-900 bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-950 dark:bg-black dark:text-white dark:hover:bg-black cursor-pointer"
                        >
                          <Check className="size-4" />
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={startEditing}
                        disabled={!isLoaded || !user || viewer === undefined}
                        className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-950 dark:bg-black dark:text-zinc-500 dark:hover:bg-black cursor-pointer"
                      >
                        <Pencil className="size-4" />
                        Edit Profile
                      </button>
                    )}
                  </div>
                </div>

                {saveError && (
                  <p className="mt-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
                    {saveError}
                  </p>
                )}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {detailRows.map(({ icon: Icon, label, value, fallback }) => (
                    <div key={label} className="rounded-xl border border-zinc-200 bg-white p-3 shadow-[0_6px_18px_rgba(15,23,42,0.04)] dark:border-neutral-950 dark:bg-black dark:shadow-none">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-black">
                          <Icon className="size-4 text-zinc-600 dark:text-zinc-500" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                            {label}
                          </div>
                          <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">
                            {value || <span className="text-zinc-400 dark:text-zinc-500">{fallback}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <aside className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-neutral-950 dark:bg-black dark:shadow-none sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Account Snapshot</h3>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">Quick overview of linked contact and account details.</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {[
                    { label: 'Email', value: emailValue },
                    { label: 'Phone', value: phoneValue },
                    { label: 'GitHub', value: githubValue },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 shadow-[0_6px_18px_rgba(15,23,42,0.04)] dark:border-neutral-950 dark:bg-black dark:shadow-none">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">{item.label}</div>
                      <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">{item.value}</div>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-[10px] uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-600">
                  SAM MARKET v1.0.0
                </p>
              </aside>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                { label: 'Profile Status', value: editing ? 'Editing mode' : 'View mode' },
                { label: 'Contact Sync', value: phoneValue === 'Not set' ? 'Pending' : 'Synced' },
                { label: 'GitHub Link', value: githubValue === 'Not connected' ? 'Not connected' : 'Connected' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-[0_6px_18px_rgba(15,23,42,0.04)] dark:border-neutral-950 dark:bg-black dark:shadow-none">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">{item.label}</div>
                  <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-12">
              <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] dark:border-neutral-950 dark:bg-black dark:shadow-none lg:col-span-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Recent Activity</h3>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">Latest profile and account actions.</p>
                  </div>
                  <Activity className="size-4 text-zinc-500 dark:text-zinc-500" />
                </div>
                <div className="mt-3 space-y-2">
                  {recentActivity.map((item) => (
                    <div key={item.title} className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-neutral-950 dark:bg-black">
                      <div className="text-sm font-medium text-zinc-900 dark:text-white">{item.title}</div>
                      <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500">{item.meta}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] dark:border-neutral-950 dark:bg-black dark:shadow-none lg:col-span-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Account Security</h3>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">Core checks for account readiness.</p>
                  </div>
                  <ShieldCheck className="size-4 text-zinc-500 dark:text-zinc-500" />
                </div>
                <div className="mt-3 space-y-2">
                  {accountChecks.map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-neutral-950 dark:bg-black">
                      <span className="text-sm text-zinc-600 dark:text-zinc-500">{item.label}</span>
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] dark:border-neutral-950 dark:bg-black dark:shadow-none lg:col-span-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Profile Completion</h3>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">A quick read on profile completeness.</p>
                  </div>
                  <Gauge className="size-4 text-zinc-500 dark:text-zinc-500" />
                </div>
                <div className="mt-4">
                  <div className="flex items-end justify-between">
                    <div className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">82%</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-500">Good standing</div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-black">
                    <div className="h-full w-[82%] rounded-full bg-zinc-900 dark:bg-white" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[
                      'Name',
                      'Email',
                      'Phone',
                      'GitHub',
                    ].map((item) => (
                      <div key={item} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-neutral-950 dark:bg-black dark:text-zinc-500">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] dark:border-neutral-950 dark:bg-black dark:shadow-none lg:col-span-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Login History</h3>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">Recent authenticated sessions.</p>
                  </div>
                  <Clock3 className="size-4 text-zinc-500 dark:text-zinc-500" />
                </div>
                <div className="mt-3 space-y-2">
                  {loginHistory.map((item) => (
                    <div key={item.label} className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-neutral-950 dark:bg-black">
                      <div className="text-xs uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-500">{item.label}</div>
                      <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">{item.value}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] dark:border-neutral-950 dark:bg-black dark:shadow-none lg:col-span-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Quick Actions</h3>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">Common profile tasks in one place.</p>
                  </div>
                  <Sparkles className="size-4 text-zinc-500 dark:text-zinc-500" />
                </div>
                <div className="mt-3 grid gap-2">
                  {quickActions.map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={action === 'Edit profile' ? startEditing : undefined}
                      className="inline-flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-white dark:border-neutral-950 dark:bg-black dark:text-zinc-500 dark:hover:border-neutral-950 dark:hover:bg-black cursor-pointer"
                    >
                      <span>{action}</span>
                      <ArrowRight className="size-4 text-zinc-400 dark:text-zinc-600" />
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] dark:border-neutral-950 dark:bg-black dark:shadow-none lg:col-span-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Notifications</h3>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">Recent system notices and updates.</p>
                  </div>
                  <Bell className="size-4 text-zinc-500 dark:text-zinc-500" />
                </div>
                <div className="mt-3 space-y-2">
                  {notifications.map((note) => (
                    <div key={note} className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-neutral-950 dark:bg-black">
                      <div className="flex items-start gap-2">
                        <span className="mt-1 size-2 shrink-0 rounded-full bg-zinc-900 dark:bg-zinc-700" />
                        <div className="text-sm text-zinc-700 dark:text-zinc-500">{note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] dark:border-neutral-950 dark:bg-black dark:shadow-none lg:col-span-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Connected Accounts</h3>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">External services linked to the profile.</p>
                  </div>
                  <Link2 className="size-4 text-zinc-500 dark:text-zinc-500" />
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    { label: 'Clerk', value: 'Connected' },
                    { label: 'GitHub', value: githubValue === 'Not connected' ? 'Not connected' : 'Connected' },
                    { label: 'Phone', value: phoneValue === 'Not set' ? 'Not connected' : 'Connected' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-neutral-950 dark:bg-black">
                      <span className="text-sm text-zinc-600 dark:text-zinc-500">{item.label}</span>
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] dark:border-neutral-950 dark:bg-black dark:shadow-none lg:col-span-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">System Information</h3>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">Dashboard runtime and profile source info.</p>
                  </div>
                  <Server className="size-4 text-zinc-500 dark:text-zinc-500" />
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    { label: 'Platform', value: 'SAM MARKET' },
                    { label: 'Theme', value: 'Dark optimized' },
                    { label: 'Mode', value: editing ? 'Editing' : 'Viewing' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-neutral-950 dark:bg-black">
                      <div className="text-xs uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-500">{item.label}</div>
                      <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">{item.value}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
