/**
 * Reward Tips API.
 */
import { apiClient } from '@/lib/api-client'

export interface RewardTip {
  id: string
  user: string
  case: string | null
  case_number?: string | null
  suspect: string | null
  suspect_name?: string | null
  content: string
  status: string
  reviewed_by_officer: string | null
  officer_reviewed_at: string | null
  officer_notes: string
  forwarded_to_detective: string | null
  detective_reviewed_at: string | null
  unique_code: string | null
  created_at: string
  updated_at: string
}

export interface CreateTipPayload {
  case?: string
  suspect?: string
  content: string
}

export async function getMyTips(): Promise<RewardTip[]> {
  const { data } = await apiClient.get<RewardTip[]>('/rewards/tips/')
  return data
}

export async function getMySubmittedTips(): Promise<RewardTip[]> {
  const { data } = await apiClient.get<RewardTip[]>('/rewards/tips/', {
    params: { scope: 'mine' },
  })
  return data
}

export async function createTip(payload: CreateTipPayload): Promise<RewardTip> {
  const { data } = await apiClient.post<RewardTip>('/rewards/tips/', payload)
  return data
}

export async function officerReviewTip(
  id: string,
  action: 'reject' | 'forward',
  options?: { notes?: string; detective?: string }
): Promise<RewardTip> {
  const { data } = await apiClient.post<RewardTip>(`/rewards/tips/${id}/officer_review/`, {
    action,
    ...options,
  })
  return data
}

export async function detectiveConfirmTip(id: string): Promise<RewardTip> {
  const { data } = await apiClient.post<RewardTip>(`/rewards/tips/${id}/detective_confirm/`)
  return data
}

export interface LookupResult {
  reward: number
  user: { first_name: string; last_name: string; national_id: string }
  unique_code: string
}

export async function rewardLookup(
  nationalId: string,
  uniqueCode: string
): Promise<LookupResult> {
  const { data } = await apiClient.post<LookupResult>('/rewards/lookup/', {
    national_id: nationalId,
    unique_code: uniqueCode,
  })
  return data
}
