import { electronApp, optimizer } from '@electron-toolkit/utils';
import { app, BrowserWindow, globalShortcut } from 'electron';

import { setupAutoUpdater } from './autoUpdater';
import { registerIpcHandlers } from './ipcHandlers';
import { createWindow } from './window';


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
