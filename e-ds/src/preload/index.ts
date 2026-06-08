// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from '../types/electron';

let requestCounter = 0;
let currentRequestId: string | null = null;

function nextRequestId(): string {
  requestCounter += 1;
  return `req-${Date.now()}-${requestCounter}`;
}

const electronAPI: ElectronAPI = {
  startChat: (message: string) => {
    const requestId = nextRequestId();
    currentRequestId = requestId;
    return ipcRenderer.invoke('chat-start', { requestId, message });
  },
  cancelChat: () => {
    if (currentRequestId) {
      ipcRenderer.send('chat-cancel', { requestId: currentRequestId });
      currentRequestId = null;
    }
  },
  onChatUpdate: (callback) =>
    ipcRenderer.on('chat-update', (_, { data }: { data: string }) => callback(data)),
  onChatError: (callback) =>
    ipcRenderer.on('chat-error', (_, { error }: { error: string }) => callback(new Error(error))),
  onChatCancelled: (callback) =>
    ipcRenderer.on('chat-cancelled', () => {
      currentRequestId = null;
      callback();
    }),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
