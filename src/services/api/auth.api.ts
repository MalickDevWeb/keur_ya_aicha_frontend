import type { AuthResponseDTO, AuthUser } from '@/dto/frontend/responses'
import type { AuthRequestDTO } from '@/dto/frontend/requests'
import { apiFetch } from '../http'

/**
 * État d'usurpation d'identité admin
 */
export type ImpersonationState = null | {
  adminId: string
  adminName: string
  userId?: string | null
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
    return data?.user || null
  } catch {
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
    return await apiFetch<{
      user: AuthUser | null
      impersonation: ImpersonationState
    }>('/authContext')
  } catch {
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
  return apiFetch<AuthResponseDTO>('/authContext/login', {
    method: 'POST',
    body: JSON.stringify({ username, password } as AuthRequestDTO),
  })
}

/**
 * Déconnexion du contexte d'authentification
 */
export async function logoutAuthContext(): Promise<void> {
  await apiFetch<void>('/authContext/logout', { method: 'POST' })
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
}

/**
 * Supprime l'usurpation d'identité active
 */
export async function clearImpersonation(): Promise<void> {
  await apiFetch<void>('/authContext/clear-impersonation', { method: 'POST' })
}
