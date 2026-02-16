import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
let mainWindow
const RUNTIME_CONFIG_FILENAME = 'kya.runtime.json'
const DEFAULT_RUNTIME_CONFIG = Object.freeze({
  apiBaseUrl: '',
  cloudinarySignUrl: '',
})
const URL_PROTOCOLS = new Set(['http:', 'https:'])
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1'])

if (process.platform === 'linux') {
  app.disableHardwareAcceleration()
  app.commandLine.appendSwitch('no-sandbox')
  app.commandLine.appendSwitch('disable-setuid-sandbox')
  app.commandLine.appendSwitch('disable-gpu')
  app.commandLine.appendSwitch('in-process-gpu')
  app.commandLine.appendSwitch('disable-dev-shm-usage')
}

if (process.platform === 'win32') {
  app.setAppUserModelId('com.keuryaicha.app')
}

function isPrivateIpv4Host(hostname = '') {
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

function isLocalHost(hostname = '') {
  const safeHostname = String(hostname || '').trim().toLowerCase()
  if (!safeHostname) return false
  if (LOCAL_HOSTS.has(safeHostname)) return true
  if (safeHostname.endsWith('.local')) return true
  return isPrivateIpv4Host(safeHostname)
}

function normalizeRuntimeUrl(value = '', { label = 'URL', stripTrailingSlash = false } = {}) {
  const raw = String(value || '').trim()
  if (!raw) return ''

  let parsed
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
  return stripTrailingSlash ? serialized.replace(/\/+$/, '') : serialized
}

function normalizeRuntimeConfig(value = {}) {
  const apiBaseUrl = normalizeRuntimeUrl(value?.apiBaseUrl || '', {
    label: "URL API backend",
    stripTrailingSlash: true,
  })
  const cloudinarySignUrl = normalizeRuntimeUrl(value?.cloudinarySignUrl || '', {
    label: "URL Cloudinary Sign",
  })

  return { apiBaseUrl, cloudinarySignUrl }
}

function getUserRuntimeConfigPath() {
  return path.join(app.getPath('userData'), RUNTIME_CONFIG_FILENAME)
}

function getPortableRuntimeConfigPath() {
  const portableDir = String(process.env.PORTABLE_EXECUTABLE_DIR || '').trim()
  if (portableDir) return path.join(portableDir, RUNTIME_CONFIG_FILENAME)
  return path.join(path.dirname(process.execPath), RUNTIME_CONFIG_FILENAME)
}

function readRuntimeConfigFromPath(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return { exists: false, config: { ...DEFAULT_RUNTIME_CONFIG } }
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const parsed = JSON.parse(raw || '{}')
    return { exists: true, config: normalizeRuntimeConfig(parsed) }
  } catch (error) {
    console.error('Failed to parse runtime config:', filePath, error)
    return { exists: true, config: { ...DEFAULT_RUNTIME_CONFIG } }
  }
}

function resolveRuntimeConfig() {
  const userPath = getUserRuntimeConfigPath()
  const portablePath = getPortableRuntimeConfigPath()
  const userConfig = readRuntimeConfigFromPath(userPath)
  const portableConfig = readRuntimeConfigFromPath(portablePath)
  const source = portableConfig.exists ? 'portable-file' : userConfig.exists ? 'user-file' : 'default'

  return {
    config: {
      ...DEFAULT_RUNTIME_CONFIG,
      ...userConfig.config,
      ...portableConfig.config,
    },
    userPath,
    portablePath,
    source,
  }
}

function writeRuntimeConfig(payload = {}) {
  const resolved = resolveRuntimeConfig()
  const current = resolved.config
  const next = normalizeRuntimeConfig({ ...current, ...payload })
  const portableEnvDefined = Boolean(String(process.env.PORTABLE_EXECUTABLE_DIR || '').trim())
  const writeTargets = []

  if (resolved.source === 'portable-file' || portableEnvDefined) {
    writeTargets.push(resolved.portablePath)
  }
  writeTargets.push(resolved.userPath)

  const uniqueTargets = [...new Set(writeTargets.filter(Boolean))]
  let lastError = null

  for (const filePath of uniqueTargets) {
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true })
      fs.writeFileSync(filePath, JSON.stringify(next, null, 2), 'utf-8')
      return {
        config: next,
        userPath: resolved.userPath,
        portablePath: resolved.portablePath,
        source: filePath === resolved.portablePath ? 'portable-file' : 'user-file',
        writtenPath: filePath,
      }
    } catch (error) {
      lastError = error
    }
  }

  if (lastError instanceof Error) {
    throw lastError
  }
  throw new Error('No writable runtime config location found')
}

function resolveWindowIconPath() {
  const iconPath = path.join(__dirname, 'dist', 'logo.png')
  return fs.existsSync(iconPath) ? iconPath : undefined
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: resolveWindowIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: process.platform !== 'linux',
    },
  })

  const isDev = process.env.ELECTRON_DEV === 'true'
  const startupHash = '/login'

  if (isDev) {
    mainWindow.loadURL(`http://localhost:8082/#${startupHash}`)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'), {
      hash: startupHash,
    })
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

ipcMain.handle('runtime-config:get', async () => {
  try {
    return {
      success: true,
      ...resolveRuntimeConfig(),
    }
  } catch (error) {
    console.error('Error reading runtime config:', error)
    return {
      success: false,
      error: error.message,
      config: { ...DEFAULT_RUNTIME_CONFIG },
      userPath: getUserRuntimeConfigPath(),
      portablePath: getPortableRuntimeConfigPath(),
      source: 'default',
    }
  }
})

ipcMain.handle('runtime-config:set', async (event, payload) => {
  try {
    const { config, userPath, portablePath, source, writtenPath } = writeRuntimeConfig(payload || {})
    return {
      success: true,
      config,
      userPath,
      portablePath,
      source,
      writtenPath,
    }
  } catch (error) {
    console.error('Error writing runtime config:', error)
    return {
      success: false,
      error: error.message,
      config: { ...DEFAULT_RUNTIME_CONFIG },
      userPath: getUserRuntimeConfigPath(),
      portablePath: getPortableRuntimeConfigPath(),
      source: 'default',
    }
  }
})

ipcMain.handle('runtime-config:open-folder', async () => {
  try {
    const resolved = resolveRuntimeConfig()
    const portableEnvDefined = Boolean(String(process.env.PORTABLE_EXECUTABLE_DIR || '').trim())
    const preferredFilePath =
      resolved.source === 'portable-file' || portableEnvDefined ? resolved.portablePath : resolved.userPath
    const folderPath = path.dirname(preferredFilePath)
    fs.mkdirSync(folderPath, { recursive: true })
    const { shell } = await import('electron')
    await shell.openPath(folderPath)
    return {
      success: true,
      folderPath,
      source: preferredFilePath === resolved.portablePath ? 'portable-file' : 'user-file',
    }
  } catch (error) {
    console.error('Error opening runtime config folder:', error)
    return {
      success: false,
      error: error.message,
    }
  }
})
