import 'dotenv/config';

import { app, BrowserWindow } from 'electron';
import started from 'electron-squirrel-startup';
import { createWindow } from './window';
import { registerIpcHandlers } from './ipc';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

app.whenReady().then(() => {
  let mainWindow = createWindow();
  registerIpcHandlers(() => {
    // prefer returned mainWindow; fallback to any existing window
    const wins = BrowserWindow.getAllWindows();
    return wins.length ? wins[0] : mainWindow;
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
