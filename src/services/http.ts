export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const SLOW_REQUEST_MS = 1500
const AUDIT_BUFFER_KEY = 'audit_buffer'

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
    const raw = localStorage.getItem(AUDIT_BUFFER_KEY)
    if (!raw) return
    const list = JSON.parse(raw) as Record<string, unknown>[]
    if (!Array.isArray(list) || list.length === 0) return
    for (const entry of list) {
      await fetch(`${API_BASE}/audit_logs`, {
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
    await fetch(`${API_BASE}/audit_logs`, {
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
  private isDev = import.meta.env.DEV

  debug(message: string, data?: unknown): void {
    if (this.isDev) {
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

/**
 * Mappe les statuts HTTP aux messages d'erreur appropriés
 */
function getErrorMessage(status: number, errorData: Record<string, unknown>): string {
  const messages: Record<number, string> = {
    400: 'Requête invalide',
    401: 'Session expirée. Veuillez vous reconnecter',
    403: 'Accès refusé',
    404: 'Ressource non trouvée',
    409: 'Conflit: Les données ont peut-être été modifiées',
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
  const headers = new Headers(options.headers || {})

  if (options.body && !isFormDataBody(options.body) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const method = options.method || 'GET'
  const url = `${API_BASE}${path}`

  logger.debug(`${method} ${path}`)

  try {
    const start = Date.now()
    const res = await fetch(url, { ...options, headers })
    const duration = Date.now() - start
    if (duration >= SLOW_REQUEST_MS && !path.startsWith('/audit_logs')) {
      sendAuditLog({
        actor: 'client',
        action: 'SLOW_REQUEST_CLIENT',
        targetType: 'request',
        targetId: path,
        message: `Requête lente ${method} ${path} (${duration}ms)`,
        createdAt: new Date().toISOString(),
      })
    }
    const data = await handleResponse<T>(res)
    void flushAuditBuffer()
    return data
  } catch (err) {
    logger.error(`Appel API échoué: ${method} ${path}`, err)
    if (!path.startsWith('/audit_logs')) {
      sendAuditLog({
        actor: 'client',
        action: 'API_ERROR',
        targetType: 'request',
        targetId: path,
        message: `Erreur API ${method} ${path}`,
        createdAt: new Date().toISOString(),
      })
    }
    throw err
  }
}
