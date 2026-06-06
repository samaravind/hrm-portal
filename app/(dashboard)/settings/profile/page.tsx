'use client'

import { useQuery } from 'convex/react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { api } from '@/convex/_generated/api'
import { ArrowLeft, User, Mail, Phone } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useUser()
  const viewer = useQuery(api.users.viewer)
  const employees = useQuery(api.employees.list) ?? []

  const employee = viewer?.email
    ? employees.find((e) => e.email === viewer.email)
    : null

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <button
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800 transition cursor-pointer"
      >
        <ArrowLeft className="size-4" />
        Back to Settings
      </button>

      <h1 className="mb-6 text-2xl font-bold text-zinc-800">Profile</h1>

      <div className="space-y-1 overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-600">
            {viewer?.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-800">{viewer?.name || user?.fullName || '—'}</p>
            <p className="text-xs text-zinc-400">{viewer?.role === 'admin' ? 'Admin' : 'Staff'}</p>
          </div>
        </div>

        <div className="border-t border-zinc-100" />

        <div className="px-4 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <User className="size-5 text-zinc-400 shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Name</p>
              <p className="text-sm font-medium text-zinc-800">{viewer?.name || user?.fullName || '—'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Mail className="size-5 text-zinc-400 shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Email</p>
              <p className="text-sm font-medium text-zinc-800">{viewer?.email || user?.primaryEmailAddress?.emailAddress || '—'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="size-5 text-zinc-400 shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Phone</p>
              <p className="text-sm font-medium text-zinc-800">{employee?.phone || user?.primaryPhoneNumber?.phoneNumber || '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
