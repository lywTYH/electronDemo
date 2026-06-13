import { is, platform } from '@electron-toolkit/utils';
import { app, ipcMain } from 'electron';

import { registerAutoUpdaterHandlers } from './autoUpdaterHandlers';
import { APP_EVENT } from '../constant';
import { registerAIHandlers } from './aiHandlers';
import { registerWindowHandlers } from './windowHandlers';

const registerAppHandlers = () => {
  ipcMain.on(APP_EVENT.PING, () => console.log('pong'));
  ipcMain.handle(APP_EVENT.APP_INFO, () => app.getVersion());
  ipcMain.handle(APP_EVENT.ENV_INFO, () => {
    return {
      isDev: is.dev,
      isMac: platform.isMacOS,
      isWin: platform.isWindows,
      isLinux: platform.isWindows,
      platform: process.platform
    };
  });
};

export function registerHandlers() {
  registerAutoUpdaterHandlers();
  registerAppHandlers();
  registerWindowHandlers();
  registerAIHandlers();
}
