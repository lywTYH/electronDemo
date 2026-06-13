import { join } from 'path';

import { is } from '@electron-toolkit/utils';
import { BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';

import { UPDATER_EVENT } from '../constant';

function setupAutoUpdater(): void {
  // 设置自动下载为false，手动控制下载过程
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // 在开发环境中启用自动更新，使用开发配置
  if (is.dev) {
    autoUpdater.updateConfigPath = join(__dirname, '../../dev-app-update.yml');
    // 强制启用开发环境的更新检查
    autoUpdater.forceDevUpdateConfig = true;
    // 开发环境下跳过签名验证
    autoUpdater.allowDowngrade = true;
  }

  autoUpdater.on(UPDATER_EVENT.AVAILABLE, (info) => {
    console.log('Update available:', info);
    // 通知渲染进程有更新可用
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('update-available', info);
    });
  });

  autoUpdater.on(UPDATER_EVENT.NOT_AVAILABLE, (info) => {
    console.log('Update not available:', info);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('update-not-available', info);
    });
  });

  autoUpdater.on(UPDATER_EVENT.DOWNLOAD_PROGRESS, (progressObj) => {
    console.log('Download progress:', progressObj);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('download-progress', progressObj);
    });
  });

  autoUpdater.on(UPDATER_EVENT.DOWNLOADED, (info) => {
    console.log('Update downloaded:', info);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('update-downloaded', info);
    });
  });

  autoUpdater.on(UPDATER_EVENT.ERROR, (error) => {
    console.error('Update error:', error);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('update-error', error.message);
    });
  });
}

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

const registerAutoUpdaterHandlers = () => {
  setupAutoUpdater();
  ipcMain.handle(UPDATER_EVENT.CHECK, handleCheckForUpdates);
  ipcMain.handle(UPDATER_EVENT.DOWNLOAD, handleDownloadUpdate);
  ipcMain.handle(UPDATER_EVENT.QUIT, () => {
    console.log('IPC: 退出并安装更新');
    autoUpdater.quitAndInstall();
  });
};
export { autoUpdater, registerAutoUpdaterHandlers };
