/**
 * Route-level role requirements.
 * Used in beforeLoad to enforce authorization.
 */
import { ROLES } from './nav-roles'

function normalizeRole(r: string): string {
  return r.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function hasAnyRole(userRoles: string[], requiredRoles: string[]): boolean {
  const userSet = new Set(userRoles.map(normalizeRole))
  return requiredRoles.some((r) => userSet.has(normalizeRole(r)))
}

/** Map route path to required roles. Empty array = all authenticated. null = no restriction. */
const ROUTE_ROLES: Record<string, string[]> = {
  '/submit-complaint': [ROLES.BASE_USER],
  '/board': [ROLES.DETECTIVE],
  '/most-wanted': [
    ROLES.DETECTIVE,
    ROLES.SERGEANT,
    ROLES.CAPTAIN,
    ROLES.CHIEF,
    ROLES.POLICE_OFFICER,
    ROLES.PATROL_OFFICER,
  ],
  '/reports': [ROLES.JUDGE, ROLES.CAPTAIN, ROLES.CHIEF],
  '/evidence': [
    ROLES.DETECTIVE,
    ROLES.POLICE_OFFICER,
    ROLES.PATROL_OFFICER,
    ROLES.CORONER,
    ROLES.SERGEANT,
    ROLES.CAPTAIN,
  ],
  '/cases': [
    ROLES.CADET,
    ROLES.POLICE_OFFICER,
    ROLES.PATROL_OFFICER,
    ROLES.DETECTIVE,
    ROLES.SERGEANT,
    ROLES.CAPTAIN,
    ROLES.CHIEF,
    ROLES.COMPLAINANT,
  ],
  '/admin': [ROLES.ADMINISTRATOR, ROLES.ADMIN],
}

export function getRequiredRolesForPath(pathname: string): string[] | null {
  const normalized = pathname.replace(/\/$/, '') || '/'
  const exact = ROUTE_ROLES[normalized]
  if (exact) return exact
  if (pathname.startsWith('/submit-complaint')) return ROUTE_ROLES['/submit-complaint'] ?? null
  if (pathname.startsWith('/admin')) return ROUTE_ROLES['/admin'] ?? null
  if (pathname.startsWith('/board')) return ROUTE_ROLES['/board'] ?? null
  if (pathname.startsWith('/most-wanted')) return ROUTE_ROLES['/most-wanted'] ?? null
  if (pathname.startsWith('/reports')) return ROUTE_ROLES['/reports'] ?? null
  if (pathname.startsWith('/cases')) return ROUTE_ROLES['/cases'] ?? null
  if (pathname.startsWith('/evidence')) return ROUTE_ROLES['/evidence'] ?? null
  if (pathname.startsWith('/settings')) return [] // all authenticated
  return null
}

export function canAccessRoute(pathname: string, userRoles: string[]): boolean {
  const required = getRequiredRolesForPath(pathname)
  if (required === null) return true
  if (required.length === 0) return true
  return hasAnyRole(userRoles, required)
}
