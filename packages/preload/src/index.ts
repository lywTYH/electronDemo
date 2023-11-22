/**
 * @module preload
 */
import {contextBridge, ipcRenderer} from 'electron';

export {sha256sum} from './nodeCrypto';
export {versions} from './versions';

contextBridge.exposeInMainWorld('darkMode', {
  toggle: () => ipcRenderer.invoke('dark-mode:toggle'),
  system: () => ipcRenderer.invoke('dark-mode:system'),
});
