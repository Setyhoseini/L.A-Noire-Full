/**
 * Role-based navigation config per PDF.
 * Each role sees only the modules they're allowed to access.
 */
import {
  LayoutDashboard,
  Settings,
  UserCog,
  Wrench,
  ClipboardList,
  Users,
  FileSearch,
  Shield,
  KanbanSquare,
  Eye,
  FileText,
  type LucideIcon,
} from 'lucide-react'
import type { NavGroup } from '@/components/layout/types'

/**
 * Role names. Backend may return PDF names or ROLE_CHOICES: admin, detective, officer, clerk, prosecutor, judge.
 */
export const ROLES = {
  ADMINISTRATOR: 'Administrator',
  ADMIN: 'admin',
  CHIEF: 'Chief',
  CAPTAIN: 'Captain',
  SERGEANT: 'Sergeant',
  DETECTIVE: 'Detective',
  POLICE_OFFICER: 'Police Officer',
  PATROL_OFFICER: 'Patrol Officer',
  OFFICER: 'officer',
  CADET: 'Cadet',
  CLERK: 'clerk',
  COMPLAINANT: 'Complainant',
  WITNESS: 'Witness',
  SUSPECT: 'Suspect',
  CRIMINAL: 'Criminal',
  JUDGE: 'Judge',
  PROSECUTOR: 'prosecutor',
  CORONER: 'Coroner',
  BASE_USER: 'Base user',
} as const

type NavItemConfig = {
  title: string
  url?: string
  icon?: LucideIcon
  items?: { title: string; url: string; icon?: LucideIcon }[]
  /** Roles that can see this item. Empty = all authenticated. */
  roles?: string[]
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    title: 'Dashboard',
    url: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Cases & Complaints',
    url: '/cases',
    icon: ClipboardList,
    roles: [
      ROLES.CADET,
      ROLES.POLICE_OFFICER,
      ROLES.PATROL_OFFICER,
      ROLES.DETECTIVE,
      ROLES.SERGEANT,
      ROLES.CAPTAIN,
      ROLES.CHIEF,
      ROLES.COMPLAINANT,
      ROLES.OFFICER,
      ROLES.CLERK,
    ],
  },
  {
    title: 'Detective Board',
    url: '/board',
    icon: KanbanSquare,
    roles: [ROLES.DETECTIVE],
  },
  {
    title: 'Under Surveillance',
    url: '/most-wanted',
    icon: Eye,
    roles: [
      ROLES.DETECTIVE,
      ROLES.SERGEANT,
      ROLES.CAPTAIN,
      ROLES.CHIEF,
      ROLES.POLICE_OFFICER,
      ROLES.PATROL_OFFICER,
      ROLES.OFFICER,
    ],
  },
  {
    title: 'General Report',
    url: '/reports',
    icon: FileText,
    roles: [ROLES.JUDGE, ROLES.CAPTAIN, ROLES.CHIEF, ROLES.PROSECUTOR],
  },
  {
    title: 'Evidence',
    url: '/evidence',
    icon: FileSearch,
    roles: [
      ROLES.DETECTIVE,
      ROLES.POLICE_OFFICER,
      ROLES.PATROL_OFFICER,
      ROLES.CORONER,
      ROLES.SERGEANT,
      ROLES.CAPTAIN,
      ROLES.OFFICER,
      ROLES.CLERK,
    ],
  },
  {
    title: 'Admin Panel',
    url: '/admin',
    icon: Shield,
    roles: [ROLES.ADMINISTRATOR, ROLES.ADMIN],
  },
  {
    title: 'Settings',
    icon: Settings,
    items: [
      { title: 'Profile', url: '/settings', icon: UserCog },
      { title: 'Account', url: '/settings/account', icon: Wrench },
    ],
  },
]

/**
 * Normalize role name for matching. Backend may return "admin", "Admin", "Base user", etc.
 */
function normalizeRole(r: string): string {
  return r.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Build nav groups for the given user roles.
 * Base user sees only Dashboard and Settings.
 * Handles backend role name variations (admin/Administrator, etc.).
 */
export function getNavGroupsForRoles(userRoles: string[]): NavGroup[] {
  const rolesSet = new Set(userRoles.map(normalizeRole))
  const hasRole = (name: string) => rolesSet.has(normalizeRole(name))

  const mainItems = NAV_ITEMS.filter((item) => {
    if (item.title === 'Dashboard' || item.title === 'Settings') return true
    if (!item.roles || item.roles.length === 0) return true
    return item.roles.some(hasRole)
  })

  const navItems = mainItems.map((item) => {
    if (item.items) {
      return {
        title: item.title,
        icon: item.icon,
        items: item.items.map((sub) => ({
          title: sub.title,
          url: sub.url,
          icon: sub.icon,
        })),
      }
    }
    return {
      title: item.title,
      url: item.url,
      icon: item.icon,
    }
  })

  return [
    {
      title: 'Main',
      items: navItems,
    },
  ]
}
