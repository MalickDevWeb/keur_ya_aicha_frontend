import { ensureRuntimeConfigLoaded, getApiBaseUrl } from './runtimeConfig'
import {
  buildMaintenanceBlockedMessage,
  sendComplianceWebhookAlert,
  shouldBlockWriteByMaintenance,
} from './platformConfig'
import {
  getCurrentCacheScope,
  isOfflineCacheEnabled,
  readHttpCache,
  saveHttpCache,
  shouldCacheGetPath,
} from '@/infrastructure/offlineCache'

const SLOW_REQUEST_MS = 1500
const AUDIT_BUFFER_KEY = 'audit_buffer'
const UNDO_EVENT_NAME = 'api-undo-available'
const NETWORK_RETRY_BACKOFF_MS = 10_000
let networkUnavailableUntil = 0

const resolveApiBase = async (): Promise<string> => {
  await ensureRuntimeConfigLoaded()
  return getApiBaseUrl()
}

function queueAuditLog(entry: Record<string, unknown>) {
  try {
    const raw = localStorage.getItem(AUDIT_BUFFER_KEY)
    const list = raw ? (JSON.parse(raw) as Record<string, unknown>[]) : []
    list.push(entry)
    localStorage.setItem(AUDIT_BUFFER_KEY, JSON.stringify(list.slice(-50)))
  } catch {
    // ignore
  }
}

async function flushAuditBuffer() {
  try {
    const apiBase = await resolveApiBase()
    const raw = localStorage.getItem(AUDIT_BUFFER_KEY)
    if (!raw) return
    const list = JSON.parse(raw) as Record<string, unknown>[]
    if (!Array.isArray(list) || list.length === 0) return
    for (const entry of list) {
      await fetch(`${apiBase}/audit_logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
    }
    localStorage.removeItem(AUDIT_BUFFER_KEY)
  } catch {
    // ignore
  }
}

async function sendAuditLog(entry: Record<string, unknown>) {
  try {
    const apiBase = await resolveApiBase()
    await fetch(`${apiBase}/audit_logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
  } catch {
    queueAuditLog(entry)
  }
}

/** Logger centralisé pour les appels API */
class ApiLogger {
  private isDebugEnabled = import.meta.env.DEV && import.meta.env.VITE_API_DEBUG === 'true'

  debug(message: string, data?: unknown): void {
    if (this.isDebugEnabled) {
      if (typeof data === 'undefined') {
        // eslint-disable-next-line no-console
        console.debug(`[API] ${message}`)
        return
      }
      // eslint-disable-next-line no-console
      console.debug(`[API] ${message}`, data)
    }
  }

  error(message: string, err?: unknown): void {
    // eslint-disable-next-line no-console
    console.error(`[API ERROR] ${message}`, err)
  }

  warn(message: string, data?: unknown): void {
    // eslint-disable-next-line no-console
    console.warn(`[API WARN] ${message}`, data)
  }
}

const logger = new ApiLogger()

function isFormDataBody(body: RequestInit['body']): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData
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

function isBrowserOffline(): boolean {
  if (typeof navigator === 'undefined') return false
  return navigator.onLine === false
}

function isNetworkTemporarilyUnavailable(): boolean {
  return Date.now() < networkUnavailableUntil
}

function markNetworkUnavailable(): void {
  networkUnavailableUntil = Date.now() + NETWORK_RETRY_BACKOFF_MS
}

function markNetworkAvailable(): void {
  networkUnavailableUntil = 0
}

function reportApiError(method: string, path: string, err: unknown) {
  const likelyNetworkError = isLikelyNetworkError(err)
  if (likelyNetworkError) {
    logger.warn(`Réseau indisponible: ${method} ${path}`, err)
  } else {
    logger.error(`Appel API échoué: ${method} ${path}`, err)
  }
  const shouldSkipRemoteAudit = likelyNetworkError

  if (!shouldSkipRemoteAudit) {
    void sendComplianceWebhookAlert('api_error', {
      method: String(method || 'GET').toUpperCase(),
      path,
      error: err instanceof Error ? err.message : String(err || 'Unknown error'),
    })
  }
  if (!path.startsWith('/audit_logs') && !shouldSkipRemoteAudit) {
    sendAuditLog({
      actor: 'client',
      action: 'API_ERROR',
      targetType: 'request',
      targetId: path,
      message: `Erreur API ${method} ${path}`,
      createdAt: new Date().toISOString(),
    })
  }
}

function dispatchUndoEvent(res: Response, method: string, path: string) {
  const actionMethod = String(method || '').toUpperCase()
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(actionMethod)) return

  const undoId = res.headers.get('x-undo-id')
  if (!undoId) return

  const expiresAt = res.headers.get('x-undo-expires-at')
  const resource = res.headers.get('x-undo-resource')
  const resourceId = res.headers.get('x-undo-resource-id')

  window.dispatchEvent(
    new CustomEvent(UNDO_EVENT_NAME, {
      detail: {
        id: undoId,
        expiresAt,
        resource,
        resourceId,
        method: actionMethod,
        path,
      },
    })
  )
}

/**
 * Mappe les statuts HTTP aux messages d'erreur appropriés
 */
function getErrorMessage(status: number, errorData: Record<string, unknown>): string {
  const messages: Record<number, string> = {
    400: 'Requête invalide',
    401: 'Session expirée. Veuillez vous reconnecter',
    402: "Abonnement admin impayé: accès limité à la page d'abonnement",
    403: 'Accès refusé',
    404: 'Ressource non trouvée',
    409: 'Conflit: Les données ont peut-être été modifiées',
    410: 'Rollback expiré (plus de 2 mois)',
    422: 'Données invalides',
    500: 'Erreur serveur',
    502: 'Mauvaise passerelle',
    503: 'Service indisponible',
  }

  return (
    (errorData.error as string) ||
    (errorData.message as string) ||
    messages[status] ||
    messages[Math.floor(status / 100) * 100] ||
    `Erreur HTTP ${status}`
  )
}

/**
 * Traite la réponse HTTP et lève une erreur appropriée si nécessaire
 */
export async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as Record<string, unknown>
    const message = getErrorMessage(res.status, errorData)

    logger.error(`HTTP ${res.status}: ${message}`, errorData)

    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent('auth-session-expired'))
    }
    if (res.status === 402) {
      window.dispatchEvent(
        new CustomEvent('admin-subscription-blocked', {
          detail: errorData,
        })
      )
    }
    if (res.status === 503 && String(errorData.code || '') === 'MAINTENANCE_MODE') {
      window.dispatchEvent(
        new CustomEvent('platform-maintenance-blocked', {
          detail: {
            method: 'SERVER',
            path: 'server',
            message,
          },
        })
      )
    }

    throw new Error(message)
  }

  if (res.status === 204) return undefined as T

  const text = await res.text().catch(() => '')
  if (!text) return undefined as T

  try {
    return JSON.parse(text) as T
  } catch {
    logger.warn('Réponse non-JSON reçue', text)
    return text as T
  }
}

/**
 * Effectue un appel API fetch avec gestion des en-têtes et logging
 * @param path - Le chemin d'endpoint API (ex: '/clients')
 * @param options - Options fetch (méthode, body, headers, etc.)
 * @returns La réponse parsée en JSON
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  await ensureRuntimeConfigLoaded()
  const headers = new Headers(options.headers || {})

  if (options.body && !isFormDataBody(options.body) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const method = options.method || 'GET'
  const safeMethod = String(method || 'GET').toUpperCase()
  if (shouldBlockWriteByMaintenance(path, safeMethod)) {
    const message = buildMaintenanceBlockedMessage()
    window.dispatchEvent(
      new CustomEvent('platform-maintenance-blocked', {
        detail: {
          method: safeMethod,
          path,
          message,
        },
      })
    )
    throw new Error(message)
  }

  const shouldUseHttpCache = safeMethod === 'GET' && isOfflineCacheEnabled() && shouldCacheGetPath(path)
  const cacheScope = shouldUseHttpCache ? getCurrentCacheScope() : ''
  const shouldSkipNetworkAttempt = isBrowserOffline() || isNetworkTemporarilyUnavailable()

  if (shouldSkipNetworkAttempt) {
    if (shouldUseHttpCache) {
      const cached = await readHttpCache<T>(path, cacheScope, { allowExpired: true })
      if (cached !== null) {
        logger.debug(`Mode offline: cache utilisé pour ${safeMethod} ${path}`)
        return cached
      }
    }
    throw new Error(`Réseau indisponible: ${safeMethod} ${path} sans cache.`)
  }

  const apiBase = getApiBaseUrl()
  const url = `${apiBase}${path}`

  logger.debug(`${safeMethod} ${path}`)
  const start = Date.now()
  let res: Response
  try {
    res = await fetch(url, { ...options, headers })
  } catch (networkError) {
    if (shouldUseHttpCache && isLikelyNetworkError(networkError)) {
      markNetworkUnavailable()
      const cached = await readHttpCache<T>(path, cacheScope, { allowExpired: true })
      if (cached !== null) {
        logger.debug(`Mode offline: cache utilisé pour ${safeMethod} ${path}`)
        return cached
      }
    }
    reportApiError(safeMethod, path, networkError)
    throw networkError
  }

  const duration = Date.now() - start
  if (duration >= SLOW_REQUEST_MS && !path.startsWith('/audit_logs')) {
    sendAuditLog({
      actor: 'client',
      action: 'SLOW_REQUEST_CLIENT',
      targetType: 'request',
      targetId: path,
      message: `Requête lente ${safeMethod} ${path} (${duration}ms)`,
      createdAt: new Date().toISOString(),
    })
  }

  try {
    const data = await handleResponse<T>(res)
    markNetworkAvailable()
    if (shouldUseHttpCache && typeof data !== 'undefined') {
      void saveHttpCache(path, cacheScope, data)
    }
    dispatchUndoEvent(res, safeMethod, path)
    void flushAuditBuffer()
    return data
  } catch (err) {
    reportApiError(safeMethod, path, err)
    throw err
  }
}
