import { electronApp, optimizer } from '@electron-toolkit/utils';
import { app, BrowserWindow, globalShortcut } from 'electron';

import { registerHandlers } from './handlers';
import { createWindow } from './window';

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.experdot.pointer');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  registerHandlers();

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
