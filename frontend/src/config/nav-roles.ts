/**
 * Permission-based navigation config.
 * Each user sees modules based on their permissions (from roles + extra_permissions).
 */
import {
  LayoutDashboard,
  Settings,
  UserCog,
  Wrench,
  ClipboardList,
  FileSearch,
  Shield,
  KanbanSquare,
  Eye,
  FileText,
  type LucideIcon,
} from 'lucide-react'
import type { NavGroup } from '@/components/layout/types'

/** Permission codes from backend */
export const PERMISSIONS = {
  CASES_ACCESS: 'cases.access',
  CASES_APPROVE: 'cases.approve_reports',
  BOARD_ACCESS: 'board.access',
  SURVEILLANCE_ACCESS: 'surveillance.access',
  GENERAL_REPORT_ACCESS: 'general_report.access',
  EVIDENCE_ACCESS: 'evidence.access',
  ADMIN_ACCESS: 'admin.access',
  INTERROGATION_ACCESS: 'interrogation.access',
  INTERROGATION_CAPTAIN_VERDICT: 'interrogation.captain_verdict',
  INTERROGATION_CHIEF_APPROVE: 'interrogation.chief_approve',
} as const

/** Role names - kept for backward compatibility */
export const ROLES = {
  ADMINISTRATOR: 'Administrator',
  ADMIN: 'admin',
  CHIEF: 'Chief',
  CAPTAIN: 'Captain',
  SERGEANT: 'Sergeant',
  DETECTIVE: 'Detective',
  POLICE_OFFICER: 'Police Officer',
  PATROL_OFFICER: 'Patrol Officer',
  CADET: 'Cadet',
  COMPLAINANT: 'Complainant',
  WITNESS: 'Witness',
  SUSPECT: 'Suspect',
  CRIMINAL: 'Criminal',
  JUDGE: 'Judge',
  CORONER: 'Coroner',
  BASE_USER: 'Base user',
} as const

type NavItemConfig = {
  title: string
  url?: string
  icon?: LucideIcon
  items?: { title: string; url: string; icon?: LucideIcon }[]
  /** Permission codes required. Empty = all authenticated. */
  permissions?: string[]
  /** Fallback: roles (used when user has no permissions array from backend) */
  roles?: string[]
}

const NAV_ITEMS: NavItemConfig[] = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  {
    title: 'Submit Complaint',
    url: '/submit-complaint',
    icon: ClipboardList,
    roles: [ROLES.BASE_USER],
  },
  {
    title: 'Submit Tip',
    url: '/tips',
    icon: ClipboardList,
    permissions: [],
    roles: [], // All authenticated
  },
  {
    title: 'Cases & Complaints',
    url: '/cases',
    icon: ClipboardList,
    permissions: [PERMISSIONS.CASES_ACCESS],
  },
  {
    title: 'Interrogations',
    url: '/interrogations',
    icon: FileText,
    permissions: [PERMISSIONS.INTERROGATION_ACCESS],
    roles: [ROLES.SERGEANT, ROLES.DETECTIVE, ROLES.CAPTAIN, ROLES.CHIEF],
  },
  {
    title: 'Bail & Fines',
    url: '/bail',
    icon: FileText,
    roles: [ROLES.SERGEANT, ROLES.SUSPECT],
  },
  {
    title: 'Detective Board',
    url: '/board',
    icon: KanbanSquare,
    permissions: [PERMISSIONS.BOARD_ACCESS],
  },
  {
    title: 'Most Wanted',
    url: '/most-wanted',
    icon: Eye,
    permissions: [], // All authenticated users
    roles: [], // Empty = show for everyone logged in
  },
  {
    title: 'General Report',
    url: '/reports',
    icon: FileText,
    permissions: [PERMISSIONS.GENERAL_REPORT_ACCESS],
  },
  {
    title: 'Evidence',
    url: '/evidence',
    icon: FileSearch,
    permissions: [PERMISSIONS.EVIDENCE_ACCESS],
  },
  {
    title: 'Admin Panel',
    url: '/admin',
    icon: Shield,
    permissions: [PERMISSIONS.ADMIN_ACCESS],
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

function normalizeRole(r: string): string {
  return r.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Build nav groups from user permissions (preferred) or roles (fallback).
 */
export function getNavGroupsForRoles(userRoles: string[], userPermissions?: string[]): NavGroup[] {
  const permsSet = new Set((userPermissions ?? []).map((p) => p.trim()))
  const hasPermission = (code: string) => permsSet.has(code)

  const rolesSet = new Set((userRoles ?? []).map(normalizeRole))
  const hasRole = (name: string) => rolesSet.has(normalizeRole(name))

  const mainItems = NAV_ITEMS.filter((item) => {
    if (item.title === 'Dashboard' || item.title === 'Settings') return true
    if (item.permissions && item.permissions.length > 0) {
      return item.permissions.some(hasPermission)
    }
    if (item.roles && item.roles.length > 0) {
      return item.roles.some(hasRole)
    }
    return true
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
