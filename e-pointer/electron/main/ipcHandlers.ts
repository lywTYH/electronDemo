import { is } from '@electron-toolkit/utils';
import { ipcMain } from 'electron';

import { autoUpdater } from './autoUpdater';

async function checkForUpdates() {
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


export function registerIpcHandlers(): void {
  // 在这里注册所有的 IPC 处理程序
  ipcMain.handle('check-for-updates', checkForUpdates);
}
