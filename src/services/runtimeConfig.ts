type RuntimeConfigPayload = {
  apiBaseUrl?: string
  cloudinarySignUrl?: string
}

type RuntimeConfigResponse = {
  success?: boolean
  error?: string
  config?: RuntimeConfigPayload
  userPath?: string
  portablePath?: string
  source?: string
  writtenPath?: string
}

type RuntimeConfigState = {
  apiBaseUrl: string
  cloudinarySignUrl: string
  source: 'build-env' | 'local-storage' | 'user-file' | 'portable-file' | 'default'
  loaded: boolean
  userPath: string | null
  portablePath: string | null
  writtenPath: string | null
}

type ElectronRuntimeApi = {
  getRuntimeConfig?: () => Promise<RuntimeConfigResponse>
  setRuntimeConfig?: (payload: RuntimeConfigPayload) => Promise<RuntimeConfigResponse>
}

const URL_PROTOCOLS = new Set(['http:', 'https:'])
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1'])

const RUNTIME_API_BASE_KEY = 'kya_runtime_api_base'
const RUNTIME_SIGN_URL_KEY = 'kya_runtime_sign_url'

function isPrivateIpv4Host(hostname: string): boolean {
  const match = String(hostname || '').trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!match) return false

  const octets = match.slice(1).map((value) => Number(value))
  if (octets.some((value) => !Number.isFinite(value) || value < 0 || value > 255)) return false

  const [first, second] = octets
  if (first === 10) return true
  if (first === 172 && second >= 16 && second <= 31) return true
  if (first === 192 && second === 168) return true
  if (first === 169 && second === 254) return true
  return false
}

function isLocalHost(hostname: string): boolean {
  const safeHostname = String(hostname || '').trim().toLowerCase()
  if (!safeHostname) return false
  if (LOCAL_HOSTS.has(safeHostname)) return true
  if (safeHostname.endsWith('.local')) return true
  return isPrivateIpv4Host(safeHostname)
}

function normalizeRuntimeUrl(value: string, label: string, stripTrailingSlash = false): string {
  const raw = String(value || '').trim()
  if (!raw) return ''

  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    throw new Error(`${label} invalide.`)
  }

  if (!URL_PROTOCOLS.has(parsed.protocol)) {
    throw new Error(`${label} doit utiliser http(s).`)
  }

  if (parsed.username || parsed.password) {
    throw new Error(`${label} ne doit pas contenir d'identifiants.`)
  }

  if (parsed.protocol === 'http:' && !isLocalHost(parsed.hostname)) {
    throw new Error(`${label} doit être en https hors réseau local.`)
  }

  const serialized = parsed.toString()
  if (stripTrailingSlash) return serialized.replace(/\/+$/, '')
  return serialized
}

export function validateRuntimeApiBaseUrl(value: string): string {
  return normalizeRuntimeUrl(value, "L'URL de l'API backend", true)
}

export function validateRuntimeSignUrl(value: string): string {
  return normalizeRuntimeUrl(value, "L'URL de signature Cloudinary", false)
}

const normalizeApiBaseUrl = (value: string): string => validateRuntimeApiBaseUrl(value)
const normalizeSignUrl = (value: string): string => validateRuntimeSignUrl(value)

const normalizeApiBaseUrlSafe = (value: string): string => {
  try {
    return normalizeApiBaseUrl(value)
  } catch {
    return ''
  }
}

const normalizeSignUrlSafe = (value: string): string => {
  try {
    return normalizeSignUrl(value)
  } catch {
    return ''
  }
}

const DEFAULT_API_BASE =
  normalizeApiBaseUrlSafe(String(import.meta.env.VITE_API_URL || 'http://localhost:4000')) || 'http://localhost:4000'
const DEFAULT_CLOUDINARY_SIGN_URL = normalizeSignUrlSafe(String(import.meta.env.VITE_CLOUDINARY_SIGN_URL || ''))

const runtimeState: RuntimeConfigState = {
  apiBaseUrl: DEFAULT_API_BASE,
  cloudinarySignUrl: DEFAULT_CLOUDINARY_SIGN_URL,
  source: 'build-env',
  loaded: false,
  userPath: null,
  portablePath: null,
  writtenPath: null,
}

let loadPromise: Promise<void> | null = null

const getElectronRuntimeApi = (): ElectronRuntimeApi | undefined => {
  if (typeof window === 'undefined') return undefined
  return (window as Window & { electronAPI?: ElectronRuntimeApi }).electronAPI
}

const readLocalStorageKey = (
  key: string,
  normalize: (value: string) => string
): string => {
  if (typeof window === 'undefined') return ''
  try {
    const rawValue = String(localStorage.getItem(key) || '').trim()
    if (!rawValue) return ''
    try {
      return normalize(rawValue)
    } catch {
      localStorage.removeItem(key)
      return ''
    }
  } catch {
    return ''
  }
}

const readLocalStorageConfig = (): RuntimeConfigPayload => ({
  apiBaseUrl: readLocalStorageKey(RUNTIME_API_BASE_KEY, normalizeApiBaseUrl),
  cloudinarySignUrl: readLocalStorageKey(RUNTIME_SIGN_URL_KEY, normalizeSignUrl),
})

const writeLocalStorageConfig = (payload: RuntimeConfigPayload): void => {
  if (typeof window === 'undefined') return
  try {
    const apiBaseUrl = normalizeApiBaseUrlSafe(payload.apiBaseUrl || '')
    const cloudinarySignUrl = normalizeSignUrlSafe(payload.cloudinarySignUrl || '')

    if (apiBaseUrl) localStorage.setItem(RUNTIME_API_BASE_KEY, apiBaseUrl)
    else localStorage.removeItem(RUNTIME_API_BASE_KEY)

    if (cloudinarySignUrl) localStorage.setItem(RUNTIME_SIGN_URL_KEY, cloudinarySignUrl)
    else localStorage.removeItem(RUNTIME_SIGN_URL_KEY)
  } catch {
    // ignore localStorage failures
  }
}

const applyConfig = (
  payload: RuntimeConfigPayload,
  source: RuntimeConfigState['source'],
  paths?: { userPath?: string; portablePath?: string; writtenPath?: string }
) => {
  if (Object.prototype.hasOwnProperty.call(payload, 'apiBaseUrl')) {
    runtimeState.apiBaseUrl = normalizeApiBaseUrlSafe(payload.apiBaseUrl || '')
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'cloudinarySignUrl')) {
    runtimeState.cloudinarySignUrl = normalizeSignUrlSafe(payload.cloudinarySignUrl || '')
  }

  runtimeState.source = source
  runtimeState.loaded = true
  if (paths?.userPath) runtimeState.userPath = paths.userPath
  if (paths?.portablePath) runtimeState.portablePath = paths.portablePath
  if (paths?.writtenPath) runtimeState.writtenPath = paths.writtenPath

  writeLocalStorageConfig({
    apiBaseUrl: runtimeState.apiBaseUrl,
    cloudinarySignUrl: runtimeState.cloudinarySignUrl,
  })
}

export async function ensureRuntimeConfigLoaded(): Promise<void> {
  if (runtimeState.loaded) return
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    const localConfig = readLocalStorageConfig()
    if (localConfig.apiBaseUrl || localConfig.cloudinarySignUrl) {
      applyConfig(localConfig, 'local-storage')
    }

    const electronApi = getElectronRuntimeApi()
    if (!electronApi?.getRuntimeConfig) {
      runtimeState.loaded = true
      if (!runtimeState.source) runtimeState.source = 'default'
      return
    }

    try {
      const response = await electronApi.getRuntimeConfig()
      const remoteConfig = response?.config || {}
      const source = (response?.source as RuntimeConfigState['source']) || 'default'
      applyConfig(remoteConfig, source, {
        userPath: response?.userPath,
        portablePath: response?.portablePath,
        writtenPath: response?.writtenPath,
      })
    } catch {
      runtimeState.loaded = true
    }
  })().finally(() => {
    loadPromise = null
  })

  return loadPromise
}

export function getApiBaseUrl(): string {
  return runtimeState.apiBaseUrl || DEFAULT_API_BASE
}

export function getCloudinarySignUrl(): string {
  return runtimeState.cloudinarySignUrl || DEFAULT_CLOUDINARY_SIGN_URL
}

export async function updateRuntimeConfig(payload: RuntimeConfigPayload): Promise<RuntimeConfigState> {
  await ensureRuntimeConfigLoaded()

  const nextPayload: RuntimeConfigPayload = {
    apiBaseUrl: payload.apiBaseUrl !== undefined ? normalizeApiBaseUrl(payload.apiBaseUrl) : runtimeState.apiBaseUrl,
    cloudinarySignUrl:
      payload.cloudinarySignUrl !== undefined
        ? normalizeSignUrl(payload.cloudinarySignUrl)
        : runtimeState.cloudinarySignUrl,
  }

  const electronApi = getElectronRuntimeApi()
  if (electronApi?.setRuntimeConfig) {
    try {
      const response = await electronApi.setRuntimeConfig(nextPayload)
      if (response?.success === false) {
        throw new Error(response.error || 'Unable to update runtime config')
      }
      const source = (response?.source as RuntimeConfigState['source']) || 'user-file'
      applyConfig(response?.config || nextPayload, source, {
        userPath: response?.userPath,
        portablePath: response?.portablePath,
        writtenPath: response?.writtenPath,
      })
      return { ...runtimeState }
    } catch {
      // fallback to local only
    }
  }

  applyConfig(nextPayload, 'local-storage')
  return { ...runtimeState }
}

export function getRuntimeConfigSnapshot(): RuntimeConfigState {
  return { ...runtimeState }
}
