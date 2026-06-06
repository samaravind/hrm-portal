'use client'

import { useCart } from '@/lib/cart-context'

export function CartPanel() {
  const { items, total, open, toggleCart, removeFromCart } = useCart()

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={toggleCart} />
      )}

      <div
        className={`fixed top-0 right-0 z-50 h-full w-80 bg-white shadow-xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <h2 className="text-lg font-semibold text-zinc-800">
            Cart ({items.length})
          </h2>
          <button onClick={toggleCart} className="text-zinc-400 hover:text-zinc-600">
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-20 text-zinc-400">
            <svg className="size-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <p className="text-sm">Your cart is empty</p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-lg border p-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-16 w-16 rounded-md object-cover bg-zinc-100"
                  />
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-zinc-800 line-clamp-1">{item.name}</h3>
                      <p className="text-sm font-semibold text-zinc-900">₹{item.price}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="self-end text-xs text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-zinc-600">Total</span>
                <span className="text-lg font-bold text-zinc-900">₹{total}</span>
              </div>
              <button className="w-full rounded-lg bg-[#6c47ff] py-2.5 text-sm font-semibold text-white hover:bg-[#5a3ae0] transition-colors">
                Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
