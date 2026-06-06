import type { LucideIcon } from 'lucide-react'
import { House, Cog, CalendarCheck2, Users, User, UserCheck2 } from 'lucide-react'

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
  { title: 'Settings', url: '/settings', icon: Cog },
]

const staffNavItems: NavItem[] = [
  { title: 'Dashboard', url: '/staff-dashboard', icon: House },
  { title: 'My Attendance', url: '/my-attendance', icon: CalendarCheck2 },
  { title: 'Profile', url: '/profile', icon: User },
  { title: 'Settings', url: '/settings', icon: Cog },
]

export function getNavItems(isAdmin: boolean) {
  return isAdmin ? adminNavItems : staffNavItems
}
