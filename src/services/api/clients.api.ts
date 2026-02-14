import type { ClientDTO } from '@/dto/backend/responses/ClientDTO'
import type { ClientCreateDTO, ClientUpdateDTO } from '@/dto/backend/requests'
import { createCrudEndpoint } from './endpoint.factory'

/**
 * Endpoint CRUD pour les clients
 */
const clientApi = createCrudEndpoint<ClientDTO, ClientCreateDTO, ClientUpdateDTO>(
  '/clients',
  'Clients'
)

/**
 * Récupère la liste complète des clients
 * @returns Array de clients
 */
export async function listClients(): Promise<ClientDTO[]> {
  return clientApi.list()
}

// Backward-compatible name
export async function fetchClients(): Promise<ClientDTO[]> {
  return listClients()
}

/**
 * Récupère un client par son ID
 * @param id - ID du client
 * @returns Détails du client
 */
export async function getClient(id: string): Promise<ClientDTO> {
  return clientApi.getById(id)
}

// Backward-compatible name
export async function fetchClientById(id: string): Promise<ClientDTO> {
  return getClient(id)
}

/**
 * Crée un nouveau client
 * @param data - Données du client à créer
 * @returns Client créé
 */
export async function createClient(data: ClientCreateDTO): Promise<ClientDTO> {
  return clientApi.create(data)
}

/**
 * Met à jour un client existant
 * @param id - ID du client
 * @param data - Données à mettre à jour
 * @returns Client mis à jour
 */
export async function updateClient(id: string, data: ClientUpdateDTO): Promise<ClientDTO> {
  return clientApi.update(id, data)
}

/**
 * Supprime un client
 * @param id - ID du client à supprimer
 */
export async function deleteClient(id: string): Promise<void> {
  return clientApi.delete(id)
}
