import path from 'node:path';

import { electronApp, optimizer } from '@electron-toolkit/utils';
import { app, BrowserWindow, globalShortcut } from 'electron';

import { setupAutoUpdater } from './autoUpdater';
import { registerIpcHandlers } from './ipcHandlers';

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
      contextIsolation: true
    }
  });

  // Make the window click-through by default (pointer mode inactive)
  win.setIgnoreMouseEvents(true, { forward: true });

  // Always on top (macOS specific)
  win.setAlwaysOnTop(true, 'screen-saver');

  // Hide from taskbar
  win.setSkipTaskbar(true);

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.experdot.pointer');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // Setup auto updater
  setupAutoUpdater();
  // register AI handlers
  // registerAIHandlers();
  // register IPC handlers
  registerIpcHandlers();

  // Setup attachment handlers
  // setupAttachmentHandlers()
  // const { attachmentHandler } = await import('./attachmentHandler')
  // attachmentHandler.cleanupTempAttachments().catch((error) => {
  //   console.error('Failed to cleanup temp attachments on startup:', error)
  // })
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
