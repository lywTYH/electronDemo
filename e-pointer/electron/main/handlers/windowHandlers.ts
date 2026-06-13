import { BrowserWindow, ipcMain } from 'electron';

import { WINDOW_EVENT } from '../constant';

async function handleWindowControl(action: WINDOW_EVENT, event: Electron.IpcMainInvokeEvent) {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) {
    return;
  }
  switch (action) {
    case WINDOW_EVENT.CLOSE:
      window.close();
      break;
    case WINDOW_EVENT.MINIMIZE:
      window.minimize();
      break;
    case WINDOW_EVENT.MAXIMIZE:
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
      break;
    case WINDOW_EVENT.IS_MAX:
      return window.isMaximized();
      break;
  }
}

export const registerWindowHandlers = () => {
  ipcMain.handle(WINDOW_EVENT.MINIMIZE, (e) => handleWindowControl(WINDOW_EVENT.MINIMIZE, e));
  ipcMain.handle(WINDOW_EVENT.MAXIMIZE, (e) => handleWindowControl(WINDOW_EVENT.MAXIMIZE, e));
  ipcMain.handle(WINDOW_EVENT.CLOSE, (e) => handleWindowControl(WINDOW_EVENT.CLOSE, e));
  ipcMain.handle(WINDOW_EVENT.IS_MAX, (e) => handleWindowControl(WINDOW_EVENT.IS_MAX, e));
};
