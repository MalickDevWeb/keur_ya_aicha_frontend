const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  saveDocument: (data) => ipcRenderer.invoke('save-document', data),
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
  getRuntimeConfig: () => ipcRenderer.invoke('runtime-config:get'),
  setRuntimeConfig: (payload) => ipcRenderer.invoke('runtime-config:set', payload),
  openRuntimeConfigFolder: () => ipcRenderer.invoke('runtime-config:open-folder'),
})
