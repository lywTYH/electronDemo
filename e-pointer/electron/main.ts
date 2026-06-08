import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron'
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

let win: BrowserWindow | null = null
let isPointerActive = false

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
      // Disable nodeIntegration for security
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

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// ---- IPC Handlers ----

// Toggle mouse event ignoring (click-through)
ipcMain.on('set-ignore-mouse-events', (_event, ignore: boolean) => {
  if (win) {
    win.setIgnoreMouseEvents(ignore, { forward: true })
  }
})

// Receive drawing data from renderer
ipcMain.on('drawing-data', (_event, data: string) => {
  // Forward drawing data or handle as needed
  win?.webContents.send('drawing-data-received', data)
})

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
  registerShortcuts()
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X re-create window when dock icon clicked and no windows open
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll()
})
