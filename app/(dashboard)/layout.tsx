export const dynamic = 'force-dynamic'

import { CartProvider } from '../../lib/cart-context'
import { DashboardUserSync } from "./dashboard-user-sync"
import { DashboardShell } from "../../components/ui/dashboard-shell"
import type { ReactNode } from 'react'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <DashboardUserSync />
      <DashboardShell>{children}</DashboardShell>
    </CartProvider>
  )
}
