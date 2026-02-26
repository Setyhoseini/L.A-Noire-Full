/**
 * Detective Board API.
 * Cases and evidence for detectives to link.
 */
import { apiClient } from '@/lib/api-client'

export interface BoardCase {
  id: string
  case_number: string
  title: string
  status: string
}

export interface BoardEvidence {
  id: string
  title: string
  evidence_type: string
  case_id: string | null
}

export interface BoardOverview {
  cases: BoardCase[]
  evidence: BoardEvidence[]
}

export async function getBoardOverview(): Promise<BoardOverview> {
  const { data } = await apiClient.get<BoardOverview>('/board/')
  return data
}
