import type { EntrepriseDTO } from '@/dto/frontend/responses'
import type { EntrepriseCreateDTO } from '@/dto/frontend/requests'
import { createCrudEndpoint } from './endpoint.factory'

/**
 * Endpoint CRUD pour les entreprises
 */
const entrepriseApi = createCrudEndpoint<EntrepriseDTO, EntrepriseCreateDTO>(
  '/entreprises',
  'Entreprises'
)

/**
 * Récupère la liste complète des entreprises
 * @returns Array d'entreprises
 */
export async function listEntreprises(): Promise<EntrepriseDTO[]> {
  return entrepriseApi.list()
}

/**
 * Récupère une entreprise par son ID
 * @param id - ID de l'entreprise
 * @returns Détails de l'entreprise
 */
export async function getEntreprise(id: string): Promise<EntrepriseDTO> {
  return entrepriseApi.getById(id)
}

/**
 * Crée une nouvelle entreprise
 * @param data - Données de l'entreprise à créer
 * @returns Entreprise créée
 */
export async function createEntreprise(data: EntrepriseCreateDTO): Promise<EntrepriseDTO> {
  return entrepriseApi.create(data)
}
