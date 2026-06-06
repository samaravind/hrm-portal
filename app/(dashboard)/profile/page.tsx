'use client'

import { useRef, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { User, Mail, Phone, GitBranch, Crown, Loader2, Edit3, Check, X, Camera } from 'lucide-react'

const inputCls = 'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none transition'

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const employees = useQuery(api.employees.list) ?? []
  const updateEmployee = useMutation(api.employees.updateEmployee)

  const employee = user?.primaryEmailAddress?.emailAddress
    ? employees.find((e) => e.email === user.primaryEmailAddress!.emailAddress)
    : null

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', github: '' })
  const [savedPhone, setSavedPhone] = useState('')
  const [savedEmail, setSavedEmail] = useState('')
  const [savedGithub, setSavedGithub] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingPhoto(true)
    try {
      await user.setProfileImage({ file })
    } catch {
      alert('Failed to upload profile photo.')
    } finally {
      setUploadingPhoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const startEditing = () => {
    const currentPhone = savedPhone || employee?.phone || user?.primaryPhoneNumber?.phoneNumber || ''
    const currentEmail = savedEmail || user?.primaryEmailAddress?.emailAddress || ''
    const githubAccount = user?.externalAccounts?.find((a) => a.provider === 'github')
    const currentGithub = savedGithub || (githubAccount?.username ? `@${githubAccount.username}` : '')
    setForm({
      fullName: user?.fullName || '',
      phone: currentPhone,
      email: currentEmail,
      github: currentGithub,
    })
    setEditing(true)
  }

  const cancelEditing = () => setEditing(false)

  const saveChanges = async () => {
    if (!user) return
    setSaving(true)
    try {
      await user.update({ firstName: form.fullName.split(' ').slice(0, -1).join(' '), lastName: form.fullName.split(' ').pop() || '' })
      if (employee) {
        await updateEmployee({
          id: employee._id,
          fullName: form.fullName,
          email: employee.email,
          employeeId: employee.employeeId,
          phone: form.phone,
          position: employee.position,
          employeeType: employee.employeeType,
          department: employee.department ?? '',
        })
      }
      setEditing(false)
      setSavedPhone(form.phone)
      setSavedEmail(form.email)
      setSavedGithub(form.github)
    } finally {
      setSaving(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (!isSignedIn || !user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <User className="mx-auto size-12 text-zinc-300" />
        <h1 className="mt-4 text-xl font-bold text-zinc-800">Not signed in</h1>
        <p className="mt-2 text-sm text-zinc-500">Sign in to view your profile.</p>
      </div>
    )
  }

  const githubAccount = user.externalAccounts?.find(
    (a) => a.provider === 'github'
  )

  const githubValue = githubAccount?.username
    ? `@${githubAccount.username}`
    : githubAccount
      ? githubAccount.accountIdentifier()
      : null

  const details = [
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
        user.fullName
      ),
      fallback: 'Not set',
    },
    {
      icon: Mail,
      label: 'Email',
      value: editing ? (
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={inputCls}
        />
      ) : (
        savedEmail || user.primaryEmailAddress?.emailAddress
      ),
      fallback: 'Not set',
    },
    {
      icon: Phone,
      label: 'Phone',
      value: editing ? (
        <input
          type="text"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className={inputCls}
          placeholder="Enter phone number"
        />
      ) : (
        savedPhone || employee?.phone || user.primaryPhoneNumber?.phoneNumber
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
          placeholder="@username"
        />
      ) : (
        savedGithub || githubValue
      ),
      fallback: 'Not connected',
    },
  ]

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      {/* Avatar + Name */}
      <div className="text-center">
        <div className="relative mx-auto inline-block">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-zinc-100 transition cursor-pointer disabled:opacity-50"
          >
            {user.imageUrl ? (
              <img src={user.imageUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-zinc-600">
                {user.firstName?.[0]?.toUpperCase() ?? <User className="size-8" />}
              </span>
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100">
              {uploadingPhoto ? (
                <Loader2 className="size-5 animate-spin text-white" />
              ) : (
                <Camera className="size-5 text-white" />
              )}
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
        <h1 className="mt-4 text-2xl font-bold text-zinc-900">
          {user.fullName || 'User'}
        </h1>
        <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
          <Crown className="size-3" />
          {user.publicMetadata?.role === 'admin' ? 'Admin' : 'Staff'}
        </div>
      </div>

      {/* Edit / Save Actions */}
      <div className="mt-6 flex justify-end gap-2">
        {editing ? (
          <>
            <button
              onClick={cancelEditing}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition cursor-pointer"
            >
              <X className="size-4" />
              Cancel
            </button>
            <button
              onClick={saveChanges}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition disabled:opacity-50 cursor-pointer"
            >
              <Check className="size-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        ) : (
          <button
            onClick={startEditing}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition cursor-pointer"
          >
            <Edit3 className="size-4" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Details */}
      <div className="mt-4 space-y-1 overflow-hidden rounded-xl border bg-white shadow-xs">
        {details.map(({ icon: Icon, label, value, fallback }) => (
          <div
            key={label}
            className="flex items-center gap-4 px-5 py-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-50">
              <Icon className="size-5 text-zinc-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                {label}
              </div>
              <div className="mt-0.5 truncate text-sm font-medium text-zinc-800">
                {value || <span className="text-zinc-300">{fallback}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-400">
        SAM MARKET v1.0.0
      </p>
    </div>
  )
}
