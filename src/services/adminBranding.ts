import { getAuthContext, getSetting, setSetting } from '@/services/api'
import { DEFAULT_PLATFORM_CONFIG, getPlatformConfigSnapshot } from '@/services/platformConfig'

export const ADMIN_BRANDING_APP_NAME_KEY_BASE = 'admin_branding_app_name'
export const ADMIN_BRANDING_LOGO_KEY_BASE = 'admin_branding_logo_url'
export const ADMIN_BRANDING_LOGO_LIBRARY_KEY_BASE = 'admin_branding_logo_library'

const ADMIN_BRANDING_EVENT = 'admin-branding-updated'
const APP_NAME_CACHE_PREFIX = 'kya_admin_branding_app_name:'
const LOGO_CACHE_PREFIX = 'kya_admin_branding_logo:'
const MAX_LOGO_LIBRARY_ITEMS = 12

export type AdminBrandingOverrides = {
  appName: string
  logoUrl: string
}

type AdminBrandingEventDetail = {
  adminId: string
  appName?: string
  logoUrl?: string
}

function sanitizeValue(value: unknown): string {
  return String(value || '').trim()
}

function buildCacheKey(prefix: string, adminId: string): string {
  return `${prefix}${adminId}`
}

export function buildAdminAppNameSettingKey(adminId: string): string {
  return `${ADMIN_BRANDING_APP_NAME_KEY_BASE}:${adminId}`
}

export function buildAdminLogoSettingKey(adminId: string): string {
  return `${ADMIN_BRANDING_LOGO_KEY_BASE}:${adminId}`
}

export function buildAdminLogoLibrarySettingKey(adminId: string): string {
  return `${ADMIN_BRANDING_LOGO_LIBRARY_KEY_BASE}:${adminId}`
}

export function isValidBrandLogoUrl(value: string): boolean {
  const normalized = sanitizeValue(value)
  if (!normalized) return true
  if (normalized.startsWith('/')) return true
  return /^https?:\/\//i.test(normalized)
}

function readCachedOverride(prefix: string, adminId?: string | null): string {
  const scopedAdminId = sanitizeValue(adminId)
  if (!scopedAdminId || typeof window === 'undefined') return ''
  try {
    return sanitizeValue(localStorage.getItem(buildCacheKey(prefix, scopedAdminId)))
  } catch {
    return ''
  }
}

function writeCachedOverride(prefix: string, adminId: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(buildCacheKey(prefix, adminId), sanitizeValue(value))
  } catch {
    // ignore local storage failures
  }
}

export function readCachedAdminAppNameOverride(adminId?: string | null): string {
  return readCachedOverride(APP_NAME_CACHE_PREFIX, adminId)
}

export function readCachedAdminLogoOverride(adminId?: string | null): string {
  return readCachedOverride(LOGO_CACHE_PREFIX, adminId)
}

export async function fetchAdminAppNameOverride(adminId?: string | null): Promise<string> {
  const scopedAdminId = sanitizeValue(adminId)
  if (!scopedAdminId) return ''

  const cached = readCachedAdminAppNameOverride(scopedAdminId)
  try {
    const raw = await getSetting(buildAdminAppNameSettingKey(scopedAdminId))
    const normalized = sanitizeValue(raw)
    writeCachedOverride(APP_NAME_CACHE_PREFIX, scopedAdminId, normalized)
    return normalized
  } catch {
    return cached
  }
}

export async function saveAdminAppNameOverride(adminId: string, appName: string): Promise<void> {
  const scopedAdminId = sanitizeValue(adminId)
  if (!scopedAdminId) throw new Error('Identifiant admin introuvable.')

  const normalized = sanitizeValue(appName)
  await setSetting(buildAdminAppNameSettingKey(scopedAdminId), normalized)
  writeCachedOverride(APP_NAME_CACHE_PREFIX, scopedAdminId, normalized)
  notifyAdminBrandingUpdated(scopedAdminId, { appName: normalized })
}

export async function fetchAdminLogoOverride(adminId?: string | null): Promise<string> {
  const scopedAdminId = sanitizeValue(adminId)
  if (!scopedAdminId) return ''

  const cached = readCachedAdminLogoOverride(scopedAdminId)
  try {
    const raw = await getSetting(buildAdminLogoSettingKey(scopedAdminId))
    const normalized = sanitizeValue(raw)
    writeCachedOverride(LOGO_CACHE_PREFIX, scopedAdminId, normalized)
    return normalized
  } catch {
    return cached
  }
}

export async function saveAdminLogoOverride(adminId: string, logoUrl: string): Promise<void> {
  const scopedAdminId = sanitizeValue(adminId)
  if (!scopedAdminId) throw new Error('Identifiant admin introuvable.')

  const normalized = sanitizeValue(logoUrl)
  if (!isValidBrandLogoUrl(normalized)) {
    throw new Error("L'URL du logo doit être une URL http(s) ou un chemin local (/logo.png).")
  }

  await setSetting(buildAdminLogoSettingKey(scopedAdminId), normalized)
  writeCachedOverride(LOGO_CACHE_PREFIX, scopedAdminId, normalized)
  notifyAdminBrandingUpdated(scopedAdminId, { logoUrl: normalized })
}

export async function fetchAdminBrandingOverrides(adminId?: string | null): Promise<AdminBrandingOverrides> {
  const scopedAdminId = sanitizeValue(adminId)
  if (!scopedAdminId) return { appName: '', logoUrl: '' }

  const [appName, logoUrl] = await Promise.all([
    fetchAdminAppNameOverride(scopedAdminId),
    fetchAdminLogoOverride(scopedAdminId),
  ])
  return { appName, logoUrl }
}

export async function fetchAdminLogoLibrary(adminId?: string | null): Promise<string[]> {
  const scopedAdminId = sanitizeValue(adminId)
  if (!scopedAdminId) return []
  try {
    const raw = await getSetting(buildAdminLogoLibrarySettingKey(scopedAdminId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((entry) => sanitizeValue(entry))
      .filter((entry) => entry && isValidBrandLogoUrl(entry))
      .slice(0, MAX_LOGO_LIBRARY_ITEMS)
  } catch {
    return []
  }
}

export async function appendAdminLogoToLibrary(adminId: string, logoUrl: string): Promise<string[]> {
  const scopedAdminId = sanitizeValue(adminId)
  if (!scopedAdminId) throw new Error('Identifiant admin introuvable.')
  const normalized = sanitizeValue(logoUrl)
  if (!normalized) return fetchAdminLogoLibrary(scopedAdminId)
  if (!isValidBrandLogoUrl(normalized)) {
    throw new Error("L'URL du logo doit être une URL http(s) ou un chemin local (/logo.png).")
  }

  const current = await fetchAdminLogoLibrary(scopedAdminId)
  const next = [normalized, ...current.filter((item) => item !== normalized)].slice(0, MAX_LOGO_LIBRARY_ITEMS)
  await setSetting(buildAdminLogoLibrarySettingKey(scopedAdminId), JSON.stringify(next))
  return next
}

export async function resolveCurrentAdminBranding(): Promise<{ appName: string; logoUrl: string }> {
  const platformConfig = getPlatformConfigSnapshot()
  const fallbackAppName = platformConfig.branding.appName || DEFAULT_PLATFORM_CONFIG.branding.appName
  const fallbackLogo = platformConfig.branding.logoUrl || DEFAULT_PLATFORM_CONFIG.branding.logoUrl

  try {
    const ctx = await getAuthContext()
    const role = String(ctx?.user?.role || '').toUpperCase()
    const adminId =
      sanitizeValue(ctx?.impersonation?.adminId) ||
      (role === 'ADMIN' ? sanitizeValue(ctx?.user?.id) : '')
    const overrides = await fetchAdminBrandingOverrides(adminId)
    return {
      appName: overrides.appName || fallbackAppName,
      logoUrl: overrides.logoUrl || fallbackLogo,
    }
  } catch {
    return {
      appName: fallbackAppName,
      logoUrl: fallbackLogo,
    }
  }
}

export function notifyAdminBrandingUpdated(adminId: string, updates: Partial<AdminBrandingOverrides>): void {
  if (typeof window === 'undefined') return
  const detail: AdminBrandingEventDetail = {
    adminId: sanitizeValue(adminId),
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'appName')) {
    detail.appName = sanitizeValue(updates.appName)
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'logoUrl')) {
    detail.logoUrl = sanitizeValue(updates.logoUrl)
  }

  window.dispatchEvent(
    new CustomEvent<AdminBrandingEventDetail>(ADMIN_BRANDING_EVENT, {
      detail,
    })
  )
}

export function subscribeAdminBrandingUpdates(
  callback: (payload: AdminBrandingEventDetail) => void
): () => void {
  if (typeof window === 'undefined') return () => undefined

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<AdminBrandingEventDetail>).detail
    if (!detail?.adminId) return
    const payload: AdminBrandingEventDetail = {
      adminId: sanitizeValue(detail.adminId),
    }
    if (Object.prototype.hasOwnProperty.call(detail, 'appName')) {
      payload.appName = sanitizeValue(detail.appName)
    }
    if (Object.prototype.hasOwnProperty.call(detail, 'logoUrl')) {
      payload.logoUrl = sanitizeValue(detail.logoUrl)
    }
    callback({
      ...payload,
    })
  }

  window.addEventListener(ADMIN_BRANDING_EVENT, handler)
  return () => {
    window.removeEventListener(ADMIN_BRANDING_EVENT, handler)
  }
}
