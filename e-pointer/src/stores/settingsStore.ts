import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { LLMConfig, ModelConfig, PromptListConfig, Settings } from '../types/types';
import { INITIAL_SETTINGS } from './helpers/constants';
import { createPersistConfig, handleStoreError } from './persistence/storeConfig';

export interface SettingsState {
  settings: Settings;
}
export interface SettingsActions {
  // 外观设置
  setFontSize: (size: 'small' | 'medium' | 'large') => void;

  // LLM配置管理
  addLLMConfig: (config: LLMConfig) => void;
  updateLLMConfig: (id: string, updates: Partial<LLMConfig>) => void;
  deleteLLMConfig: (id: string) => void;
  setDefaultLLM: (id: string) => void;
  getLLMConfig: (id: string) => LLMConfig | undefined;
  getDefaultLLMConfig: () => LLMConfig | undefined;

  // ModelConfig管理
  addModelConfig: (config: ModelConfig) => void;
  updateModelConfig: (id: string, updates: Partial<ModelConfig>) => void;
  deleteModelConfig: (id: string) => void;
  setDefaultModelConfig: (id: string) => void;
  getModelConfig: (id: string) => ModelConfig | undefined;
  getDefaultModelConfig: () => ModelConfig | undefined;
  getModelConfigForLLM: (llmId: string) => ModelConfig | undefined;

  // 提示词列表管理
  addPromptList: (config: PromptListConfig) => void;
  updatePromptList: (id: string, updates: Partial<PromptListConfig>) => void;
  deletePromptList: (id: string) => void;
  getPromptList: (id: string) => PromptListConfig | undefined;

  // 工具方法
  exportSettings: () => Settings;
  importSettings: (settings: Settings) => void;
  createAIServiceForLLM: (llmId: string) => any | null;
}

const initialState: SettingsState = {
  settings: INITIAL_SETTINGS
};

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,
      // 外观设置
      setFontSize: (size) => {
        try {
          set((state) => {
            state.settings.fontSize = size;
          });
        } catch (error) {
          handleStoreError('settingsStore', 'setFontSize', error);
        }
      },

      // LLM配置管理
      addLLMConfig: (config) => {
        try {
          set((state) => {
            if (state.settings.llmConfigs.length === 0) {
              state.settings.defaultLLMId = config.id;
            }
            state.settings.llmConfigs.push(config);
          });
        } catch (error) {
          handleStoreError('settingsStore', 'addLLMConfig', error);
        }
      },
      updateLLMConfig: (id, updates) => {
        try {
          set((state) => {
            const configIndex = state.settings.llmConfigs.findIndex((v) => v.id === id);
            if (configIndex !== -1) {
              const updateConfig = {
                ...state.settings.llmConfigs[configIndex],
                ...updates
              };
              state.settings.llmConfigs[configIndex] = updateConfig;
            }
          });
        } catch (error) {
          handleStoreError('settingsStore', 'updateLLMConfig', error);
        }
      },
      deleteLLMConfig(id) {
        try {
          set((state) => {
            state.settings.llmConfigs = state.settings.llmConfigs.filter((v) => v.id === id);
            if (state.settings.defaultLLMId === id) {
              if (state.settings.llmConfigs.length > 0) {
                state.settings.defaultLLMId = state.settings.defaultLLMId[0].id;
              } else {
                state.settings.defaultLLMId = undefined;
              }
            }
          });
        } catch (error) {
          handleStoreError('settingsStore', 'deleteLLMConfig', error);
        }
      },
      setDefaultLLM(id) {
        try {
          set((state) => {
            state.settings.defaultLLMId = id;
          });
        } catch (error) {
          handleStoreError('settingsStore', 'setDefaultLLM', error);
        }
      },
      getLLMConfig(id) {
        return get().settings.llmConfigs.find((c) => c.id === id);
      },
      getDefaultLLMConfig() {
        const { settings } = get();
        if (settings.defaultLLMId) {
          return settings.llmConfigs.find((c) => c.id === settings.defaultLLMId);
        }
        return settings.llmConfigs[0];
      },

      // ModelConfig管理
      addModelConfig(config) {
        try {
          set((state) => {
            // 如果是第一个配置，自动设为默认
            if (state.settings.modelConfigs.length === 0) {
              state.settings.defaultModelConfigId = config.id;
            }
            state.settings.modelConfigs.push(config);
          });
        } catch (error) {
          handleStoreError('settingsStore', 'addModelConfig', error);
        }
      },
      updateModelConfig(id, updates) {
        try {
          set((state) => {
            // 如果是第一个配置，自动设为默认
            const configIndex = state.settings.modelConfigs.findIndex((c) => c.id === id);
            if (configIndex !== -1) {
              const updatedConfig = { ...state.settings.modelConfigs[configIndex], ...updates };
              state.settings.modelConfigs[configIndex] = updatedConfig;
            }
          });
        } catch (error) {
          handleStoreError('settingsStore', 'updateModelConfig', error);
        }
      },
      deleteModelConfig(id) {
        try {
          set((state) => {
            state.settings.modelConfigs = state.settings.modelConfigs.filter((c) => c.id !== id);
            // 如果删除的是默认配置，选择新的默认配置
            if (state.settings.defaultModelConfigId === id) {
              if (state.settings.modelConfigs.length > 0) {
                state.settings.defaultModelConfigId = state.settings.modelConfigs[0].id;
              } else {
                state.settings.defaultModelConfigId = undefined;
              }
            }
          });
        } catch (error) {
          handleStoreError('settingsStore', 'updateModelConfig', error);
        }
      },
      setDefaultModelConfig(id) {
        try {
          set((state) => {
            state.settings.defaultModelConfigId = id;
          });
        } catch (error) {
          handleStoreError('settingsStore', 'setDefaultModelConfig', error);
        }
      },
      getModelConfig(id) {
        return get().settings.modelConfigs.find((v) => v.id === id);
      },
      getDefaultModelConfig() {
        const { settings } = get();
        if (settings.defaultModelConfigId) {
          return settings.modelConfigs.find((c) => c.id === settings.defaultModelConfigId);
        }
        return settings.modelConfigs[0];
      },
      getModelConfigForLLM: (llmId) => {
        const { settings } = get();
        const llmConfig = settings.llmConfigs.find((c) => c.id === llmId);

        if (llmConfig?.modelConfigId) {
          // LLM配置有关联的ModelConfig
          return settings.modelConfigs.find((c) => c.id === llmConfig.modelConfigId);
        }
        // 没有关联，使用默认的ModelConfig
        if (settings.defaultModelConfigId) {
          return settings.modelConfigs.find((c) => c.id === settings.defaultModelConfigId);
        }
        // 返回第一个ModelConfig
        return settings.modelConfigs[0];
      },
      addPromptList: (config: PromptListConfig) => {
        try {
          set((state) => {
            if (!state.settings.promptLists) {
              state.settings.promptLists = [];
            }
            state.settings.promptLists.push(config);
          });
        } catch (error) {
          handleStoreError('settingsStore', 'addPromptList', error);
        }
      },
      updatePromptList: (id: string, updates: Partial<PromptListConfig>) => {
        try {
          set((state) => {
            if (state.settings.promptLists) {
              const currIndex = state.settings.promptLists.findIndex((v) => v.id === id);
              if (currIndex !== -1) {
                state.settings.promptLists[currIndex] = {
                  ...state.settings.promptLists[currIndex],
                  ...updates
                };
              }
            }
          });
        } catch (error) {
          handleStoreError('settingsStore', 'updatePromptList', error);
        }
      },
      deletePromptList(id) {
        try {
          set((state) => {
            if (state.settings.promptLists) {
              state.settings.promptLists = state.settings.promptLists.filter((v) => v.id !== id);
            }
          });
        } catch (error) {
          handleStoreError('settingsStore', 'deletePromptList', error);
        }
      },
      getPromptList(id) {
        return get().settings.promptLists?.find((v) => v.id === id);
      },
      exportSettings() {
        return get().settings;
      },
      importSettings: (settings) => {
        try {
          set((state) => {
            state.settings = settings;
          });
        } catch (error) {
          handleStoreError('settingsStore', 'importSettings', error);
        }
      },
      createAIServiceForLLM(llmId) {
        try {
          const { settings } = get();
          const llmConfig = settings.llmConfigs.find((c) => c.id === llmId);

          if (!llmConfig) {
            return null;
          }
          const modelConfig = get().getModelConfigForLLM(llmId);
          if (!modelConfig) {
            return null;
          }
          // return createAIService(llmConfig, modelConfig);
        } catch (error) {
          handleStoreError('settingsStore', 'createAIServiceForLLM', error);
          return null;
        }
      }
    })),
    createPersistConfig<SettingsState>('setting-store', 1, (state) => ({
      settings: state.settings
    }))
  )
);
