"use client"

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import Image from 'next/image'
import { useMutation, useQuery } from 'convex/react'
import { useUser } from '@clerk/nextjs'
import { api } from '@/convex/_generated/api'
import { Mail, Phone, User, GitBranch, Crown, Pencil, Check, X } from 'lucide-react'
import { toast } from 'sonner'

const inputCls =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/25 focus:bg-white/8'

const sanitizePhoneInput = (value: string) => value.replace(/\D/g, '').slice(0, 10)

const normalizeStoredPhone = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits.length > 10 ? digits.slice(-10) : digits
}

export function ProfilePage() {
  const { user, isLoaded } = useUser()
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
  const roleLabel = viewer?.role === 'admin' || user?.publicMetadata?.role === 'admin' ? 'Admin' : 'Staff'
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
            <div className="text-xs font-medium text-white/35">
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

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1240px] flex-col px-3 py-2 sm:px-4">
        <main className="flex-1 rounded-[16px] border border-white/5 bg-[#0a0a0a] px-4 py-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:px-5 sm:py-5">
          <div className="mx-auto max-w-[620px]">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={uploadingPhoto || !isLoaded || !user}
                  className="group relative flex h-18 w-18 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 shadow-[0_18px_40px_rgba(0,0,0,0.4)] transition hover:border-white/20 hover:bg-white/8 disabled:cursor-not-allowed sm:h-20 sm:w-20"
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
                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-white via-white to-white/75 text-xs font-black tracking-[0.28em] text-black sm:text-sm">
                      SM
                    </div>
                  )}
                  <div className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-black/65 text-[9px] font-bold text-white shadow-lg">
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

              <h2 className="mt-3 text-[clamp(1.2rem,2.6vw,1.9rem)] font-semibold tracking-tight text-white">
                {displayName}
              </h2>

              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/6 px-2.5 py-0.75 text-[10px] font-medium text-white/85">
                <Crown className="size-2.5 text-white/70" />
                {roleLabel}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              {editing ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/8 cursor-pointer"
                  >
                    <X className="size-4" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveChanges}
                    disabled={saving || !isLoaded || viewer === undefined}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/12 px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_30px_rgba(255,255,255,0.08)] transition hover:border-white/25 hover:bg-white/18 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                  >
                    <Check className="size-4 text-current" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startEditing}
                  disabled={!isLoaded || !user || viewer === undefined}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/4 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-white/8 cursor-pointer"
                >
                  <Pencil className="size-4" />
                  Edit Profile
                </button>
              )}
            </div>

            {saveError && (
              <p className="mt-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {saveError}
              </p>
            )}

            <div className="mt-4 overflow-hidden rounded-[20px] border border-white/8 bg-[#121212] shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
              <div className="divide-y divide-white/6">
                {detailRows.map(({ icon: Icon, label, value, fallback }) => (
                  <div key={label} className="flex items-start gap-3 px-4 py-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/5">
                      <Icon className="size-4 text-white/65" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/55">
                        {label}
                      </div>
                      <div className="mt-1 text-base font-medium text-white">
                        {value || <span className="text-white/30">{fallback}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-6 text-center text-[10px] tracking-[0.24em] text-white/40">
              SAM MARKET v1.0.0
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
