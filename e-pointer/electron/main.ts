import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron'
import { autoUpdater, UpdateCheckResult } from 'electron-updater'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

const isDev = !!VITE_DEV_SERVER_URL

let win: BrowserWindow | null = null
let isPointerActive = false

// ---- Auto-Updater Configuration ----
function setupAutoUpdater() {
  // In development, skip auto-update (it would error trying to find update server)
  if (isDev) {
    console.log('[auto-updater] Skipping — running in development mode')
    return
  }

  // Configure the auto-updater
  // The publish config from electron-builder.json5 is embedded in the packaged app,
  // so autoUpdater can read it automatically.
  // To override the feed URL at runtime, uncomment:
  // autoUpdater.setFeedURL({
  //   provider: 'generic',
  //   url: 'https://your-update-server.com/releases',
  // })

  // Auto-download: false — let the user decide when to download
  autoUpdater.autoDownload = false

  // Allow the updater to run even when the app is set to quit
  autoUpdater.autoInstallOnAppQuit = true

  // ---- Event Listeners ----

  autoUpdater.on('checking-for-update', () => {
    sendToRenderer('update-checking', null)
  })

  autoUpdater.on('update-available', (info) => {
    sendToRenderer('update-available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes,
    })
  })

  autoUpdater.on('update-not-available', (info) => {
    sendToRenderer('update-not-available', {
      version: info.version,
    })
  })

  autoUpdater.on('download-progress', (progress) => {
    sendToRenderer('update-download-progress', {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond,
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    sendToRenderer('update-downloaded', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes,
      downloadedFile: info.downloadedFile,
    })
  })

  autoUpdater.on('error', (error) => {
    sendToRenderer('update-error', {
      message: error.message,
      stack: error.stack,
    })
  })

  // Check for updates on startup (with a 3-second delay to let the window load)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[auto-updater] Check failed:', err.message)
    })
  }, 3000)
}

// Helper: safely send an IPC message to the renderer
function sendToRenderer(channel: string, data: unknown) {
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, data)
  }
}

// ---- IPC Handlers ----

function registerIpcHandlers() {
  // Toggle mouse event ignoring (click-through)
  ipcMain.on('set-ignore-mouse-events', (_event, ignore: boolean) => {
    if (win) {
      win.setIgnoreMouseEvents(ignore, { forward: true })
    }
  })

  // Receive drawing data from renderer
  ipcMain.on('drawing-data', (_event, data: string) => {
    win?.webContents.send('drawing-data-received', data)
  })

  // ---- Update-related IPC ----

  // Manually check for updates
  ipcMain.handle('check-for-updates', async (): Promise<UpdateCheckResult | null> => {
    if (isDev) {
      console.log('[auto-updater] Manual check skipped — dev mode')
      return null
    }
    try {
      return await autoUpdater.checkForUpdates()
    } catch (error) {
      console.error('[auto-updater] Manual check failed:', error)
      throw error
    }
  })

  // Start downloading the available update
  ipcMain.on('download-update', () => {
    if (!isDev) {
      autoUpdater.downloadUpdate().catch((err) => {
        console.error('[auto-updater] Download failed:', err.message)
      })
    }
  })

  // Quit the app and install the downloaded update
  ipcMain.on('quit-and-install', () => {
    if (!isDev) {
      // Remove all listeners so the app can quit cleanly
      autoUpdater.removeAllListeners()
      autoUpdater.quitAndInstall(false, true)
    }
  })
}

// ---- Window ----

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    // Pointer overlay settings
    transparent: true,
    alwaysOnTop: true,
    frame: false,
    fullscreen: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Make the window click-through by default (pointer mode inactive)
  win.setIgnoreMouseEvents(true, { forward: true })

  // Always on top (macOS specific)
  win.setAlwaysOnTop(true, 'screen-saver')

  // Hide from taskbar
  win.setSkipTaskbar(true)

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// ---- Keyboard Shortcuts ----

function registerShortcuts() {
  // Ctrl+Shift+P to toggle pointer mode
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    isPointerActive = !isPointerActive
    if (win) {
      win.setIgnoreMouseEvents(!isPointerActive, { forward: true })
      win.webContents.send('toggle-pointer', isPointerActive)
    }
  })

  // Escape to deactivate pointer
  globalShortcut.register('Escape', () => {
    if (isPointerActive) {
      isPointerActive = false
      if (win) {
        win.setIgnoreMouseEvents(true, { forward: true })
        win.webContents.send('toggle-pointer', false)
      }
    }
  })
}

// ---- App Lifecycle ----

app.whenReady().then(() => {
  createWindow()
  registerIpcHandlers()
  registerShortcuts()
  setupAutoUpdater()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
