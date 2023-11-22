import {app, ipcMain, nativeTheme} from 'electron';
import {platform} from 'node:process';
import {restoreOrCreateWindow} from './mainWindow';
import './security-restrictions';
/**
 * Prevent electron from running multiple instances.
 */
const isSingleInstance = app.requestSingleInstanceLock();
if (!isSingleInstance) {
  app.quit();
  process.exit(0);
}
app.on('second-instance', restoreOrCreateWindow);
/**
 * Disable Hardware Acceleration to save more system resources.
 */
app.disableHardwareAcceleration();
/**
 * Shout down background process if all windows was closed
 */
app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', restoreOrCreateWindow);

ipcMain.handle('dark-mode:toggle', () => {
  if (nativeTheme.shouldUseDarkColors) {
    nativeTheme.themeSource = 'light';
  } else {
    nativeTheme.themeSource = 'dark';
  }
  return nativeTheme.shouldUseDarkColors;
});

ipcMain.handle('dark-mode:system', () => {
  nativeTheme.themeSource = 'system';
});

/**
 * Create the application window when the background process is ready.
 */
app
  .whenReady()
  .then(restoreOrCreateWindow)
  .catch(e => console.error('Failed create window:', e));

/**
 * Install Vue.js or any other extension in development mode only.
 * Note: You must install `electron-devtools-installer` manually
 */
if (import.meta.env.DEV) {
  // app
  //   .whenReady()
  //   .then(() => import('electron-devtools-installer'))
  //   .then(module => {
  //     const {default: installExtension, VUEJS3_DEVTOOLS} =
  //       // @ts-expect-error Hotfix for https://github.com/cawa-93/vite-electron-builder/issues/915
  //       typeof module.default === 'function' ? module : (module.default as typeof module);
  //     return installExtension(VUEJS3_DEVTOOLS, {
  //       loadExtensionOptions: {
  //         allowFileAccess: true,
  //       },
  //     });
  //   })
  //   .catch(e => console.error('Failed install extension:', e));
}

/**
 * Check for app updates, install it in background and notify user that new version was installed.
 * No reason run this in non-production build.
 * @see https://www.electron.build/auto-update.html#quick-setup-guide
 * Note: It may throw "ENOENT: no such file app-update.yml"
 * if you compile production app without publishing it to distribution server.
 * Like `npm run compile` does. It's ok 😅
 */
if (import.meta.env.PROD) {
  app
    .whenReady()
    .then(() => require('electron-updater').autoUpdater.checkForUpdatesAndNotify())
    .catch(e => console.error('Failed check and install updates:', e));
}
