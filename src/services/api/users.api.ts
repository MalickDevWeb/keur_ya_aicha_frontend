import type { UserDTO } from '@/dto/frontend/responses'
import type { UserCreateDTO } from '@/dto/frontend/requests'
import { createCrudEndpoint } from './endpoint.factory'

/**
 * Endpoint CRUD pour les utilisateurs
 */
const userApi = createCrudEndpoint<UserDTO, UserCreateDTO, Partial<UserCreateDTO>>(
  '/users',
  'Utilisateurs'
)

/**
 * Récupère la liste complète des utilisateurs
 * @returns Array d'utilisateurs
 */
export async function listUsers(): Promise<UserDTO[]> {
  return userApi.list()
}

/**
 * Récupère un utilisateur par son ID
 * @param id - ID de l'utilisateur
 * @returns Détails de l'utilisateur
 */
export async function getUser(id: string): Promise<UserDTO> {
  return userApi.getById(id)
}

/**
 * Crée un nouvel utilisateur
 * @param data - Données de l'utilisateur à créer
 * @returns Utilisateur créé
 */
export async function createUser(data: UserCreateDTO): Promise<UserDTO> {
  return userApi.create(data)
}

/**
 * Met à jour un utilisateur existant
 * @param id - ID de l'utilisateur
 * @param data - Données à mettre à jour
 * @returns Utilisateur mis à jour
 */
export async function updateUser(id: string, data: Partial<UserCreateDTO>): Promise<UserDTO> {
  return userApi.update(id, data)
}
