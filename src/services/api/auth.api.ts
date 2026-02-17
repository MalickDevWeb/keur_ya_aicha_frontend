import type { AuthResponseDTO, AuthUser } from '@/dto/frontend/responses'
import type { AuthRequestDTO } from '@/dto/frontend/requests'
import {
  resetCacheScope,
  setCacheScopeImpersonationAdminId,
  setCacheScopeUserId,
} from '@/infrastructure/offlineCache'
import { apiFetch } from '../http'
import { ensureRuntimeConfigLoaded, getApiBaseUrl } from '../runtimeConfig'

let superAdminSecondAuthEndpointSupport: boolean | null = null
const AUTH_CONTEXT_SNAPSHOT_KEY = 'kya_auth_context_snapshot'
let secondAuthNetworkRetryAt = 0
const SECOND_AUTH_NETWORK_BACKOFF_MS = 10_000

/**
 * État d'usurpation d'identité admin
 */
export type ImpersonationState = null | {
  adminId: string
  adminName: string
  userId?: string | null
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

function persistAuthContextSnapshot(user: AuthUser | null, impersonation: ImpersonationState): void {
  try {
    if (typeof localStorage === 'undefined') return
    if (!user) {
      localStorage.removeItem(AUTH_CONTEXT_SNAPSHOT_KEY)
      return
    }
    localStorage.setItem(
      AUTH_CONTEXT_SNAPSHOT_KEY,
      JSON.stringify({
        user,
        impersonation: impersonation || null,
      })
    )
  } catch {
    // ignore snapshot storage errors
  }
}

function readAuthContextSnapshot(): { user: AuthUser | null; impersonation: ImpersonationState } | null {
  try {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(AUTH_CONTEXT_SNAPSHOT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { user?: AuthUser | null; impersonation?: ImpersonationState }
    return {
      user: parsed?.user || null,
      impersonation: parsed?.impersonation || null,
    }
  } catch {
    return null
  }
}

function clearAuthContextSnapshot(): void {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.removeItem(AUTH_CONTEXT_SNAPSHOT_KEY)
  } catch {
    // ignore snapshot storage errors
  }
}

function applyAuthCacheScope(user: AuthUser | null, impersonation: ImpersonationState = null): void {
  setCacheScopeUserId(user?.id || null)
  setCacheScopeImpersonationAdminId(impersonation?.adminId || null)
  persistAuthContextSnapshot(user, impersonation || null)
}

/**
 * Connexion utilisateur standard
 * @param username - Nom d'utilisateur
 * @param password - Mot de passe
 * @returns Utilisateur authentifié ou null
 */
export async function loginUser(username: string, password: string): Promise<AuthUser | null> {
  const safeUsername = String(username || '').trim()
  const safePassword = String(password || '').trim()

  const data = await apiFetch<unknown>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: safeUsername,
      password: safePassword,
    } as AuthRequestDTO),
  })

  const user = (data as { user?: AuthUser })?.user || (data as AuthUser)
  if (!user) return null
  applyAuthCacheScope(user, null)
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  }
}

/**
 * Récupère l'utilisateur de la session actuelle
 * @returns Utilisateur actuel ou null si non connecté
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const data = await apiFetch<{ user?: AuthUser }>('/auth/session')
    const user = data?.user || null
    applyAuthCacheScope(user, null)
    return user
  } catch (error) {
    if (isLikelyNetworkError(error)) {
      const snapshot = readAuthContextSnapshot()
      if (snapshot?.user) {
        applyAuthCacheScope(snapshot.user, snapshot.impersonation || null)
        return snapshot.user
      }
    }
    resetCacheScope()
    clearAuthContextSnapshot()
    return null
  }
}

/**
 * Déconnecte l'utilisateur actuel
 */
export async function logoutUser(): Promise<void> {
  try {
    await apiFetch<void>('/auth/logout', { method: 'POST' })
  } catch {
    // Ignorer les erreurs de déconnexion
  } finally {
    resetCacheScope()
    clearAuthContextSnapshot()
  }
}

/**
 * Récupère le contexte d'authentification complet
 * @returns Contexte avec utilisateur et état d'usurpation
 */
export async function getAuthContext(): Promise<{
  user: AuthUser | null
  impersonation: ImpersonationState
}> {
  try {
    const ctx = await apiFetch<{
      user: AuthUser | null
      impersonation: ImpersonationState
    }>('/authContext')
    applyAuthCacheScope(ctx.user || null, ctx.impersonation || null)
    return ctx
  } catch (error) {
    if (isLikelyNetworkError(error)) {
      const snapshot = readAuthContextSnapshot()
      if (snapshot?.user) {
        applyAuthCacheScope(snapshot.user, snapshot.impersonation || null)
        return {
          user: snapshot.user,
          impersonation: snapshot.impersonation || null,
        }
      }
    }
    resetCacheScope()
    clearAuthContextSnapshot()
    return { user: null, impersonation: null }
  }
}

/**
 * Connexion via le contexte d'authentification
 * @param username - Nom d'utilisateur
 * @param password - Mot de passe
 * @returns Réponse d'authentification
 */
export async function loginAuthContext(
  username: string,
  password: string
): Promise<AuthResponseDTO> {
  const response = await apiFetch<AuthResponseDTO & { impersonation?: ImpersonationState }>('/authContext/login', {
    method: 'POST',
    body: JSON.stringify({ username, password } as AuthRequestDTO),
  })
  applyAuthCacheScope(response?.user || null, response?.impersonation || null)
  return response
}

/**
 * Vérifie la seconde authentification du Super Admin
 * @param password - Mot de passe du Super Admin connecté
 * @returns Réponse d'authentification mise à jour
 */
export async function verifySuperAdminSecondAuth(password: string, username?: string): Promise<AuthResponseDTO> {
  const safePassword = String(password || '')
  const fallbackUsername = String(username || localStorage.getItem('kya_last_login_username') || '').trim()
  const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false
  const fallbackToLegacy = async (): Promise<AuthResponseDTO> => {
    if (!fallbackUsername) {
      throw new Error('Backend non synchronisé: route seconde authentification introuvable.')
    }
    return loginAuthContext(fallbackUsername, safePassword)
  }

  if (isOffline) {
    throw new Error('Connexion internet requise pour la seconde authentification.')
  }
  if (Date.now() < secondAuthNetworkRetryAt) {
    throw new Error('Réseau indisponible. Réessaie dans quelques secondes.')
  }

  if (superAdminSecondAuthEndpointSupport === false) {
    return fallbackToLegacy()
  }

  await ensureRuntimeConfigLoaded()
  const apiBase = getApiBaseUrl()

  // Compatibility path: new backend supports this endpoint.
  // If backend is older (404), fallback to standard authContext login.
  let response: Response
  try {
    response = await fetch(`${apiBase}/authContext/super-admin/second-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: safePassword }),
    })
  } catch (error) {
    if (isLikelyNetworkError(error)) {
      secondAuthNetworkRetryAt = Date.now() + SECOND_AUTH_NETWORK_BACKOFF_MS
      throw new Error('Connexion internet requise pour la seconde authentification.')
    }
    throw error
  }

  const payload = (await response.json().catch(() => ({}))) as AuthResponseDTO & {
    error?: string
    message?: string
  }

  if (response.ok) {
    secondAuthNetworkRetryAt = 0
    superAdminSecondAuthEndpointSupport = true
    applyAuthCacheScope(payload?.user || null, (payload as { impersonation?: ImpersonationState })?.impersonation || null)
    return payload
  }

  if (response.status === 404) {
    superAdminSecondAuthEndpointSupport = false
    return fallbackToLegacy()
  }

  throw new Error(payload.error || payload.message || `Erreur HTTP ${response.status}`)
}

/**
 * Déconnexion du contexte d'authentification
 */
export async function logoutAuthContext(): Promise<void> {
  try {
    await apiFetch<void>('/authContext/logout', { method: 'POST' })
  } catch {
    // Ignorer les erreurs de déconnexion réseau (offline)
  } finally {
    resetCacheScope()
    clearAuthContextSnapshot()
  }
}

/**
 * Définit l'usurpation d'identité admin
 * @param payload - État d'usurpation (admin et utilisateur cible)
 */
export async function setImpersonation(payload: ImpersonationState): Promise<void> {
  if (!payload) return
  await apiFetch<void>('/authContext/impersonate', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  setCacheScopeImpersonationAdminId(payload.adminId || null)
}

/**
 * Supprime l'usurpation d'identité active
 */
export async function clearImpersonation(): Promise<void> {
  await apiFetch<void>('/authContext/clear-impersonation', { method: 'POST' })
  setCacheScopeImpersonationAdminId(null)
}
