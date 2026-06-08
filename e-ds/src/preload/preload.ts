// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  startChat: (args) => ipcRenderer.invoke('chat-start', args),
  cancelChat: (args) => ipcRenderer.send('chat-cancel', args),
  onChatUpdate: (callback) => ipcRenderer.on('chat-update', (_, data) => callback(data)),
  onChatError: (callback) => ipcRenderer.on('chat-error', (_, data) => callback(data)),
  onChatCancelled: (callback) => ipcRenderer.on('chat-cancelled', (_, data) => callback(data)),
});
