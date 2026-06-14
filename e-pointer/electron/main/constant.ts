export enum APP_EVENT {
  PING = 'ping',
  ENV_INFO = 'get-env-info',
  APP_INFO = 'get-app-info'
}

export enum WINDOW_EVENT {
  MINIMIZE = 'window-minimize',
  MAXIMIZE = 'window-maximize',
  CLOSE = 'window-close',
  IS_MAX = 'window-is-maximized'
}

export enum UPDATER_EVENT {
  CHECK = 'check-for-updates',
  AVAILABLE = 'update-available',
  NOT_AVAILABLE = 'update-not-available',
  DOWNLOAD = 'download-update',
  DOWNLOAD_PROGRESS = 'download-progress',
  DOWNLOADED = 'update-downloaded',
  QUIT = 'quit-and-install',
  ERROR = 'error'
}

export enum AI_EVENT {
  SEND_STREAM = 'ai:send-message-streaming',
  STOP_STREAM = 'ai:stop-streaming',
  TEST_CONNECTION = 'ai:test-connection',
  GET_MODELS = 'ai:get-models'
}

export enum FILE_EVENT {
  SAVE = 'save-file',
  SELECT = 'select-file',
  READ = 'read-file'
}
