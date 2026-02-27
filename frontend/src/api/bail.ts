/**
 * Bail and Fine Payment API.
 */
import { apiClient } from '@/lib/api-client'

export interface BailPayment {
  id: string
  suspect: string
  suspect_name?: string
  case_number?: string
  amount: string
  payment_type: 'bail' | 'fine'
  status: string
  sergeant: string | null
  approved_at: string | null
  payment_gateway_ref: string
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateBailPayload {
  suspect: string
  amount: number
  payment_type: 'bail' | 'fine'
}

export async function getBailPayments(): Promise<BailPayment[]> {
  const { data } = await apiClient.get<BailPayment[]>('/payments/bail/')
  return data
}

export async function createBailPayment(payload: CreateBailPayload): Promise<BailPayment> {
  const { data } = await apiClient.post<BailPayment>('/payments/bail/', payload)
  return data
}

export async function approveBailPayment(id: string): Promise<BailPayment> {
  const { data } = await apiClient.post<BailPayment>(`/payments/bail/${id}/approve/`)
  return data
}

export async function initiateBailPayment(id: string): Promise<{
  payment_url: string
  message: string
  reference: string
}> {
  const { data } = await apiClient.post<{
    payment_url: string
    message: string
    reference: string
  }>(`/payments/bail/${id}/initiate_payment/`)
  return data
}
