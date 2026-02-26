/**
 * Dashboard API - stats per PDF: solved cases, employees, active cases.
 */
import { apiClient } from '@/lib/api-client'

export interface DashboardStats {
  solved_cases: number
  employees: number
  active_cases: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>('/accounts/dashboard/stats/')
  return data
}
