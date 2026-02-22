import { LayoutDashboard, Settings, UserCog, Wrench } from 'lucide-react'
import { type SidebarData } from '../types'

/** Minimal nav for L.A. Noire. Role-based items added later. */
export const sidebarData: SidebarData = {
  user: {
    name: '',
    email: '',
    avatar: '',
  },
  teams: [],
  navGroups: [
    {
      title: 'Main',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Settings',
          icon: Settings,
          items: [
            {
              title: 'Profile',
              url: '/settings',
              icon: UserCog,
            },
            {
              title: 'Account',
              url: '/settings/account',
              icon: Wrench,
            },
          ],
        },
      ],
    },
  ],
}
