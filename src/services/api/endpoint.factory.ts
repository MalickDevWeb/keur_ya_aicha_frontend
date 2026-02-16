import { apiFetch } from '../http'

/**
 * Interface représentant une entité standard avec ID et timestamps
 */
export interface BaseEntity {
  id: string
  createdAt?: string
  updatedAt?: string
}

/**
 * Définit les opérations CRUD standards pour un endpoint API
 */
export interface CrudEndpoint<T extends BaseEntity, CreateDTO, UpdateDTO = Partial<CreateDTO>> {
  /** Récupère la liste de toutes les ressources */
  list(): Promise<T[]>
  /** Récupère une ressource par ID */
  getById(id: string): Promise<T>
  /** Crée une nouvelle ressource */
  create(data: CreateDTO): Promise<T>
  /** Met à jour une ressource existante */
  update(id: string, data: UpdateDTO): Promise<T>
  /** Supprime une ressource */
  delete(id: string): Promise<void>
}

/**
 * Factory pour créer des endpoints CRUD standardisés
 * Réduit la duplication de code et assure la cohérence
 *
 * @example
 * ```typescript
 * const clientApi = createCrudEndpoint<ClientDTO, ClientCreateDTO>(
 *   '/clients',
 *   'Clients'
 * )
 * const clients = await clientApi.list()
 * ```
 */
export function createCrudEndpoint<T extends BaseEntity, CreateDTO, UpdateDTO = Partial<CreateDTO>>(
  path: string,
  _resourceName: string
): CrudEndpoint<T, CreateDTO, UpdateDTO> {
  return {
    async list(): Promise<T[]> {
      try {
        return await apiFetch<T[]>(path)
      } catch (error) {
        throw error instanceof Error ? error : new Error(String(error))
      }
    },

    async getById(id: string): Promise<T> {
      try {
        return await apiFetch<T>(`${path}/${id}`)
      } catch (error) {
        throw error instanceof Error ? error : new Error(String(error))
      }
    },

    async create(data: CreateDTO): Promise<T> {
      try {
        return await apiFetch<T>(path, {
          method: 'POST',
          body: JSON.stringify(data),
        })
      } catch (error) {
        throw error instanceof Error ? error : new Error(String(error))
      }
    },

    async update(id: string, data: UpdateDTO): Promise<T> {
      try {
        return await apiFetch<T>(`${path}/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        })
      } catch (error) {
        throw error instanceof Error ? error : new Error(String(error))
      }
    },

    async delete(id: string): Promise<void> {
      try {
        await apiFetch<void>(`${path}/${id}`, { method: 'DELETE' })
      } catch (error) {
        throw error instanceof Error ? error : new Error(String(error))
      }
    },
  }
}

/**
 * Crée un endpoint API simple avec opérations GET/POST
 */
export function createSimpleEndpoint<T>(path: string) {
  return {
    async list(): Promise<T[]> {
      return apiFetch<T[]>(path)
    },

    async create(data: Record<string, unknown>): Promise<T> {
      return apiFetch<T>(path, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
  }
}
