export function useElectronAPI() {
  type ElectronAPI = {
    saveDocument: (payload: {
      fileName: string
      fileBlob: Blob
      type: string
      clientNamePhone: string
    }) => Promise<unknown>
    openFolder: (folderPath: string) => Promise<unknown>
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

  return {
    isElectron,
    saveDocument,
    openFolder,
  }
}
