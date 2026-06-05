import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import OpenAI from 'openai';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
  createWindow();
  ipcMain.handle('chat-completion', async (_, message) => {
    // return handleChatCompletion(message);
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// const { app, BrowserWindow, ipcMain } = require('electron');
// const path = require('path');
// const OpenAI = require('openai');

// let mainWindow;
// let abortController = null;

// // Konfigurasi OpenAI client
// const client = new OpenAI({
//   baseURL: 'http://localhost:1234/v1',
//   apiKey: 'no-key-required',
//   timeout: 180000 // Timeout 3 menit
// });

// // Fungsi untuk membersihkan respons dari tag dan teks non-JSON
// function cleanAIResponse(rawContent) {
//   // Hapus semua tag <think> dan </think>
//   let cleaned = rawContent.replace(/<\/?think>/g, '');
//   // Hapus semua teks sebelum dan sesudah objek JSON
//   cleaned = cleaned.replace(/^[\s\S]*?(\{[\s\S]*\})[\s\S]*$/, '$1');
//   // Hapus karakter kontrol dan whitespace berlebih
//   return cleaned
//     .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
//     .trim();
// }

// function createWindow() {
//   mainWindow = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     webPreferences: {
//       nodeIntegration: false,
//       contextIsolation: true,
//       preload: path.join(__dirname, 'preload.js')
//     }
//   });

//   mainWindow.loadFile('index.html');
// }

// async function handleChatCompletion(message) {
//   abortController = new AbortController();
//   const timeout = setTimeout(() => {
//     abortController.abort();
//     mainWindow.webContents.send('chat-error', 'Timeout: Proses terlalu lama');
//   }, 180000);

//   try {
//     const completion = await client.chat.completions.create({
//       model: 'deepseek-r1-distill-qwen-1.5b',
//       messages: [
//         {
//           role: "system",
//           content: `WAJIB merespons dalam format JSON TANPA markup atau teks tambahan.`
//         },
//         {
//           role: 'user',
//           content: message
//         }
//       ],
//       temperature: 0.7,
//       max_tokens: 1024,
//       stream: false,
//       signal: abortController.signal
//     });

//     const rawContent = completion.choices[0]?.message?.content || '';
//     console.log('Raw Response:\n\n', rawContent);

//     // Bersihkan respons
//     const cleanedContent = cleanAIResponse(rawContent);
//     console.log('Cleaned Content:\n\n', cleanedContent);

//     mainWindow.webContents.send('chat-update', cleanedContent);

//   } catch (error) {
//     console.error('Error:', error);
//     if (!mainWindow.isDestroyed()) {
//       mainWindow.webContents.send('chat-error', error.message);
//     }
//   } finally {
//     clearTimeout(timeout);
//     abortController = null;
//   }
// }

// app.whenReady().then(() => {
//   createWindow();

//   // Tangani permintaan chat dari renderer process
//   ipcMain.handle('chat-completion', async (_, message) => {
//     return handleChatCompletion(message);
//   });

//   app.on('activate', () => {
//     if (BrowserWindow.getAllWindows().length === 0) {
//       createWindow();
//     }
//   });
// });
