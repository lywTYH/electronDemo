import { contextBridge, ipcRenderer } from 'electron';

import { listenIPCStream } from './ipcStream';
import { APP_EVENT, UPDATER_EVENT, WINDOW_EVENT, AI_EVENT, FILE_EVENT } from '../main/constant';
import { AIRequest, AIStreamChunk, LLMConfig } from '../main/handlers/aiHandlers';

interface AIStreamCallbacks {
  onChunk: (chunk: string) => void;
  onReasoning?: (reasoning: string) => void;
  onComplete?: (fullResponse: string, reasoning?: string) => void;
  onError?: (error: string) => void;
}

const api = {
  ai: {
    sendMessageStreaming: (request: AIRequest, callbacks: AIStreamCallbacks) => {
      const eventChannel = `ai-stream-${request.requestId}`;
      const promise = new Promise<string>((resolve, reject) => {
        let fullResponse = '';
        let fullReasoning = '';
        const cleanup = listenIPCStream<AIStreamChunk>(
          eventChannel,
          (data) => {
            if (data.type === 'chunk' && data.content) {
              fullResponse += data.content;
              callbacks.onChunk(data.content);
            }
            if (data.type === 'reasoning_content' && data.reasoning_content) {
              fullReasoning += data.reasoning_content;
              callbacks.onReasoning?.(data.reasoning_content);
            }
          },
          (err) => {
            if (err) {
              callbacks.onError?.(err.message);
              reject(err);
            } else {
              callbacks.onComplete?.(fullResponse, fullReasoning || undefined);
              resolve(request.requestId);
            }
          }
        );
        ipcRenderer.invoke(AI_EVENT.SEND_STREAM, request, eventChannel).catch((error) => {
          cleanup();
          callbacks.onError?.(error.message);
          reject(error);
        });
      });

      return {
        promise,
        cancel: () => api.ai.stopStreaming(request.requestId)
      };
    },
    testConnection: (config: LLMConfig) => ipcRenderer.invoke(AI_EVENT.TEST_CONNECTION, config),
    getModels: (config: LLMConfig) => ipcRenderer.invoke(AI_EVENT.GET_MODELS, config),
    stopStreaming: (requestId: string) => ipcRenderer.invoke(AI_EVENT.STOP_STREAM, requestId),
    // 文件操作API
    saveFile: (options: {
      content: string | Uint8Array;
      defaultPath: string;
      filters?: Array<{ name: string; extensions: string[] }>;
    }) => ipcRenderer.invoke(FILE_EVENT.SAVE, options),
    readFile: (filePath: string) => ipcRenderer.invoke(FILE_EVENT.READ, filePath),
    selectFiles: (options?: {
      multiple?: boolean;
      filters?: Array<{ name: string; extensions: string[] }>;
    }) => ipcRenderer.invoke(FILE_EVENT.SELECT, options)
  },

  updater: {
    checkForUpdates: () => ipcRenderer.invoke(UPDATER_EVENT.CHECK),
    downloadUpdate: () => ipcRenderer.invoke(UPDATER_EVENT.DOWNLOAD),
    onUpdateAvailable: (callback: (info: unknown) => void) => {
      ipcRenderer.on(UPDATER_EVENT.AVAILABLE, (_, info) => callback(info));
    },
    onUpdateNotAvailable: (callback: (info: unknown) => void) => {
      ipcRenderer.on(UPDATER_EVENT.NOT_AVAILABLE, (_, info) => callback(info));
    },
    onUpdateError: (callback: (error: string) => void) => {
      ipcRenderer.on(UPDATER_EVENT.ERROR, (_, error) => callback(error));
    },
    onDownloadProgress: (callback: (progress: unknown) => void) => {
      ipcRenderer.on(UPDATER_EVENT.DOWNLOAD_PROGRESS, (_, progress) => callback(progress));
    },
    onUpdateDownloaded: (callback: (info: unknown) => void) => {
      ipcRenderer.on(UPDATER_EVENT.DOWNLOADED, (_, info) => callback(info));
    },
    removeAllUpdateListeners: () => {
      ipcRenderer.removeAllListeners(UPDATER_EVENT.AVAILABLE);
      ipcRenderer.removeAllListeners(UPDATER_EVENT.NOT_AVAILABLE);
      ipcRenderer.removeAllListeners(UPDATER_EVENT.DOWNLOAD_PROGRESS);
      ipcRenderer.removeAllListeners(UPDATER_EVENT.DOWNLOADED);
      ipcRenderer.removeAllListeners(UPDATER_EVENT.ERROR);
    }
  }
};

// 窗口控制方法
const windowAPI = {
  minimize: () => ipcRenderer.invoke(WINDOW_EVENT.MINIMIZE),
  maximize: () => ipcRenderer.invoke(WINDOW_EVENT.MAXIMIZE),
  close: () => ipcRenderer.invoke(WINDOW_EVENT.CLOSE),
  isMaximized: () => ipcRenderer.invoke(WINDOW_EVENT.IS_MAX),

  ping: () => ipcRenderer.send(APP_EVENT.PING),
  getEnvInfo: () => ipcRenderer.invoke(APP_EVENT.ENV_INFO)
};

contextBridge.exposeInMainWorld('api', api);
contextBridge.exposeInMainWorld('electronWindow', windowAPI);
