/**
 * Interrogations API.
 * Types match backend InterrogationSerializer.
 */
import { apiClient } from '@/lib/api-client'

export interface Interrogation {
  id: string
  case: string | null
  case_number?: string
  suspect: string | null
  suspect_name?: string | null
  crime_level?: string
  start_time: string | null
  end_time: string | null
  location: string
  transcript: string
  outcome: string
  notes: string
  guilt_score_sergeant: number | null
  guilt_score_detective: number | null
  sergeant: string | null
  detective: string | null
  captain_verdict: string
  captain: string | null
  chief_approved: boolean | null
  chief: string | null
}

export interface CreateInterrogationPayload {
  case: string
  suspect: string
  start_time?: string
  end_time?: string
  location?: string
  transcript?: string
  outcome?: string
  notes?: string
}

export async function getInterrogations(params?: {
  case?: string
  suspect?: string
  verdict?: string
}): Promise<Interrogation[]> {
  const { data } = await apiClient.get<Interrogation[]>('/cases/interrogations/', {
    params,
  })
  return data
}

export async function getInterrogation(id: string): Promise<Interrogation> {
  const { data } = await apiClient.get<Interrogation>(`/cases/interrogations/${id}/`)
  return data
}

export async function createInterrogation(
  payload: CreateInterrogationPayload
): Promise<Interrogation> {
  const { data } = await apiClient.post<Interrogation>('/cases/interrogations/', payload)
  return data
}

export async function submitGuiltScore(id: string, guiltScore: number): Promise<Interrogation> {
  const { data } = await apiClient.post<Interrogation>(
    `/cases/interrogations/${id}/submit_guilt_score/`,
    { guilt_score: guiltScore }
  )
  return data
}

export async function submitCaptainVerdict(
  id: string,
  verdict: 'guilty' | 'suspected' | 'cleared'
): Promise<Interrogation> {
  const { data } = await apiClient.post<Interrogation>(
    `/cases/interrogations/${id}/submit_captain_verdict/`,
    { verdict }
  )
  return data
}

export async function chiefApprove(id: string, approved: boolean): Promise<Interrogation> {
  const { data } = await apiClient.post<Interrogation>(
    `/cases/interrogations/${id}/chief_approve/`,
    { approved }
  )
  return data
}
