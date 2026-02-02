import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })

  const isDev = process.env.ELECTRON_DEV === 'true'

  if (isDev) {
    mainWindow.loadURL('http://localhost:8082')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// IPC Handler pour créer les dossiers et sauvegarder les fichiers
ipcMain.handle('save-document', async (event, { fileName, fileBlob, type, clientNamePhone }) => {
  try {
    // Dossier de base
    const baseDir = path.join(app.getPath('documents'), 'KeurYaAicha_Documents')

    // Mapper le type en français
    const typeMap = {
      payment: 'Paiements',
      deposit: 'Cautions',
      contract: 'Contrats',
      receipt: 'Reçus',
    }

    const typeFolderName = typeMap[type] || type
    const clientFolder = path.join(baseDir, typeFolderName, clientNamePhone)

    // Créer les dossiers s'ils n'existent pas
    if (!fs.existsSync(clientFolder)) {
      fs.mkdirSync(clientFolder, { recursive: true })
    }

    // Convertir le Blob en Buffer
    const arrayBuffer = await fileBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Sauvegarder le fichier
    const filePath = path.join(clientFolder, fileName)
    fs.writeFileSync(filePath, buffer)

    return {
      success: true,
      path: filePath,
      folderPath: clientFolder,
    }
  } catch (error) {
    console.error('Error saving document:', error)
    return {
      success: false,
      error: error.message,
    }
  }
})

// IPC Handler pour ouvrir le dossier client
ipcMain.handle('open-folder', async (event, folderPath) => {
  try {
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true })
    }

    // Ouvrir le dossier dans l'explorateur
    const { shell } = await import('electron')
    shell.openPath(folderPath)

    return { success: true }
  } catch (error) {
    console.error('Error opening folder:', error)
    return {
      success: false,
      error: error.message,
    }
  }
})
