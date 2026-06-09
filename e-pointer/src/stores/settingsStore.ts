import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { Settings } from '../types/types';
import { INITIAL_SETTINGS } from './helpers/constants';
import { createPersistConfig } from './persistence/storeConfig';

export interface SettingsState {
  settings: Settings;
}
export interface SettingsActions {}

const initialState: SettingsState = {
  settings: INITIAL_SETTINGS
};
export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    immer((set, get) => ({
      ...initialState
    })),
    createPersistConfig<SettingsState>('setting-store', 1, (state) => ({
      settings: state.settings
    }))
  )
);
