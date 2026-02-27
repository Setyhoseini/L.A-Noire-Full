/**
 * Cases & Crime Reports API.
 * Types match backend CaseSerializer and CrimeReportSerializer.
 */
import { apiClient } from '@/lib/api-client'

export interface Case {
  id: string
  case_number: string
  title: string
  description: string
  status: string
  priority: string
  precinct: string
  opened_at: string
  closed_at: string | null
  is_archived: boolean
}

export interface CrimeReport {
  id: string
  title: string
  description: string
  occurred_at: string | null
  location: string
  witnesses: unknown
  status: string
  created_at: string
  case: string | null
  assigned_cadet?: string | null
  assigned_cadet_name?: string | null
}

export interface CreateCasePayload {
  title: string
  description?: string
  status?: string
  priority?: string
  precinct?: string
}

export interface CreateCrimeReportPayload {
  title: string
  description?: string
  occurred_at?: string
  location?: string
  witnesses?: unknown
}

export async function getCases(): Promise<Case[]> {
  const { data } = await apiClient.get<Case[]>('/cases/')
  return data
}

export async function getCase(id: string): Promise<Case> {
  const { data } = await apiClient.get<Case>(`/cases/${id}/`)
  return data
}

export async function createCase(payload: CreateCasePayload): Promise<Case> {
  const { data } = await apiClient.post<Case>('/cases/', payload)
  return data
}

export async function updateCase(id: string, payload: Partial<CreateCasePayload>): Promise<Case> {
  const { data } = await apiClient.patch<Case>(`/cases/${id}/`, payload)
  return data
}

export async function getCrimeReports(): Promise<CrimeReport[]> {
  const { data } = await apiClient.get<CrimeReport[]>('/cases/crime-reports/')
  return data
}

export async function createCrimeReport(payload: CreateCrimeReportPayload): Promise<CrimeReport> {
  const { data } = await apiClient.post<CrimeReport>('/cases/crime-reports/', payload)
  return data
}

export async function approveCrimeReport(id: string): Promise<CrimeReport> {
  const { data } = await apiClient.post<CrimeReport>(`/cases/crime-reports/${id}/approve/`)
  return data
}

export async function returnCrimeReport(id: string, reason: string): Promise<CrimeReport> {
  const { data } = await apiClient.post<CrimeReport>(`/cases/crime-reports/${id}/return_report/`, {
    reason,
  })
  return data
}
