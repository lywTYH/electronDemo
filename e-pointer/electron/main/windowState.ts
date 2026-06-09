import electron from 'electron';
import path from 'path';
import fs from 'fs';
import { mkdirp } from 'mkdirp';

function stripBom(content: string | Buffer) {
  // we do this because JSON.parse would convert it to a utf8 string if encoding wasn't specified
  if (Buffer.isBuffer(content)) content = content.toString('utf8');
  return content.replace(/^\uFEFF/, '');
}

interface WindowStateOptions {
  file?: string; // 存储文件名，默认 'window-state.json'
  path?: string; // 存储路径，默认 app.getPath('userData')
  maximize?: boolean; // 是否记忆最大化状态，默认 true
  fullScreen?: boolean; // 是否记忆全屏状态，默认 true
  defaultWidth?: number; // 默认宽度，默认 800
  defaultHeight?: number; // 默认高度，默认 600
}
interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  displayBounds?: Electron.Rectangle;
  isMaximized: boolean;
  isFullScreen: boolean;
}

export function windowStateKeeper(options: WindowStateOptions) {
  const app = electron.app;
  const screen = electron.screen;

  let state: Partial<WindowState> = {}; // 窗口状态（x/y/width/height/maximized...）
  let winRef: Electron.BrowserWindow | undefined = undefined; // 保存窗口引用
  let stateChangeTimer: NodeJS.Timeout | undefined; // 防抖定时器（resize/move 不要太频繁）
  const eventHandlingDelay = 100; // 防抖 100ms

  const config: Required<WindowStateOptions> = Object.assign(
    {
      file: 'window-state.json', // 存储文件名
      path: app.getPath('userData'), // 存储路径
      maximize: true, // 是否记忆最大化
      fullScreen: true, // 是否记忆全屏
      defaultWidth: 800, // 默认宽度
      defaultHeight: 600 // 默认高度
    },
    options
  );

  const fullStoreFileName = path.join(config.path, config.file);
  try {
    const contentBuffer = fs.readFileSync(fullStoreFileName);
    const content = stripBom(contentBuffer);
    state = JSON.parse(content);
  } catch (err) {
    // Don't care
  }

  const hasBounds = () => {
    return (
      state &&
      Number.isInteger(state.x) &&
      Number.isInteger(state.y) &&
      Number.isInteger(state.width) &&
      state.width! > 0 &&
      Number.isInteger(state.height) &&
      state.height! > 0
    );
  };

  const resetStateToDefault = () => {
    const displayBounds = screen.getPrimaryDisplay().bounds;
    state = {
      width: config.defaultWidth || 800,
      height: config.defaultHeight || 600,
      x: 0,
      y: 0,
      displayBounds
    };
  };

  const windowWithinBounds = (bounds: Electron.Rectangle) => {
    return (
      state.x! >= bounds.x &&
      state.y! >= bounds.y &&
      state.x! + state.width! <= bounds.x + bounds.width &&
      state.y! + state.height! <= bounds.y + bounds.height
    );
  };

  const ensureWindowVisibleOnSomeDisplay = () => {
    const visible = screen.getAllDisplays().some((display) => {
      return windowWithinBounds(display.bounds);
    });
    if (!visible) {
      return resetStateToDefault();
    }
  };

  const validateState = () => {
    const isValid = state && (hasBounds() || state.isMaximized || state.isFullScreen);
    if (!isValid) {
      state = {};
      return;
    }
    if (hasBounds() && state.displayBounds) {
      ensureWindowVisibleOnSomeDisplay();
    }
  };

  const isNormal = (win: Electron.BrowserWindow) => {
    return !win.isMinimized() && !win.isMaximized() && !win.isFullScreen();
  };

  const updateState = (win?: Electron.BrowserWindow) => {
    win = win || winRef;
    if (!win) return;

    try {
      const winBounds = win.getBounds();
      // 仅正常窗口 保存位置大小
      if (isNormal(win)) {
        state.x = winBounds.x;
        state.y = winBounds.y;
        state.width = winBounds.width;
        state.height = winBounds.height;
      }
      // 保存最大化 / 全屏
      state.isMaximized = win.isMaximized();
      state.isFullScreen = win.isFullScreen();
      // 保存当前所在屏幕
      state.displayBounds = screen.getDisplayMatching(winBounds).bounds;
    } catch (err) {
      // Don't care
    }
  };

  const saveState = (win?: Electron.BrowserWindow) => {
    if (win) {
      updateState(win);
    }
    try {
      mkdirp.sync(path.dirname(fullStoreFileName));
      const str = JSON.stringify(state);
      return fs.writeFileSync(fullStoreFileName, str);
    } catch (err) {
      // Don't care
    }
  };

  function stateChangeHandler() {
    clearTimeout(stateChangeTimer);
    stateChangeTimer = setTimeout(updateState, eventHandlingDelay);
  }

  function closeHandler() {
    updateState();
  }

  function closedHandler() {
    unManage();
    saveState();
  }

  const manage = (win: Electron.BrowserWindow) => {
    // 自动恢复最大化 / 全屏
    if (config.maximize && state.isMaximized) {
      win.maximize();
    }
    if (config.fullScreen && state.isFullScreen) {
      win.setFullScreen(true);
    }
    // 监听事件
    win.on('resize', stateChangeHandler);
    win.on('move', stateChangeHandler);
    win.on('close', closeHandler);
    win.on('closed', closedHandler);
    winRef = win;
  };

  const unManage = () => {
    if (winRef) {
      winRef.removeListener('resize', stateChangeHandler);
      winRef.removeListener('move', stateChangeHandler);
      clearTimeout(stateChangeTimer);
      winRef.removeListener('close', closeHandler);
      winRef.removeListener('closed', closedHandler);
      winRef = undefined;
    }
  };

  validateState();

  state = Object.assign(
    {
      width: config.defaultWidth,
      height: config.defaultHeight
    },
    state
  );

  return {
    get x() {
      return state.x;
    },
    get y() {
      return state.y;
    },
    get width() {
      return state.width;
    },
    get height() {
      return state.height;
    },
    get displayBounds() {
      return state.displayBounds;
    },
    get isMaximized() {
      return state.isMaximized;
    },
    get isFullScreen() {
      return state.isFullScreen;
    },
    saveState,
    manage,
    unManage,
    resetStateToDefault
  };
}
