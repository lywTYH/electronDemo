import { is, platform } from '@electron-toolkit/utils';
import { BrowserWindow, ipcMain } from 'electron';

import { autoUpdater } from './autoUpdater';

async function handleCheckForUpdates() {
  // 这里是检查更新的逻辑，可以使用 electron-updater 或其他方式实现
  try {
    console.log('Checking for updates...');
    if (is.dev && !autoUpdater.forceDevUpdateConfig) {
      console.log('Skipping update check in development mode without forceDevUpdateConfig');
      throw new Error('Update check skipped in development mode');
    }
    const result = await autoUpdater.checkForUpdates();
    console.log('Update check completed', result);
    return result;
  } catch (error) {
    console.error('Check for updates error:', error);
    throw error; // 确保错误被正确传递到渲染进程
  }
}

async function handleDownloadUpdate() {
  try {
    console.log('IPC: 开始下载更新');
    const result = await autoUpdater.downloadUpdate();
    console.log('IPC: 更新下载开始', result);
    return result;
  } catch (error) {
    console.error('IPC: Download update error:', error);
    throw error;
  }
}

async function handleWindowControl(
  action: 'close' | 'minimize' | 'maximize' | 'isMaximize',
  event: Electron.IpcMainInvokeEvent
) {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) {
    return;
  }
  switch (action) {
    case 'close':
      window.close();
      break;
    case 'minimize':
      window.minimize();
      break;
    case 'maximize':
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
      break;
    case 'isMaximize':
      return window.isMaximized();
      break;
  }
}

export function registerIpcHandlers(): void {
  // 在这里注册所有的 IPC 处理程序
  ipcMain.handle('check-for-updates', handleCheckForUpdates);
  ipcMain.handle('download-update', handleDownloadUpdate);
  ipcMain.handle('quit-and-install', () => {
    console.log('IPC: 退出并安装更新');
    autoUpdater.quitAndInstall();
  });

  // ipcMain.handle('get-app-version', () => {
  //   const version = app.getVersion();
  //   console.log('IPC: 获取应用版本', version);
  //   return version;
  // });

  ipcMain.on('ping', () => console.log('pong'));
  // 窗口控制IPC处理程序
  ipcMain.handle('window-minimize', (e) => handleWindowControl('minimize', e));
  ipcMain.handle('window-maximize', (e) => handleWindowControl('maximize', e));
  ipcMain.handle('window-close', (e) => handleWindowControl('close', e));
  ipcMain.handle('window-is-maximized', (e) => handleWindowControl('isMaximize', e));

  ipcMain.handle('get-env-info', () => {
    return {
      isDev: is.dev,
      isMac: platform.isMacOS,
      isWin: platform.isWindows,
      isLinux: platform.isWindows,
      platform: process.platform
    };
  });
}
