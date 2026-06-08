export interface ElectronAPI {
  setIgnoreMouseEvents: (ignore: boolean) => void
  onTogglePointer: (callback: (active: boolean) => void) => void
  sendDrawingData: (data: string) => void
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
