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
  AI_SEND_STREAM = 'ai:send-message-streaming',
  AI_STOP_STREAM = 'ai:stop-streaming',
  AI_TEST_CONNECTION = 'ai:test-connection',
  AI_GET_MODELS = 'ai:get-models'
}
