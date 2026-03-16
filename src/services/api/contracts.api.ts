import { apiFetch } from '@/services/http'

export type Contract = {
  id: string
  adminId: string
  clientId: string
  locationId: string | null
  templateId: string | null
  statut: 'pending_signature' | 'signed' | 'draft'
  pdfUrl: string | null
  payload: Record<string, unknown> | null
  hashContenu: string | null
  signeLe: string | null
  creeLe: string
  misAJourLe: string
}

export async function listContracts(clientId?: string): Promise<Contract[]> {
  const query = clientId ? `?clientId=${encodeURIComponent(clientId)}` : ''
  return apiFetch<Contract[]>(`/contracts${query}`)
}

type GeneratePayload = {
  clientId: string
  templateId?: string | null
  locationId?: string | null
  donnees?: Record<string, unknown>
}

export async function generateContract(payload: GeneratePayload): Promise<Contract> {
  return apiFetch<Contract>('/contracts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function signContract(id: string, signatures?: Record<string, unknown>): Promise<Contract> {
  return apiFetch<Contract>('/contracts', {
    method: 'PUT',
    body: JSON.stringify({ id, signatures }),
  })
}
