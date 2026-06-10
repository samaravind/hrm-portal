import type { LucideIcon } from 'lucide-react'
import { House, Cog, CalendarCheck2, Users, UserCheck2, ClipboardCheck, CalendarRange } from 'lucide-react'

export type NavItem = {
  title: string
  url: string
  icon: LucideIcon
}

const adminNavItems: NavItem[] = [
  { title: 'Dashboard', url: '/', icon: House },
  { title: 'Employees', url: '/employee', icon: Users },
  { title: 'My Attendance', url: '/my-attendance', icon: UserCheck2 },
  { title: 'Employee Attendance', url: '/attendance', icon: CalendarCheck2 },
  { title: 'Approval', url: '/approvals', icon: ClipboardCheck },
  { title: 'Settings', url: '/settings', icon: Cog },
]

const staffNavItems: NavItem[] = [
  { title: 'Dashboard', url: '/staff-dashboard', icon: House },
  { title: 'My Attendance', url: '/my-attendance', icon: CalendarCheck2 },
  { title: 'Leave', url: '/leave', icon: CalendarRange },
  { title: 'Settings', url: '/settings', icon: Cog },
]

export function getNavItems(isAdmin: boolean) {
  return isAdmin ? adminNavItems : staffNavItems
}
