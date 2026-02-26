/**
 * Evidence API.
 * Types match backend EvidenceSerializer.
 */
import { apiClient } from '@/lib/api-client'

export interface Evidence {
  id: string
  title: string
  description: string
  evidence_type: string
  collected_at: string | null
  storage_location: string
  status: string
  case: string | null
  related_report: string | null
}

export interface CreateEvidencePayload {
  title: string
  description?: string
  evidence_type?: string
  collected_at?: string
  storage_location?: string
  status?: string
  case?: string
  related_report?: string
}

export async function getEvidence(): Promise<Evidence[]> {
  const { data } = await apiClient.get<Evidence[]>('/evidence/')
  return data
}

export async function createEvidence(payload: CreateEvidencePayload): Promise<Evidence> {
  const { data } = await apiClient.post<Evidence>('/evidence/', payload)
  return data
}
