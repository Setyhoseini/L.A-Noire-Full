/**
 * General Report API.
 * Trials and aggregate stats for Judge, Captain, Chief, Prosecutor.
 */
import { apiClient } from '@/lib/api-client'

export interface Trial {
  id: string
  case: string
  case_number: string | null
  start_date: string | null
  end_date: string | null
  verdict: string
  notes: string
  court_room: string
  witnesses: string[]
}

export interface GeneralReportStats {
  solved_cases: number
  employees: number
  active_cases: number
}

export async function getTrials(): Promise<Trial[]> {
  const { data } = await apiClient.get<Trial[]>('/trials/')
  return data
}

export async function getGeneralReportStats(): Promise<GeneralReportStats> {
  const { data } = await apiClient.get<GeneralReportStats>('/accounts/dashboard/stats/')
  return data
}
