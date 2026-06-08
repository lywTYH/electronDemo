import { ipcRenderer, contextBridge } from 'electron'
import type { ElectronAPI } from '../src/types/electron'

// --------- Expose a scoped API to the Renderer process ---------
const electronAPI: ElectronAPI = {
  setIgnoreMouseEvents: (ignore: boolean) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore)
  },

  onTogglePointer: (callback: (active: boolean) => void) => {
    ipcRenderer.on('toggle-pointer', (_event, active: boolean) => callback(active))
  },

  sendDrawingData: (data: string) => {
    ipcRenderer.send('drawing-data', data)
  },
}

// Also keep the legacy ipcRenderer bridge for backward compatibility
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
