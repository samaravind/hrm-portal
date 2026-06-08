'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, CreditCard, Plus, Smartphone, Trash2 } from 'lucide-react'

type UpiId = { id: string; value: string }
type Card = { id: string; name: string; number: string; expiry: string; cvv: string }
type Bank = { id: string; accountName: string; accountNumber: string; ifsc: string; bankName: string }

const inputCls =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none transition dark:border-zinc-900 dark:bg-black dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-700'

export default function PaymentsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'upi' | 'card' | 'bank'>('upi')
  const [upis, setUpis] = useState<UpiId[]>([{ id: '1', value: 'sam@paytm' }])
  const [newUpi, setNewUpi] = useState('')
  const [cards, setCards] = useState<Card[]>([])
  const [newCard, setNewCard] = useState({ name: '', number: '', expiry: '', cvv: '' })
  const [banks, setBanks] = useState<Bank[]>([])
  const [newBank, setNewBank] = useState({ accountName: '', accountNumber: '', ifsc: '', bankName: '' })

  const addUpi = () => {
    if (!newUpi.trim()) return
    setUpis([...upis, { id: Date.now().toString(), value: newUpi.trim() }])
    setNewUpi('')
  }

  const addCard = () => {
    if (!newCard.name || !newCard.number || !newCard.expiry) return
    setCards([...cards, { ...newCard, id: Date.now().toString() }])
    setNewCard({ name: '', number: '', expiry: '', cvv: '' })
  }

  const addBank = () => {
    if (!newBank.accountName || !newBank.accountNumber || !newBank.ifsc || !newBank.bankName) return
    setBanks([...banks, { ...newBank, id: Date.now().toString() }])
    setNewBank({ accountName: '', accountNumber: '', ifsc: '', bankName: '' })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 text-zinc-900 dark:text-white">
      <button
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-zinc-800 cursor-pointer dark:text-zinc-400 dark:hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Back to Settings
      </button>

      <h1 className="mb-6 text-2xl font-bold text-zinc-800 dark:text-white">Payments</h1>

      <div className="mb-6 flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-950">
        {([
          { key: 'upi', label: 'UPI', icon: Smartphone },
          { key: 'card', label: 'Cards', icon: CreditCard },
          { key: 'bank', label: 'Bank', icon: Building2 },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition cursor-pointer ${
              tab === key
                ? 'bg-white text-zinc-900 shadow-xs dark:bg-black dark:text-white'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {tab === 'upi' && (
          <>
            {upis.map((upi) => (
              <div
                key={upi.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-xs dark:border-zinc-900 dark:bg-black"
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="size-5 text-zinc-400 dark:text-zinc-500" />
                  <span className="text-sm font-medium text-zinc-800 dark:text-white">{upi.value}</span>
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
                    Default
                  </span>
                </div>
                <button
                  onClick={() => setUpis(upis.filter((u) => u.id !== upi.id))}
                  className="text-zinc-400 transition hover:text-zinc-700 cursor-pointer dark:text-zinc-500 dark:hover:text-white"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}

            <div className="flex gap-2">
              <input
                type="text"
                value={newUpi}
                onChange={(e) => setNewUpi(e.target.value)}
                placeholder="Enter UPI ID (e.g. name@paytm)"
                className={inputCls}
              />
              <button
                onClick={addUpi}
                disabled={!newUpi.trim()}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50 dark:border-zinc-900 dark:bg-black dark:text-white dark:hover:bg-zinc-950"
              >
                <Plus className="size-4" />
                Add
              </button>
            </div>
          </>
        )}

        {tab === 'card' && (
          <>
            {cards.map((card) => (
              <div
                key={card.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-xs dark:border-zinc-900 dark:bg-black"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="size-5 text-zinc-400 dark:text-zinc-500" />
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-white">{card.name}</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">•••• {card.number.slice(-4)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setCards(cards.filter((c) => c.id !== card.id))}
                  className="text-zinc-400 transition hover:text-zinc-700 cursor-pointer dark:text-zinc-500 dark:hover:text-white"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}

            <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-900 dark:bg-black">
              <input
                type="text"
                value={newCard.name}
                onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                placeholder="Cardholder Name"
                className={inputCls}
              />
              <input
                type="text"
                value={newCard.number}
                onChange={(e) => setNewCard({ ...newCard, number: e.target.value })}
                placeholder="Card Number"
                className={inputCls}
                maxLength={16}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newCard.expiry}
                  onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
                  placeholder="Expiry (MM/YY)"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={newCard.cvv}
                  onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })}
                  placeholder="CVV"
                  className={inputCls}
                  maxLength={4}
                />
              </div>
              <button
                onClick={addCard}
                disabled={!newCard.name || !newCard.number || !newCard.expiry}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50 dark:border-zinc-900 dark:bg-black dark:text-white dark:hover:bg-zinc-950"
              >
                <Plus className="size-4" />
                Add Card
              </button>
            </div>
          </>
        )}

        {tab === 'bank' && (
          <>
            {banks.map((bank) => (
              <div
                key={bank.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-xs dark:border-zinc-900 dark:bg-black"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="size-5 text-zinc-400 dark:text-zinc-500" />
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-white">{bank.accountName}</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {bank.bankName} • {bank.accountNumber.slice(-4)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setBanks(banks.filter((b) => b.id !== bank.id))}
                  className="text-zinc-400 transition hover:text-zinc-700 cursor-pointer dark:text-zinc-500 dark:hover:text-white"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}

            <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-900 dark:bg-black">
              <input
                type="text"
                value={newBank.accountName}
                onChange={(e) => setNewBank({ ...newBank, accountName: e.target.value })}
                placeholder="Account Holder Name"
                className={inputCls}
              />
              <input
                type="text"
                value={newBank.accountNumber}
                onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
                placeholder="Account Number"
                className={inputCls}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newBank.ifsc}
                  onChange={(e) => setNewBank({ ...newBank, ifsc: e.target.value })}
                  placeholder="IFSC Code"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={newBank.bankName}
                  onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                  placeholder="Bank Name"
                  className={inputCls}
                />
              </div>
              <button
                onClick={addBank}
                disabled={!newBank.accountName || !newBank.accountNumber || !newBank.ifsc || !newBank.bankName}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50 dark:border-zinc-900 dark:bg-black dark:text-white dark:hover:bg-zinc-950"
              >
                <Plus className="size-4" />
                Add Bank
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
