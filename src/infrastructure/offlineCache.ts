import { OFFLINE_STORES, idbRequestToPromise, withStore } from './indexedDb'

export const CACHE_SCOPE_USER_KEY = 'kya_cache_scope_user_id'
export const CACHE_SCOPE_IMPERSONATION_KEY = 'kya_cache_scope_impersonation_admin_id'

type HttpCacheEntry = {
  cacheKey: string
  path: string
  scope: string
  data: unknown
  createdAt: number
  expiresAt: number
}

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000
const CACHE_ENABLED = String(import.meta.env.VITE_OFFLINE_CACHE_ENABLED ?? 'true').toLowerCase() === 'true'
const CACHE_TTL_MS = Math.max(1_000, Number(import.meta.env.VITE_OFFLINE_CACHE_TTL_MS || DEFAULT_CACHE_TTL_MS) || DEFAULT_CACHE_TTL_MS)

function safeStorageGet(storage: Storage | undefined, key: string): string {
  try {
    return String(storage?.getItem(key) || '').trim()
  } catch {
    return ''
  }
}

function safeStorageSet(storage: Storage | undefined, key: string, value: string | null): void {
  try {
    if (!value) {
      storage?.removeItem(key)
      return
    }
    storage?.setItem(key, value)
  } catch {
    // ignore session storage errors
  }
}

function safeScopeGet(key: string): string {
  const fromSession = safeStorageGet(typeof sessionStorage === 'undefined' ? undefined : sessionStorage, key)
  if (fromSession) return fromSession
  return safeStorageGet(typeof localStorage === 'undefined' ? undefined : localStorage, key)
}

function safeScopeSet(key: string, value: string | null): void {
  const safeValue = value ? String(value).trim() : null
  safeStorageSet(typeof sessionStorage === 'undefined' ? undefined : sessionStorage, key, safeValue)
  safeStorageSet(typeof localStorage === 'undefined' ? undefined : localStorage, key, safeValue)
}

function buildCacheKey(path: string, scope: string): string {
  return `${scope}::${path}`
}

export function isOfflineCacheEnabled(): boolean {
  return CACHE_ENABLED
}

export function shouldCacheGetPath(path: string): boolean {
  const safePath = String(path || '').trim()
  if (!safePath) return false

  const [pathname, rawQuery = ''] = safePath.split('?')
  if (pathname === '/clients') return true
  if (pathname.startsWith('/admin_payments')) return true
  if (pathname === '/notifications') return true
  if (pathname === '/audit_logs') return true
  if (pathname === '/admins') return true
  if (pathname === '/users') return true
  if (pathname === '/admin_requests') return true
  if (pathname === '/entreprises') return true
  if (pathname === '/work_items') return true
  if (pathname === '/blocked_ips') return true

  if (pathname === '/settings') {
    const params = new URLSearchParams(rawQuery)
    return params.get('key') === 'platform_config_v1'
  }

  return false
}

export function setCacheScopeUserId(userId: string | null): void {
  safeScopeSet(CACHE_SCOPE_USER_KEY, userId ? String(userId).trim() : null)
}

export function setCacheScopeImpersonationAdminId(adminId: string | null): void {
  safeScopeSet(CACHE_SCOPE_IMPERSONATION_KEY, adminId ? String(adminId).trim() : null)
}

export function resetCacheScope(): void {
  setCacheScopeUserId(null)
  setCacheScopeImpersonationAdminId(null)
}

export function getCurrentCacheScope(): string {
  const userId = safeScopeGet(CACHE_SCOPE_USER_KEY) || 'anonymous'
  const impersonationAdminId = safeScopeGet(CACHE_SCOPE_IMPERSONATION_KEY) || 'none'
  return `u:${userId}|imp:${impersonationAdminId}`
}

export async function saveHttpCache(path: string, scope: string, data: unknown): Promise<void> {
  if (!isOfflineCacheEnabled()) return
  if (!shouldCacheGetPath(path)) return

  const now = Date.now()
  const entry: HttpCacheEntry = {
    cacheKey: buildCacheKey(path, scope),
    path,
    scope,
    data,
    createdAt: now,
    expiresAt: now + CACHE_TTL_MS,
  }

  try {
    await withStore(OFFLINE_STORES.HTTP_CACHE, 'readwrite', async (store) => {
      await idbRequestToPromise(store.put(entry))
    })
  } catch {
    // ignore cache write failures
  }
}

export async function readHttpCache<T>(
  path: string,
  scope: string,
  options: { allowExpired?: boolean } = {}
): Promise<T | null> {
  if (!isOfflineCacheEnabled()) return null
  if (!shouldCacheGetPath(path)) return null

  const cacheKey = buildCacheKey(path, scope)
  const allowExpired = options.allowExpired === true

  try {
    const entry = await withStore(OFFLINE_STORES.HTTP_CACHE, 'readwrite', async (store) => {
      const found = (await idbRequestToPromise(store.get(cacheKey))) as HttpCacheEntry | undefined
      if (!found) return null

      if (Number(found.expiresAt || 0) <= Date.now()) {
        if (allowExpired) {
          return found
        }
        await idbRequestToPromise(store.delete(cacheKey))
        return null
      }

      return found
    })

    return (entry?.data as T) ?? null
  } catch {
    return null
  }
}
