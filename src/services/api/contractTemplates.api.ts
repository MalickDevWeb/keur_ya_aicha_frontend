import { apiFetch } from '@/services/http'

export type ContractTemplate = {
  id: string
  adminId: string
  nom: string
  corps: string
  placeholders: Record<string, unknown> | null
  version: number
  creeLe: string
  misAJourLe: string
}

type TemplatePayload = Partial<Pick<ContractTemplate, 'id' | 'nom' | 'corps' | 'placeholders'>>

export async function listContractTemplates(): Promise<ContractTemplate[]> {
  return apiFetch<ContractTemplate[]>('/contract-templates')
}

export async function createContractTemplate(payload: TemplatePayload): Promise<ContractTemplate> {
  return apiFetch<ContractTemplate>('/contract-templates', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateContractTemplate(payload: TemplatePayload): Promise<ContractTemplate> {
  return apiFetch<ContractTemplate>('/contract-templates', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteContractTemplate(id: string): Promise<void> {
  await apiFetch<void>('/contract-templates', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  })
}
