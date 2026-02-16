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

const DEFAULT_API_BASE = String(import.meta.env.VITE_API_URL || 'http://localhost:4000')
  .trim()
  .replace(/\/+$/, '')
const DEFAULT_CLOUDINARY_SIGN_URL = String(import.meta.env.VITE_CLOUDINARY_SIGN_URL || '').trim()

const RUNTIME_API_BASE_KEY = 'kya_runtime_api_base'
const RUNTIME_SIGN_URL_KEY = 'kya_runtime_sign_url'

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

const normalizeApiBaseUrl = (value: string): string => String(value || '').trim().replace(/\/+$/, '')
const normalizeSignUrl = (value: string): string => String(value || '').trim()

const readLocalStorageConfig = (): RuntimeConfigPayload => {
  if (typeof window === 'undefined') return {}
  try {
    return {
      apiBaseUrl: normalizeApiBaseUrl(localStorage.getItem(RUNTIME_API_BASE_KEY) || ''),
      cloudinarySignUrl: normalizeSignUrl(localStorage.getItem(RUNTIME_SIGN_URL_KEY) || ''),
    }
  } catch {
    return {}
  }
}

const writeLocalStorageConfig = (payload: RuntimeConfigPayload): void => {
  if (typeof window === 'undefined') return
  try {
    const apiBaseUrl = normalizeApiBaseUrl(payload.apiBaseUrl || '')
    const cloudinarySignUrl = normalizeSignUrl(payload.cloudinarySignUrl || '')

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
  const apiBaseUrl = normalizeApiBaseUrl(payload.apiBaseUrl || '')
  const cloudinarySignUrl = normalizeSignUrl(payload.cloudinarySignUrl || '')

  if (apiBaseUrl || payload.apiBaseUrl === '') runtimeState.apiBaseUrl = apiBaseUrl
  if (cloudinarySignUrl || payload.cloudinarySignUrl === '') runtimeState.cloudinarySignUrl = cloudinarySignUrl

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
