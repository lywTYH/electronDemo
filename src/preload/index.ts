/**
 * @module preload
 */
import {ipcRenderer} from 'electron';

export {sha256sum} from './src/nodeCrypto';
export {versions} from './src/versions';

export const toggle = () => ipcRenderer.invoke('dark-mode:toggle');
export const system = () => ipcRenderer.invoke('dark-mode:system');
export const foo = 'foo string';
