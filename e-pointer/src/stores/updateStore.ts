import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface UpdateInfo {
  version?: string;
  releaseDate?: string;
  releaseName?: string;
  releaseNotes?: string;
}

export interface DownloadProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

export interface UpdateState {
  // 基本状态
  currentVersion: string;
  checkingForUpdates: boolean;
  downloading: boolean;
  updateAvailable: boolean;
  updateDownloaded: boolean;
  error: string | null;
  autoCheckEnabled: boolean;

  // 更新信息
  updateInfo: UpdateInfo | null;
  downloadProgress: DownloadProgress | null;

  // 通知状态
  notificationShown: boolean;
  downloadNotificationKey: string | null;
  downloadNotificationHidden: boolean;
  // 检查类型标识（区分启动检查和手动检查）
  isStartupCheck: boolean;
}

export interface UpdateActions {
  // 基本状态管理
  setIsStartupCheck: (isStartup: boolean) => void;
  // setCurrentVersion: (version: string) => void
  setAutoCheckEnabled: (enabled: boolean) => void;
  // 通知状态管理
  setDownloadNotificationKey: (key: string | null) => void;
  setDownloadNotificationHidden: (hidden: boolean) => void;
  // 复合操作
  handleUpdateAvailable: (info: UpdateInfo) => void;
  handleUpdateNotAvailable: () => void;
  handleDownloadProgress: (progress: DownloadProgress) => void;
  handleUpdateDownloaded: (info: UpdateInfo) => void;
  handleUpdateError: (error: string) => void;

  resetUpdateState: () => void;
}

const initialState: UpdateState = {
  currentVersion: '',
  checkingForUpdates: false,
  downloading: false,
  updateAvailable: false,
  updateDownloaded: false,
  error: null,
  autoCheckEnabled: true,
  updateInfo: null,
  downloadProgress: null,
  notificationShown: false,
  downloadNotificationKey: null,
  downloadNotificationHidden: false,
  isStartupCheck: false
};

export const useUpdateStore = create<UpdateState & UpdateActions>()(
  immer((set, get) => ({
    ...initialState,
    setIsStartupCheck: (isStartup) =>
      set((state) => {
        state.isStartupCheck = isStartup;
      }),

    // // 基本状态管理
    // setCurrentVersion: (version) =>
    //   set((state) => {
    //     state.currentVersion = version
    //   }),

    setAutoCheckEnabled: (enabled) =>
      set((state) => {
        state.autoCheckEnabled = enabled;
      }),

    setDownloadNotificationKey: (key) =>
      set((state) => {
        state.downloadNotificationKey = key;
      }),

    setDownloadNotificationHidden: (hidden) =>
      set((state) => {
        state.downloadNotificationHidden = hidden;
      }),

    // 复合操作
    resetUpdateState: () =>
      set((state) => {
        state.checkingForUpdates = false;
        state.downloading = false;
        state.updateAvailable = false;
        state.updateDownloaded = false;
        state.error = null;
        state.updateInfo = null;
        state.downloadProgress = null;
        state.notificationShown = false;
        state.downloadNotificationKey = null;
        state.downloadNotificationHidden = false;
        state.isStartupCheck = false;
      }),

    handleUpdateAvailable: (info) =>
      set((state) => {
        state.updateAvailable = true;
        state.updateInfo = info;
        state.checkingForUpdates = false;
        state.error = null;
        state.notificationShown = true;
      }),

    handleUpdateNotAvailable: () =>
      set((state) => {
        state.updateAvailable = false;
        state.updateInfo = null;
        state.checkingForUpdates = false;
        state.error = null;
      }),

    handleDownloadProgress: (progress) =>
      set((state) => {
        state.downloadProgress = progress;
      }),

    handleUpdateDownloaded: (info) =>
      set((state) => {
        state.updateDownloaded = true;
        state.downloading = false;
        state.downloadProgress = null;
        state.updateInfo = info;
      }),

    handleUpdateError: (error) =>
      set((state) => {
        state.error = error;
        state.checkingForUpdates = false;
        state.downloading = false;
        state.downloadProgress = null;
      })
  }))
);
