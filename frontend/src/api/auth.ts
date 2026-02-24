/**
 * Auth API - login, register, profile.
 * Types match backend UserSerializer and JWT response.
 * Backend User: username, email, phone_number, national_id, first_name, last_name, roles.
 */
import { apiClient } from '@/lib/api-client'

/** User shape from backend UserSerializer */
export interface User {
  id: number
  username: string
  email: string
  phone_number: string | null
  national_id: string | null
  first_name: string
  last_name: string
  roles: string[]
}

/** Login response from JWT endpoint */
export interface LoginResponse {
  access: string
  refresh: string
  user: User
}

/** Registration payload - field names match backend */
export interface RegisterPayload {
  username: string
  email: string
  phone_number: string
  national_id: string
  first_name: string
  last_name: string
  password: string
}

/**
 * Login with identifier (username, email, phone_number, or national_id) and password.
 */
export async function login(
  identifier: string,
  password: string
): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/accounts/login/', {
    identifier,
    password,
  })
  return data
}

/**
 * Register a new user. Returns created user. Admin assigns other roles later.
 */
export async function register(payload: RegisterPayload): Promise<User> {
  const { data } = await apiClient.post<User>('/accounts/register/', payload)
  return data
}

/**
 * Get current user profile. Requires valid JWT.
 */
export async function getProfile(): Promise<User> {
  const { data } = await apiClient.get<User>('/accounts/profile/')
  return data
}
