import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createPersistConfig } from './persistence/storeConfig';

export interface SettingsState {
  settings:any
}
export interface SettingsActions {}
export const useSettingsStore = create<SettingsState & SettingsActions>(
  persist(
    immer(() => {}),
    createPersistConfig('setting-store',1,(state)=>({
     settings:  state.settings
    })
  )
);
