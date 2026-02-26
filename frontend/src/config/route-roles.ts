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
  '/board': [ROLES.DETECTIVE],
  '/most-wanted': [
    ROLES.DETECTIVE,
    ROLES.SERGEANT,
    ROLES.CAPTAIN,
    ROLES.CHIEF,
    ROLES.POLICE_OFFICER,
    ROLES.PATROL_OFFICER,
    ROLES.OFFICER,
  ],
  '/reports': [ROLES.JUDGE, ROLES.CAPTAIN, ROLES.CHIEF, ROLES.PROSECUTOR],
  '/evidence': [
    ROLES.DETECTIVE,
    ROLES.POLICE_OFFICER,
    ROLES.PATROL_OFFICER,
    ROLES.CORONER,
    ROLES.SERGEANT,
    ROLES.CAPTAIN,
    ROLES.OFFICER,
    ROLES.CLERK,
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
    ROLES.OFFICER,
    ROLES.CLERK,
  ],
  '/admin': [ROLES.ADMINISTRATOR, ROLES.ADMIN],
}

export function getRequiredRolesForPath(pathname: string): string[] | null {
  const exact = ROUTE_ROLES[pathname]
  if (exact) return exact
  if (pathname.startsWith('/admin')) return ROUTE_ROLES['/admin'] ?? null
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
