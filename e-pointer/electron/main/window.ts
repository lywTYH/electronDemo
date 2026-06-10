import { join } from 'path';

import { is, platform } from '@electron-toolkit/utils';
import { BrowserWindow, shell } from 'electron';

import { windowStateKeeper } from './windowState';
import icon from '../../resources/icon.png';

export function createWindow(): void {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 960,
    defaultHeight: 640,
    fullScreen: false,
    maximize: false
  });

  const mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 480,
    minHeight: 320,
    show: false,
    autoHideMenuBar: true,
    ...(platform.isMacOS
      ? {
          titleBarStyle: 'hiddenInset', // macOS: 显示原生控制按钮
          trafficLightPosition: { x: 10, y: 10 } // 调整原生按钮位置
        }
      : {
          frame: false, // Windows/Linux: 完全自定义
          titleBarStyle: 'hidden'
        }),
    ...(platform.isLinux ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  });

  mainWindowState.manage(mainWindow);
  if (mainWindowState.isMaximized) {
    mainWindow.maximize();
  }


  /**
   * 当窗口准备好显示时才调用 show()，可以避免在加载内容时出现白屏或闪烁的情况
   */
  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  /**
   * 拦截新窗口打开事件，使用系统默认浏览器打开链接
   * 这样可以避免在 Electron 内部打开不受信任的内容，提升安全性
   * 同时也提供了更好的用户体验，因为外部链接通常应该在浏览器中打开
   * 而不是在应用内的新窗口中打开
   * 通过返回 { action: 'deny' } 来阻止 Electron 默认行为（在应用内打开新窗口）
   * 并使用 shell.openExternal() 来在系统默认浏览器中打开链接
   */
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}
