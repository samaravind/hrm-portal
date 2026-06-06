'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Plus, Trash2, Pencil, Home, Building2 } from 'lucide-react'

type Address = {
  id: string
  label: 'Home' | 'Work' | 'Other'
  street: string
  city: string
  state: string
  pincode: string
  country: string
  isDefault: boolean
}

const inputCls = 'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none transition'

export default function AddressesPage() {
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: '1',
      label: 'Home',
      street: '123 Main St',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      country: 'India',
      isDefault: true,
    },
  ])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    label: 'Home' as 'Home' | 'Work' | 'Other',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  })

  const startAdd = () => {
    setEditingId(null)
    setForm({ label: 'Home', street: '', city: '', state: '', pincode: '', country: 'India' })
    setShowForm(true)
  }

  const startEdit = (addr: Address) => {
    setEditingId(addr.id)
    setForm({ label: addr.label, street: addr.street, city: addr.city, state: addr.state, pincode: addr.pincode, country: addr.country })
    setShowForm(true)
  }

  const saveAddress = () => {
    if (!form.street || !form.city || !form.state || !form.pincode) return
    if (editingId) {
      setAddresses(addresses.map((a) => a.id === editingId ? { ...a, ...form } : a))
    } else {
      setAddresses([
        ...addresses.map((a) => ({ ...a, isDefault: false })),
        { ...form, id: Date.now().toString(), isDefault: addresses.length === 0 },
      ])
    }
    setForm({ label: 'Home', street: '', city: '', state: '', pincode: '', country: 'India' })
    setShowForm(false)
    setEditingId(null)
  }

  const removeAddress = (id: string) => setAddresses(addresses.filter((a) => a.id !== id))

  const setDefault = (id: string) =>
    setAddresses(addresses.map((a) => ({ ...a, isDefault: a.id === id })))

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <button
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800 transition cursor-pointer"
      >
        <ArrowLeft className="size-4" />
        Back to Settings
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-800">Addresses</h1>
        <button
          onClick={() => startAdd()}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition cursor-pointer"
        >
          <Plus className="size-4" />
          Add Address
        </button>
      </div>

      <div className="space-y-3">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className="relative rounded-xl border border-zinc-200 bg-white px-4 py-4 shadow-xs"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {addr.label === 'Home' ? (
                    <Home className="size-5 text-zinc-400" />
                  ) : (
                    <Building2 className="size-5 text-zinc-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-800">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Default</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">
                    {addr.street}, {addr.city}, {addr.state} – {addr.pincode}
                  </p>
                  <p className="text-xs text-zinc-400">{addr.country}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => startEdit(addr)} className="text-zinc-400 hover:text-zinc-700 transition cursor-pointer">
                  <Pencil className="size-4" />
                </button>
                {!addr.isDefault && (
                  <button
                    onClick={() => setDefault(addr.id)}
                    className="rounded border border-zinc-200 px-2 py-1 text-[10px] font-semibold text-zinc-500 hover:bg-zinc-50 transition cursor-pointer"
                  >
                    Set Default
                  </button>
                )}
                <button onClick={() => removeAddress(addr.id)} className="text-rose-500 hover:text-rose-700 transition cursor-pointer">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {addresses.length === 0 && !showForm && (
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-12 text-center shadow-xs">
            <MapPin className="mx-auto size-8 text-zinc-300" />
            <p className="mt-2 text-sm text-zinc-400">No addresses saved yet.</p>
          </div>
        )}
      </div>

      {/* Add Address Form */}
      {showForm && (
        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-zinc-800">{editingId ? 'Edit Address' : 'New Address'}</h2>

          <div className="flex gap-2">
            {(['Home', 'Work', 'Other'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setForm({ ...form, label: l })}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  form.label === l
                    ? 'border-zinc-900 bg-zinc-900 text-white'
                    : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
                }`}
              >
                {l === 'Home' ? <Home className="size-3.5 inline mr-1" /> : l === 'Work' ? <Building2 className="size-3.5 inline mr-1" /> : null}
                {l}
              </button>
            ))}
          </div>

          <input type="text" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} placeholder="Street / House No." className={inputCls} />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className={inputCls} />
            <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="Pincode" className={inputCls} />
            <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Country" className={inputCls} />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={saveAddress}
              disabled={!form.street || !form.city || !form.state || !form.pincode}
              className="flex-1 rounded-lg bg-zinc-950 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition disabled:opacity-50 cursor-pointer"
            >
              {editingId ? 'Update Address' : 'Save Address'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
