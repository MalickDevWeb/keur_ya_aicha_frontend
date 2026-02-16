/// <reference types="vite/client" />

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

interface ElectronAPI {
  saveDocument?: (payload: {
    fileName: string
    fileBlob: Blob
    type: string
    clientNamePhone: string
  }) => Promise<unknown>
  openFolder?: (folderPath: string) => Promise<unknown>
  getRuntimeConfig?: () => Promise<RuntimeConfigResponse>
  setRuntimeConfig?: (payload: RuntimeConfigPayload) => Promise<RuntimeConfigResponse>
  openRuntimeConfigFolder?: () => Promise<unknown>
}

interface Window {
  electronAPI?: ElectronAPI
}
