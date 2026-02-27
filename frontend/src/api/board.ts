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
  description: string
}

export interface BoardOverview {
  cases: BoardCase[]
}

export interface CaseBoardData {
  case: BoardCase
  evidence: BoardEvidence[]
  nodes: BoardNode[]
  edges: BoardEdge[]
}

export interface BoardNode {
  id: string
  type?: string
  position: { x: number; y: number }
  data: Record<string, unknown>
}

export interface BoardEdge {
  id: string
  source: string
  target: string
}

export async function getBoardOverview(): Promise<BoardOverview> {
  const { data } = await apiClient.get<BoardOverview>('/board/')
  return data
}

export async function getCaseBoard(caseId: string): Promise<CaseBoardData> {
  const { data } = await apiClient.get<CaseBoardData>(`/board/cases/${caseId}/`)
  return data
}

export async function saveCaseBoard(
  caseId: string,
  nodes: BoardNode[],
  edges: BoardEdge[]
): Promise<{ nodes: BoardNode[]; edges: BoardEdge[] }> {
  const { data } = await apiClient.patch<{ nodes: BoardNode[]; edges: BoardEdge[] }>(
    `/board/cases/${caseId}/save/`,
    { nodes, edges }
  )
  return data
}
