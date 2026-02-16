import type { ImportRunDTO } from '@/dto/backend/responses/ImportRunDTO'
import type { ImportRunCreateDTO, ImportRunUpdateDTO } from '@/dto/backend/requests'
import { apiFetch } from '../http'

/**
 * Crée une nouvelle exécution d'importation
 * @param data - Données de l'exécution à créer
 * @returns Exécution créée
 */
export async function createImportRun(data: ImportRunCreateDTO): Promise<ImportRunDTO> {
  return apiFetch<ImportRunDTO>('/import_runs', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Récupère la liste des exécutions d'importation (triée par date décroissante)
 * @returns Array d'exécutions triées par date
 */
export async function listImportRuns(): Promise<ImportRunDTO[]> {
  const data = await apiFetch<ImportRunDTO[]>('/import_runs')
  return Array.isArray(data)
    ? [...data].sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      )
    : []
}

/**
 * Met à jour une exécution d'importation
 * @param id - ID de l'exécution
 * @param data - Données à mettre à jour
 * @returns Exécution mise à jour
 */
export async function updateImportRun(id: string, data: ImportRunUpdateDTO): Promise<ImportRunDTO> {
  return apiFetch<ImportRunDTO>(`/import_runs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function markImportRunRead(
  id: string,
  type: 'success' | 'errors'
): Promise<ImportRunDTO> {
  return updateImportRun(id, type === 'success' ? { readSuccess: true } : { readErrors: true })
}
