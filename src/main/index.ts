import { app, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import { join } from 'path'
import { registerIpcHandlers } from './ipc'
import { startAutoSync, stopAutoSync } from './services/sync'
import { seedAll } from './services/seed'

const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' data: https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com"]
      }
    })
  })

  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault())
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Auto-updater setup
function setupAutoUpdater(): void {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-available', info.version)
  })

  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('update-not-available')
  })

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('update-downloaded', info.version)
  })

  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('update-error', err.message)
  })

  autoUpdater.checkForUpdatesAndNotify()
}

// IPC handlers
ipcMain.handle('app:version', () => app.getVersion())
ipcMain.handle('app:check-updates', () => autoUpdater.checkForUpdatesAndNotify())
ipcMain.handle('app:install-update', () => autoUpdater.quitAndInstall())

app.whenReady().then(() => {
  registerIpcHandlers()
  seedAll()
  createWindow()
  startAutoSync()

  if (!isDev) {
    setupAutoUpdater()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  stopAutoSync()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
