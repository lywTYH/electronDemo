import { DownloadProgress, UpdateInfo } from '../stores/updateStore';

global {
  interface Window {
    api: {
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
  }
}
