import { DownloadProgress, UpdateInfo } from '../stores/updateStore';

export interface ModelConfig {
  id: string;
  name: string;
  systemPrompt: string;
  topP: number;
  temperature: number;
  createdAt: number;
}

export interface LLMConfig {
  id: string;
  name: string;
  apiHost: string;
  apiKey: string;
  modelName: string;
  createdAt: number;
  modelConfigId?: string;
}

export interface PromptListConfig {
  id: string;
  name: string;
  description?: string;
  prompts: string[];
  createdAt: number;
}

export interface Settings {
  llmConfigs: LLMConfig[];
  defaultLLMId?: string;
  modelConfigs: ModelConfig[];
  defaultModelConfigId?: string;
  fontSize: 'small' | 'medium' | 'large';
  promptLists: PromptListConfig[];
}

declare global {
  interface Window {
    api: {
      ai: {
        testConnection: (config: Pick<LLMConfig, 'apiHost' | 'apiKey' | 'modelName'>) => Promise<{
          success: boolean;
          error?: string;
        }>;
        getModels: (config: Pick<LLMConfig, 'apiHost' | 'apiKey' | 'modelName'>) => Promise<{
          success: boolean;
          models?: string[];
          error?: string;
        }>;
      };
      updater: {
        checkForUpdates: () => Promise<void>;
        downloadUpdate: () => Promise<void>;
        onUpdateAvailable(cb: (v: UpdateInfo) => void): void;
        onUpdateNotAvailable(cb: (v: UpdateInfo) => void): void;
        onUpdateError(cb: (error: string) => void): void;
        onDownloadProgress(cb: (progress: DownloadProgress) => void): void;
        onUpdateDownloaded(cb: (v: UpdateInfo) => void): void;
        removeAllUpdateListeners(): void;
        quitAndInstall: () => Promise<void>;
      };
    };
    electronWindow: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      isMaximized: () => Promise<boolean>;
      ping: () => Promise<void>;
      getEnvInfo: () => Promise<{
        isDev: boolean;
        isMac: boolean;
        isWin: boolean;
        isLinux: boolean;
        platform: string;
      }>;
    };
  }
}
