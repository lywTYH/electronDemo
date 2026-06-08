import { ipcMain, BrowserWindow } from 'electron';
import { startChat, cancelChat } from './chat';

export function registerIpcHandlers(getWindow: () => BrowserWindow | null) {
  ipcMain.handle('chat-start', async (_, { requestId, message }: { requestId: string; message: string }) => {
    const win = getWindow();
    return startChat(requestId, message, win);
  });
  ipcMain.on('chat-cancel', (_, { requestId }: { requestId: string }) => {
    cancelChat(requestId);
    const win = getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('chat-cancelled', { requestId });
    }
  });
}
