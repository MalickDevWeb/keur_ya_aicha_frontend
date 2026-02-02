export function useElectronAPI() {
  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI

  const saveDocument = async (
    fileName: string,
    fileBlob: Blob,
    type: string,
    clientNamePhone: string
  ) => {
    if (!isElectron) {
      console.log('Not running in Electron, skipping local save')
      return null
    }

    try {
      const result = await (window as any).electronAPI.saveDocument({
        fileName,
        fileBlob,
        type,
        clientNamePhone,
      })
      return result
    } catch (error) {
      console.error('Error saving document:', error)
      throw error
    }
  }

  const openFolder = async (folderPath: string) => {
    if (!isElectron) {
      console.log('Not running in Electron, cannot open folder')
      return null
    }

    try {
      return await (window as any).electronAPI.openFolder(folderPath)
    } catch (error) {
      console.error('Error opening folder:', error)
      throw error
    }
  }

  return {
    isElectron,
    saveDocument,
    openFolder,
  }
}
