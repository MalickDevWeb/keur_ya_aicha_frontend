export function useElectronAPI() {
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

  type ElectronAPI = {
    saveDocument: (payload: {
      fileName: string
      fileBlob: Blob
      type: string
      clientNamePhone: string
    }) => Promise<unknown>
    openFolder: (folderPath: string) => Promise<unknown>
    getRuntimeConfig?: () => Promise<RuntimeConfigResponse>
    setRuntimeConfig?: (payload: RuntimeConfigPayload) => Promise<RuntimeConfigResponse>
    openRuntimeConfigFolder?: () => Promise<unknown>
  }

  const electronAPI = typeof window !== 'undefined'
    ? (window as Window & { electronAPI?: ElectronAPI }).electronAPI
    : undefined
  const isElectron = Boolean(electronAPI)

  const saveDocument = async (
    fileName: string,
    fileBlob: Blob,
    type: string,
    clientNamePhone: string
  ) => {
    if (!isElectron) {
      return null
    }

    const result = await electronAPI?.saveDocument({
      fileName,
      fileBlob,
      type,
      clientNamePhone,
    })
    return result ?? null
  }

  const openFolder = async (folderPath: string) => {
    if (!isElectron) {
      return null
    }

    const result = await electronAPI?.openFolder(folderPath)
    return result ?? null
  }

  const getRuntimeConfig = async (): Promise<RuntimeConfigResponse | null> => {
    if (!isElectron) return null
    const result = await electronAPI?.getRuntimeConfig?.()
    return result ?? null
  }

  const setRuntimeConfig = async (
    payload: RuntimeConfigPayload
  ): Promise<RuntimeConfigResponse | null> => {
    if (!isElectron) return null
    const result = await electronAPI?.setRuntimeConfig?.(payload)
    return result ?? null
  }

  const openRuntimeConfigFolder = async () => {
    if (!isElectron) return null
    const result = await electronAPI?.openRuntimeConfigFolder?.()
    return result ?? null
  }

  return {
    isElectron,
    saveDocument,
    openFolder,
    getRuntimeConfig,
    setRuntimeConfig,
    openRuntimeConfigFolder,
  }
}
