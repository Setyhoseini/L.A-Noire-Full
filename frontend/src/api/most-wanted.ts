/**
 * Most Wanted / Under Surveillance API.
 * Returns suspects with status UNDER_PURSUIT or HOT_PURSUIT.
 */
import { apiClient } from '@/lib/api-client'

export interface MostWantedItem {
  id: string
  person_id: string
  person_name: string
  photo_url?: string | null
  case_number: string | null
  status: string
  start_date: string | null
  days_under_pursuit: number
  crime_degree: number | null
  rank: number
  reward: number
  cases: string[]
}

export interface MostWantedResponse {
  items: MostWantedItem[]
}

export async function getMostWanted(): Promise<MostWantedItem[]> {
  const { data } = await apiClient.get<MostWantedResponse>('/rewards/')
  return data.items
}
