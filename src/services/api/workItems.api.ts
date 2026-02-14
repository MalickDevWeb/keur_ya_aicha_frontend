import type { WorkItemDTO } from '@/dto/backend/responses/WorkItemDTO'
import { apiFetch } from '../http'

/**
 * Récupère la liste complète des items de travail
 * @returns Array d'items de travail
 */
export async function listWorkItems(): Promise<WorkItemDTO[]> {
  return apiFetch<WorkItemDTO[]>('/work_items')
}

/**
 * Crée un nouvel item de travail
 * @param data - Données de l'item à créer
 * @returns Item créé
 */
export async function createWorkItem(data: Partial<WorkItemDTO>): Promise<WorkItemDTO> {
  return apiFetch<WorkItemDTO>('/work_items', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Met à jour un item de travail existant
 * @param id - ID de l'item
 * @param data - Données à mettre à jour
 * @returns Item mis à jour
 */
export async function updateWorkItem(id: string, data: Partial<WorkItemDTO>): Promise<WorkItemDTO> {
  return apiFetch<WorkItemDTO>(`/work_items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

/**
 * Supprime un item de travail
 * @param id - ID de l'item à supprimer
 */
export async function deleteWorkItem(id: string): Promise<void> {
  await apiFetch<void>(`/work_items/${id}`, { method: 'DELETE' })
}
