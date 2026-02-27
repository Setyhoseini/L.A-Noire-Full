/**
 * Admin API - roles, permissions, users management.
 */
import { apiClient } from '@/lib/api-client'

/** Permission from backend */
export interface Permission {
  code: string
  label_fa: string
  label_en: string
  description: string
}

/** Role from backend */
export interface Role {
  id: number
  name: string
  description: string
  permissions: string[]
}

/** User (admin view) with role_ids and extra_permissions */
export interface AdminUser {
  id: number
  username: string
  email: string
  phone_number: string | null
  national_id: string | null
  first_name: string
  last_name: string
  badge_number?: string
  rank?: string
  precinct?: string
  roles: string[]
  permissions: string[]
  role_ids: number[]
  extra_permissions: string[]
}

/**
 * Fetch all available permissions.
 */
export async function getPermissions(): Promise<Permission[]> {
  const { data } = await apiClient.get<Permission[]>('/accounts/permissions/')
  return data
}

/**
 * Fetch all roles.
 */
export async function getRoles(): Promise<Role[]> {
  const { data } = await apiClient.get<Role[]>('/accounts/roles/')
  return data
}

/**
 * Update a role (including permissions).
 */
export async function updateRole(id: number, payload: Partial<Pick<Role, 'name' | 'description' | 'permissions'>>): Promise<Role> {
  const { data } = await apiClient.patch<Role>(`/accounts/roles/${id}/`, payload)
  return data
}

/**
 * Create a new role.
 */
export async function createRole(payload: Pick<Role, 'name' | 'description' | 'permissions'>): Promise<Role> {
  const { data } = await apiClient.post<Role>('/accounts/roles/', payload)
  return data
}

/**
 * Delete a role.
 */
export async function deleteRole(id: number): Promise<void> {
  await apiClient.delete(`/accounts/roles/${id}/`)
}

/**
 * Fetch all users (admin only).
 */
export async function getUsers(): Promise<AdminUser[]> {
  const { data } = await apiClient.get<AdminUser[]>('/accounts/users/')
  return data
}

/**
 * Fetch a single user (admin only).
 */
export async function getUser(id: number): Promise<AdminUser> {
  const { data } = await apiClient.get<AdminUser>(`/accounts/users/${id}/`)
  return data
}

/**
 * Assign roles and optional extra permissions to a user.
 */
export async function assignUserRoles(
  userId: number,
  roleIds: number[],
  extraPermissions?: string[]
): Promise<AdminUser> {
  const payload: { role_ids: number[]; extra_permissions?: string[] } = { role_ids: roleIds }
  if (extraPermissions !== undefined) {
    payload.extra_permissions = extraPermissions
  }
  const { data } = await apiClient.post<AdminUser>(`/accounts/users/${userId}/assign_roles/`, payload)
  return data
}
