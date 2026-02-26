/**
 * Persons API. Used for suspect management.
 */
import { apiClient } from '@/lib/api-client'

export interface Person {
  id: string
  first_name: string
  last_name: string
  dob: string | null
  aliases: unknown
  contact_info: unknown
  person_type: string
  notes: string
  created_at: string
}

export interface CreatePersonPayload {
  first_name: string
  last_name: string
  dob?: string
  person_type?: string
  notes?: string
}

export async function getPersons(): Promise<Person[]> {
  const { data } = await apiClient.get<Person[]>('/cases/persons/')
  return data
}

export async function createPerson(payload: CreatePersonPayload): Promise<Person> {
  const { data } = await apiClient.post<Person>('/cases/persons/', payload)
  return data
}
