import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { LLMConfig, Settings } from '../types/types';
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
      }
    })),
    createPersistConfig<SettingsState>('setting-store', 1, (state) => ({
      settings: state.settings
    }))
  )
);
