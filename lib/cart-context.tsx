'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export type CartItem = {
  id: number
  name: string
  price: number
  image: string
}

type CartContextType = {
  items: CartItem[]
  count: number
  total: number
  open: boolean
  toggleCart: () => void
  addToCart: (item: CartItem) => void
  removeFromCart: (id: number) => void
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [open, setOpen] = useState(false)

  const addToCart = (item: CartItem) => {
    setItems((prev) => {
      if (prev.find((i) => i.id === item.id)) return prev
      return [...prev, item]
    })
  }

  const removeFromCart = (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const toggleCart = () => setOpen((v) => !v)

  const total = items.reduce((sum, item) => sum + item.price, 0)

  return (
    <CartContext.Provider value={{ items, count: items.length, total, open, toggleCart, addToCart, removeFromCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
