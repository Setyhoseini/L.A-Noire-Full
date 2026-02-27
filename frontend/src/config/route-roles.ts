/**
 * Route-level authorization. Uses permissions (preferred) or roles (fallback).
 */
import { ROLES, PERMISSIONS } from './nav-roles'

function normalizeRole(r: string): string {
  return r.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function hasAnyRole(userRoles: string[], requiredRoles: string[]): boolean {
  const userSet = new Set(userRoles.map(normalizeRole))
  return requiredRoles.some((r) => userSet.has(normalizeRole(r)))
}

function hasAnyPermission(userPermissions: string[], required: string[]): boolean {
  const userSet = new Set(userPermissions.map((p) => p.trim()))
  return required.some((p) => userSet.has(p))
}

/** Map route path to required permission codes (primary) */
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/board': [PERMISSIONS.BOARD_ACCESS],
  '/most-wanted': [], // All authenticated users
  '/reports': [PERMISSIONS.GENERAL_REPORT_ACCESS],
  '/evidence': [PERMISSIONS.EVIDENCE_ACCESS],
  '/cases': [PERMISSIONS.CASES_ACCESS],
  '/interrogations': [PERMISSIONS.INTERROGATION_ACCESS],
  '/tips': [], // All authenticated
  '/bail': [],
  '/admin': [PERMISSIONS.ADMIN_ACCESS],
}

/** Fallback: required roles when permissions not available */
const ROUTE_ROLES: Record<string, string[]> = {
  '/submit-complaint': [ROLES.BASE_USER],
  '/board': [ROLES.DETECTIVE],
  '/most-wanted': [], // All authenticated - empty = any logged-in user
  '/reports': [ROLES.JUDGE, ROLES.CAPTAIN, ROLES.CHIEF],
  '/evidence': [ROLES.DETECTIVE, ROLES.POLICE_OFFICER, ROLES.PATROL_OFFICER, ROLES.CORONER, ROLES.SERGEANT, ROLES.CAPTAIN],
  '/cases': [ROLES.CADET, ROLES.POLICE_OFFICER, ROLES.PATROL_OFFICER, ROLES.DETECTIVE, ROLES.SERGEANT, ROLES.CAPTAIN, ROLES.CHIEF, ROLES.COMPLAINANT],
  '/interrogations': [ROLES.SERGEANT, ROLES.DETECTIVE, ROLES.CAPTAIN, ROLES.CHIEF],
  '/tips': [], // All authenticated
  '/bail': [ROLES.SERGEANT, ROLES.SUSPECT],
  '/admin': [ROLES.ADMINISTRATOR, ROLES.ADMIN],
}

function getRequiredForPath(pathname: string): { permissions: string[]; roles: string[] } | null {
  const normalized = pathname.replace(/\/$/, '') || '/'
  const perms = ROUTE_PERMISSIONS[normalized]
  const roles = ROUTE_ROLES[normalized]
  if (perms || roles) return { permissions: perms ?? [], roles: roles ?? [] }
  if (pathname.startsWith('/admin')) return { permissions: [PERMISSIONS.ADMIN_ACCESS], roles: ROUTE_ROLES['/admin'] ?? [] }
  if (pathname.startsWith('/board')) return { permissions: [PERMISSIONS.BOARD_ACCESS], roles: ROUTE_ROLES['/board'] ?? [] }
  if (pathname.startsWith('/most-wanted')) return { permissions: [], roles: [] } // All authenticated
  if (pathname.startsWith('/reports')) return { permissions: [PERMISSIONS.GENERAL_REPORT_ACCESS], roles: ROUTE_ROLES['/reports'] ?? [] }
  if (pathname.startsWith('/cases')) return { permissions: [PERMISSIONS.CASES_ACCESS], roles: ROUTE_ROLES['/cases'] ?? [] }
  if (pathname.startsWith('/interrogations')) return { permissions: [PERMISSIONS.INTERROGATION_ACCESS], roles: ROUTE_ROLES['/interrogations'] ?? [] }
  if (pathname.startsWith('/tips')) return { permissions: [], roles: [] }
  if (pathname.startsWith('/bail')) return { permissions: [], roles: ROUTE_ROLES['/bail'] ?? [] }
  if (pathname.startsWith('/evidence')) return { permissions: [PERMISSIONS.EVIDENCE_ACCESS], roles: ROUTE_ROLES['/evidence'] ?? [] }
  if (pathname.startsWith('/settings')) return { permissions: [], roles: [] }
  return null
}

export function getRequiredRolesForPath(pathname: string): string[] | null {
  const req = getRequiredForPath(pathname)
  return req ? req.roles : null
}

export function canAccessRoute(pathname: string, userRoles: string[], userPermissions?: string[]): boolean {
  const required = getRequiredForPath(pathname)
  if (required === null) return true
  if (required.permissions.length === 0 && required.roles.length === 0) return true
  if (userPermissions && userPermissions.length > 0 && required.permissions.length > 0) {
    return hasAnyPermission(userPermissions, required.permissions)
  }
  return hasAnyRole(userRoles, required.roles)
}
