import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  saveDocument: (data) => ipcRenderer.invoke('save-document', data),
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
})
