import type { AdminDTO, AdminRequestDTO } from '@/dto/frontend/responses'
import type {
  AdminCreateDTO,
  AdminRequestCreateDTO,
  AdminRequestUpdateDTO,
  AdminUpdateDTO,
} from '@/dto/frontend/requests'
import { createCrudEndpoint } from './endpoint.factory'

/**
 * Endpoint CRUD pour les administrateurs
 */
const adminApi = createCrudEndpoint<AdminDTO, AdminCreateDTO, AdminUpdateDTO>(
  '/admins',
  'Administrateurs'
)

/**
 * Endpoint CRUD pour les demandes d'administrateur
 */
const adminRequestApi = createCrudEndpoint<
  AdminRequestDTO,
  AdminRequestCreateDTO,
  AdminRequestUpdateDTO
>('/admin_requests', "Demandes d'administrateur")

/**
 * Récupère la liste complète des administrateurs
 * @returns Array d'administrateurs
 */
export async function listAdmins(): Promise<AdminDTO[]> {
  return adminApi.list()
}

/**
 * Récupère un administrateur par son ID
 * @param id - ID de l'administrateur
 * @returns Détails de l'administrateur
 */
export async function getAdmin(id: string): Promise<AdminDTO> {
  return adminApi.getById(id)
}

/**
 * Crée un nouvel administrateur
 * @param data - Données de l'administrateur à créer
 * @returns Administrateur créé
 */
export async function createAdmin(data: AdminCreateDTO): Promise<AdminDTO> {
  return adminApi.create(data)
}

/**
 * Met à jour un administrateur existant
 * @param id - ID de l'administrateur
 * @param data - Données à mettre à jour
 * @returns Administrateur mis à jour
 */
export async function updateAdmin(id: string, data: AdminUpdateDTO): Promise<AdminDTO> {
  return adminApi.update(id, data)
}

/**
 * Récupère la liste complète des demandes d'administrateur
 * @returns Array de demandes
 */
export async function listAdminRequests(): Promise<AdminRequestDTO[]> {
  return adminRequestApi.list()
}

/**
 * Récupère une demande d'administrateur par son ID
 * @param id - ID de la demande
 * @returns Détails de la demande
 */
export async function getAdminRequest(id: string): Promise<AdminRequestDTO> {
  return adminRequestApi.getById(id)
}

/**
 * Crée une nouvelle demande d'administrateur
 * @param data - Données de la demande à créer
 * @returns Demande créée
 */
export async function createAdminRequest(data: AdminRequestCreateDTO): Promise<AdminRequestDTO> {
  return adminRequestApi.create(data)
}

/**
 * Met à jour une demande d'administrateur existante
 * @param id - ID de la demande
 * @param data - Données à mettre à jour
 * @returns Demande mise à jour
 */
export async function updateAdminRequest(
  id: string,
  data: AdminRequestUpdateDTO
): Promise<AdminRequestDTO> {
  return adminRequestApi.update(id, data)
}
