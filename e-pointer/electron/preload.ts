import { ipcRenderer, contextBridge } from 'electron'
import type {
  ElectronAPI,
  UpdateInfo,
  ProgressInfo,
  UpdateDownloadedInfo,
  UpdateErrorInfo,
} from '../src/types/electron'

// --------- Expose a scoped API to the Renderer process ---------
const electronAPI: ElectronAPI = {
  // --- Pointer ---

  setIgnoreMouseEvents: (ignore: boolean) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore)
  },

  onTogglePointer: (callback: (active: boolean) => void) => {
    ipcRenderer.on('toggle-pointer', (_event, active: boolean) => callback(active))
  },

  sendDrawingData: (data: string) => {
    ipcRenderer.send('drawing-data', data)
  },

  // --- Update ---

  checkForUpdates: () => {
    return ipcRenderer.invoke('check-for-updates')
  },

  downloadUpdate: () => {
    ipcRenderer.send('download-update')
  },

  quitAndInstall: () => {
    ipcRenderer.send('quit-and-install')
  },

  // Update event listeners
  onUpdateChecking: (callback: () => void) => {
    ipcRenderer.on('update-checking', () => callback())
  },

  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => {
    ipcRenderer.on('update-available', (_event, info: UpdateInfo) => callback(info))
  },

  onUpdateNotAvailable: (callback: (info: { version: string }) => void) => {
    ipcRenderer.on('update-not-available', (_event, info: { version: string }) => callback(info))
  },

  onUpdateProgress: (callback: (progress: ProgressInfo) => void) => {
    ipcRenderer.on('update-download-progress', (_event, progress: ProgressInfo) => callback(progress))
  },

  onUpdateDownloaded: (callback: (info: UpdateDownloadedInfo) => void) => {
    ipcRenderer.on('update-downloaded', (_event, info: UpdateDownloadedInfo) => callback(info))
  },

  onUpdateError: (callback: (error: UpdateErrorInfo) => void) => {
    ipcRenderer.on('update-error', (_event, error: UpdateErrorInfo) => callback(error))
  },

  removeUpdateListeners: () => {
    ipcRenderer.removeAllListeners('update-checking')
    ipcRenderer.removeAllListeners('update-available')
    ipcRenderer.removeAllListeners('update-not-available')
    ipcRenderer.removeAllListeners('update-download-progress')
    ipcRenderer.removeAllListeners('update-downloaded')
    ipcRenderer.removeAllListeners('update-error')
  },
}

// Legacy ipcRenderer bridge for backward compatibility
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
