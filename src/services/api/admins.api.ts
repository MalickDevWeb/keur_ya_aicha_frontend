import type { AdminDTO, AdminRequestDTO } from '@/dto/frontend/responses'
import type {
  AdminCreateDTO,
  AdminRequestCreateDTO,
  AdminRequestUpdateDTO,
  AdminUpdateDTO,
} from '@/dto/frontend/requests'
import { enqueueCreateAdminAction } from '@/infrastructure/syncQueue'
import { ensureRuntimeConfigLoaded, getApiBaseUrl } from '@/services/runtimeConfig'
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

const CSRF_COOKIE_NAME = 'kya_csrf_token'
const csrfBootstrapCandidates: ReadonlyArray<{ path: string; method: 'GET' | 'POST' }> = [
  { path: '/authContext/csrf', method: 'GET' },
  { path: '/auth/csrf', method: 'GET' },
  { path: '/csrf', method: 'GET' },
  { path: '/authContext', method: 'GET' },
  { path: '/authContext/csrf', method: 'POST' },
]

let csrfBootstrapPromise: Promise<void> | null = null

function readBrowserCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const cookie = `; ${document.cookie}`
  const parts = cookie.split(`; ${name}=`)
  if (parts.length < 2) return ''
  return decodeURIComponent(parts.pop()?.split(';').shift() || '')
}

function hasCsrfCookie(): boolean {
  return Boolean(readBrowserCookie(CSRF_COOKIE_NAME))
}

function isCsrfError(error: unknown): boolean {
  const message = String((error as { message?: string })?.message || error || '').toLowerCase()
  return message.includes('csrf')
}

async function bootstrapAnonymousCsrfToken(force = false): Promise<void> {
  if (typeof window === 'undefined') return
  if (!force && hasCsrfCookie()) return
  if (csrfBootstrapPromise) return csrfBootstrapPromise

  csrfBootstrapPromise = (async () => {
    await ensureRuntimeConfigLoaded()
    const apiBase = getApiBaseUrl()
    for (const candidate of csrfBootstrapCandidates) {
      try {
        const headers: HeadersInit = candidate.method === 'POST'
          ? { 'Content-Type': 'application/json' }
          : {}

        await fetch(`${apiBase}${candidate.path}`, {
          method: candidate.method,
          credentials: 'include',
          cache: 'no-store',
          headers,
          body: candidate.method === 'POST' ? '{}' : undefined,
        })
      } catch {
        // ignore bootstrap probe failures
      }

      if (hasCsrfCookie()) return
    }
  })().finally(() => {
    csrfBootstrapPromise = null
  })

  return csrfBootstrapPromise
}

function isLikelyNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true
  const message = String((error as { message?: string })?.message || error || '').toLowerCase()
  return (
    message.includes('networkerror') ||
    message.includes('failed to fetch') ||
    message.includes('network request failed')
  )
}

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
  const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false
  if (isOffline) {
    await enqueueCreateAdminAction(data)
    return data as unknown as AdminDTO
  }

  try {
    return await adminApi.create(data)
  } catch (error) {
    if (!isLikelyNetworkError(error)) throw error
    await enqueueCreateAdminAction(data)
    return data as unknown as AdminDTO
  }
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
  await bootstrapAnonymousCsrfToken()
  try {
    return await adminRequestApi.create(data)
  } catch (error) {
    if (!isCsrfError(error)) throw error
    await bootstrapAnonymousCsrfToken(true)
    return adminRequestApi.create(data)
  }
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
