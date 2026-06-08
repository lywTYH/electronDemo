// ---- Update-related types ----

export interface UpdateInfo {
  version: string
  releaseDate?: string
  releaseNotes?: string | null
}

export interface ProgressInfo {
  percent: number
  transferred: number
  total: number
  bytesPerSecond: number
}

export interface UpdateDownloadedInfo extends UpdateInfo {
  downloadedFile: string
}

export interface UpdateErrorInfo {
  message: string
  stack?: string
}

// ---- Electron API surface exposed via contextBridge ----

export interface ElectronAPI {
  // Pointer
  setIgnoreMouseEvents: (ignore: boolean) => void
  onTogglePointer: (callback: (active: boolean) => void) => void
  sendDrawingData: (data: string) => void

  // Update
  checkForUpdates: () => Promise<unknown>
  downloadUpdate: () => void
  quitAndInstall: () => void

  // Update event listeners
  onUpdateChecking: (callback: () => void) => void
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void
  onUpdateNotAvailable: (callback: (info: { version: string }) => void) => void
  onUpdateProgress: (callback: (progress: ProgressInfo) => void) => void
  onUpdateDownloaded: (callback: (info: UpdateDownloadedInfo) => void) => void
  onUpdateError: (callback: (error: UpdateErrorInfo) => void) => void

  // Remove update listeners (cleanup)
  removeUpdateListeners: () => void
}

declare global {
  interface Window {
    ipcRenderer: {
      on(channel: string, listener: (event: unknown, ...args: unknown[]) => void): void
      off(channel: string, listener: (...args: unknown[]) => void): void
      send(channel: string, ...args: unknown[]): void
      invoke(channel: string, ...args: unknown[]): Promise<unknown>
    }
    electronAPI: ElectronAPI
  }
}
