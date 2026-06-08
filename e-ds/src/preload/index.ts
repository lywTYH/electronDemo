// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from '../types/electron';

const electronAPI: ElectronAPI = {
  startChat: (value: string) => ipcRenderer.invoke('chat-start', value),
  cancelChat: () => ipcRenderer.send('chat-cancel'),
  onChatUpdate: (callback) => ipcRenderer.on('chat-update', (_, data) => callback(data)),
  onChatError: (callback) => ipcRenderer.on('chat-error', (_, err) => callback(err)),
  onChatCancelled: (callback) => ipcRenderer.on('chat-cancelled', () => callback()),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
