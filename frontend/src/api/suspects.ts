/**
 * Suspects API. Link Person to Case with status.
 */
import { apiClient } from '@/lib/api-client'

export interface Suspect {
  id: string
  person: string
  person_name: string
  case: string
  case_number: string
  status: string
  start_date: string | null
  last_status_update: string | null
  crime_degree: number | null
  days_under_pursuit?: number
}

export interface CreateSuspectPayload {
  person: string
  case: string
  status?: string
  start_date?: string
  crime_degree?: number
}

export async function getSuspects(): Promise<Suspect[]> {
  const { data } = await apiClient.get<Suspect[]>('/cases/suspects/')
  return data
}

export async function createSuspect(payload: CreateSuspectPayload): Promise<Suspect> {
  const { data } = await apiClient.post<Suspect>('/cases/suspects/', payload)
  return data
}

export async function updateSuspectStatus(id: string, status: string): Promise<Suspect> {
  const { data } = await apiClient.post<Suspect>(`/cases/suspects/${id}/update_status/`, {
    status,
  })
  return data
}
