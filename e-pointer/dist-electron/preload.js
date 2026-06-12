let electron = require("electron");
//#region electron/preload/preload.ts
var api = { updater: {
	checkForUpdates: () => electron.ipcRenderer.invoke("check-for-updates"),
	downloadUpdate: () => electron.ipcRenderer.invoke("download-update"),
	onUpdateAvailable: (callback) => {
		electron.ipcRenderer.on("update-available", (_, info) => callback(info));
	},
	onUpdateNotAvailable: (callback) => {
		electron.ipcRenderer.on("update-not-available", (_, info) => callback(info));
	},
	onUpdateError: (callback) => {
		electron.ipcRenderer.on("update-error", (_, error) => callback(error));
	},
	onDownloadProgress: (callback) => {
		electron.ipcRenderer.on("download-progress", (_, progress) => callback(progress));
	},
	onUpdateDownloaded: (callback) => {
		electron.ipcRenderer.on("update-downloaded", (_, info) => callback(info));
	},
	removeAllUpdateListeners: () => {
		electron.ipcRenderer.removeAllListeners("update-available");
		electron.ipcRenderer.removeAllListeners("update-not-available");
		electron.ipcRenderer.removeAllListeners("download-progress");
		electron.ipcRenderer.removeAllListeners("update-downloaded");
		electron.ipcRenderer.removeAllListeners("update-error");
	}
} };
var windowAPI = {
	minimize: () => electron.ipcRenderer.invoke("window-minimize"),
	maximize: () => electron.ipcRenderer.invoke("window-maximize"),
	close: () => electron.ipcRenderer.invoke("window-close"),
	isMaximized: () => electron.ipcRenderer.invoke("window-is-maximized"),
	getEnvInfo: () => electron.ipcRenderer.invoke("get-env-info")
};
electron.contextBridge.exposeInMainWorld("api", api);
electron.contextBridge.exposeInMainWorld("electronWindow", windowAPI);
//#endregion
