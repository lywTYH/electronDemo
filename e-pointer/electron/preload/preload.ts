import { contextBridge, ipcRenderer } from 'electron';

import { APP_EVENT, UPDATER_EVENT, WINDOW_EVENT } from '../main/constant';
import { LLMConfig } from '../main/handlers/aiHandlers';

const api = {
  //   sendMessageStreaming: (request: AIRequest, callbacks: AIStreamCallbacks): Promise<string> => {
  //   return new Promise((resolve, reject) => {
  //     let fullResponse = ''
  //     let fullReasoning = ''

  //     // 创建一个唯一的事件通道
  //     const eventChannel = `ai-stream-${request.requestId}`

  //     // 监听流数据
  //     const handleStreamData = (_: any, data: AIStreamChunk) => {
  //       switch (data.type) {
  //         case 'chunk':
  //           if (data.content) {
  //             fullResponse += data.content
  //             callbacks.onChunk(data.content)
  //           }
  //           break
  //         case 'reasoning_content':
  //           if (data.reasoning_content) {
  //             fullReasoning += data.reasoning_content
  //             callbacks.onReasoning?.(data.reasoning_content)
  //           }
  //           break
  //         case 'complete':
  //           ipcRenderer.removeListener(eventChannel, handleStreamData)
  //           const finalReasoning = data.reasoning_content || fullReasoning || undefined
  //           callbacks.onComplete?.(fullResponse || data.content || '', finalReasoning)
  //           resolve(request.requestId)
  //           break
  //         case 'error':
  //           ipcRenderer.removeListener(eventChannel, handleStreamData)
  //           callbacks.onError?.(data.error || 'Unknown error')
  //           reject(new Error(data.error || 'Unknown error'))
  //           break
  //       }
  //     }

  //     ipcRenderer.on(eventChannel, handleStreamData)

  //     // 发送请求，传递事件通道名称
  //     ipcRenderer.invoke('ai:send-message-streaming', request, eventChannel).catch((error) => {
  //       ipcRenderer.removeListener(eventChannel, handleStreamData)
  //       callbacks.onError?.(error.message)
  //       reject(error)
  //     })
  //   })
  // },
  testConnection: (config: LLMConfig) => ipcRenderer.invoke('ai:test-connection', config),
  //   getModels: (config: LLMConfig): Promise<GetModelsResult> =>
  //     ipcRenderer.invoke('ai:get-models', config),
  //   stopStreaming: (requestId: string): Promise<void> =>
  //     ipcRenderer.invoke('ai:stop-streaming', requestId)
  // },
  // // 文件操作API
  // saveFile: (options: {
  //   content: string | Uint8Array
  //   defaultPath: string
  //   filters?: Array<{ name: string; extensions: string[] }>
  // }) => ipcRenderer.invoke('save-file', options),

  // readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),

  // selectFiles: (options?: {
  //   multiple?: boolean
  //   filters?: Array<{ name: string; extensions: string[] }>
  // }) => ipcRenderer.invoke('select-files', options),
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
