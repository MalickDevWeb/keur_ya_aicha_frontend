import type { DepositDTO } from '@/dto/backend/responses/DepositDTO'
import type { DepositCreateDTO, DepositUpdateDTO } from '@/dto/backend/requests'
import { createCrudEndpoint } from './endpoint.factory'

/**
 * Endpoint CRUD pour les dépôts
 */
const depositApi = createCrudEndpoint<DepositDTO, DepositCreateDTO, DepositUpdateDTO>(
  '/deposits',
  'Dépôts'
)

/**
 * Récupère la liste complète des dépôts
 * @returns Array de dépôts
 */
export async function listDeposits(): Promise<DepositDTO[]> {
  return depositApi.list()
}

// Backward-compatible name
export async function fetchDeposits(): Promise<DepositDTO[]> {
  return listDeposits()
}

/**
 * Récupère un dépôt par son ID
 * @param id - ID du dépôt
 * @returns Détails du dépôt
 */
export async function getDeposit(id: string): Promise<DepositDTO> {
  return depositApi.getById(id)
}

/**
 * Crée un nouveau dépôt
 * @param data - Données du dépôt à créer
 * @returns Dépôt créé
 */
export async function createDeposit(data: DepositCreateDTO): Promise<DepositDTO> {
  return depositApi.create(data)
}

// Backward-compatible name
export async function createDepositRecord(data: DepositCreateDTO): Promise<DepositDTO> {
  return createDeposit(data)
}

/**
 * Met à jour un dépôt existant
 * @param id - ID du dépôt
 * @param data - Données à mettre à jour
 * @returns Dépôt mis à jour
 */
export async function updateDeposit(id: string, data: DepositUpdateDTO): Promise<DepositDTO> {
  return depositApi.update(id, data)
}

/**
 * Supprime un dépôt
 * @param id - ID du dépôt à supprimer
 */
export async function deleteDeposit(id: string): Promise<void> {
  return depositApi.delete(id)
}
