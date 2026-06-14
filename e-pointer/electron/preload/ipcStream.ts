import { ipcRenderer } from 'electron';

export function listenIPCStream<T extends { type: string }>(
  eventChannel: string,
  onData: (data: T) => void,
  onDone: (err?: Error) => void
) {
  const handler = (_: Electron.IpcRendererEvent, data: T & Record<string, unknown>) => {
    if (data.type === 'complete') {
      cleanup();
      onDone();
    } else if (data.type === 'error') {
      cleanup();
      onDone(new Error((data.error as string) || 'Unknown error'));
    } else {
      onData(data);
    }
  };

  const cleanup = () => {
    ipcRenderer.removeListener(eventChannel, handler);
  };

  ipcRenderer.on(eventChannel, handler);
  return cleanup;
}
