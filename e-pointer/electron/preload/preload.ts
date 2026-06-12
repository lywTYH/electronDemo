import { contextBridge, ipcRenderer } from 'electron';

const api = {
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    downloadUpdate: () => ipcRenderer.invoke('download-update'),
    onUpdateAvailable: (callback: (info: unknown) => void) => {
      ipcRenderer.on('update-available', (_, info) => callback(info));
    },
    onUpdateNotAvailable: (callback: (info: unknown) => void) => {
      ipcRenderer.on('update-not-available', (_, info) => callback(info));
    },
    onUpdateError: (callback: (error: string) => void) => {
      ipcRenderer.on('update-error', (_, error) => callback(error));
    },
    onDownloadProgress: (callback: (progress: unknown) => void) => {
      ipcRenderer.on('download-progress', (_, progress) => callback(progress));
    },
    onUpdateDownloaded: (callback: (info: unknown) => void) => {
      ipcRenderer.on('update-downloaded', (_, info) => callback(info));
    },
    removeAllUpdateListeners: () => {
      ipcRenderer.removeAllListeners('update-available');
      ipcRenderer.removeAllListeners('update-not-available');
      ipcRenderer.removeAllListeners('download-progress');
      ipcRenderer.removeAllListeners('update-downloaded');
      ipcRenderer.removeAllListeners('update-error');
    }
  }
};

// 窗口控制方法
const windowAPI = {
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  getEnvInfo: () => ipcRenderer.invoke('get-env-info')
}

contextBridge.exposeInMainWorld('api', api);
contextBridge.exposeInMainWorld('electronWindow', windowAPI)
