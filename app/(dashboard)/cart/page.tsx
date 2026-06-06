'use client'

import Link from 'next/link'
import { useCart } from '@/lib/cart-context'

export default function CartPage() {
  const { items, total, removeFromCart } = useCart()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">Shopping Cart</h1>
          <p className="text-sm text-zinc-500">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/" className="text-sm font-medium text-[#6c47ff] hover:underline">
          Continue Shopping →
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 py-20">
          <svg className="mb-4 size-16 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          <p className="text-lg font-medium text-zinc-400">Your cart is empty</p>
          <Link href="/" className="mt-4 rounded-lg bg-[#6c47ff] px-6 py-2 text-sm font-medium text-white hover:bg-[#5a3ae0]">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 rounded-xl border p-4">
              <img src={item.image} alt={item.name} className="h-20 w-20 rounded-lg object-cover bg-zinc-100" />
              <div className="flex flex-1 flex-col">
                <h3 className="font-medium text-zinc-800">{item.name}</h3>
                <p className="text-lg font-bold text-zinc-900">₹{item.price}</p>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="rounded-lg px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                Remove
              </button>
            </div>
          ))}

          <div className="rounded-xl border bg-white p-6">
            <div className="flex items-center justify-between text-lg">
              <span className="font-medium text-zinc-600">Total</span>
              <span className="text-2xl font-bold text-zinc-900">₹{total}</span>
            </div>
            <button className="mt-4 w-full rounded-lg bg-[#6c47ff] py-3 text-sm font-semibold text-white hover:bg-[#5a3ae0] transition-colors">
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
