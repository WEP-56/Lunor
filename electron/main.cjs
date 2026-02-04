const { app, BrowserWindow, ipcMain, shell, session, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let downloadItems = new Map(); // Store download items by ID
let savedDownloadPath = app.getPath('downloads'); // Default

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    frame: false, // Frameless as requested
    transparent: false, // Disabled transparency to fix Windows native behaviors (snap, maximize restore)
    backgroundColor: '#ffffff', // Set opaque background
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true // Enable webview tag for browsing
    }
  });

  // In development, load from the Vite dev server
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
  
  // Wait for vite to start in dev mode? Usually handled by concurrent running
  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  // mainWindow.webContents.openDevTools({ mode: 'detach' }); 

  // Add F12 shortcut for DevTools
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  // Handle window controls from custom UI
  ipcMain.on('window-min', () => mainWindow.minimize());
  ipcMain.on('window-max', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMain.on('window-close', () => mainWindow.close());
  
  // System Settings handlers
  ipcMain.on('open-proxy-settings', () => {
    // Open system proxy settings (Windows 10/11)
    shell.openExternal('ms-settings:network-proxy');
  });

  // Download Path Handler
  ipcMain.on('set-download-path', (event, path) => {
    savedDownloadPath = path;
  });

  // Download Control Handlers
  ipcMain.on('download-pause', (event, id) => {
    const item = downloadItems.get(id);
    if (item) item.pause();
  });

  ipcMain.on('download-resume', (event, id) => {
    const item = downloadItems.get(id);
    if (item && item.canResume()) item.resume();
  });

  ipcMain.on('download-cancel', (event, id) => {
    const item = downloadItems.get(id);
    if (item) item.cancel();
  });

  ipcMain.on('open-path', (event, path) => {
      shell.openPath(path);
  });

  // Select Folder Handler
  ipcMain.handle('select-folder', async () => {
      const result = await dialog.showOpenDialog(mainWindow, {
          properties: ['openDirectory']
      });
      return result;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Setup Download Listener on Default Session
  session.defaultSession.on('will-download', (event, item, webContents) => {
    // Set save path
    item.setSavePath(path.join(savedDownloadPath, item.getFilename()));

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    downloadItems.set(id, item);

    // Send start event
    if (mainWindow) {
        mainWindow.webContents.send('download-started', {
            id,
            filename: item.getFilename(),
            totalBytes: item.getTotalBytes(),
            path: item.getSavePath(),
            startTime: Date.now()
        });
    }

    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        if (mainWindow) mainWindow.webContents.send('download-interrupted', { id });
      } else if (state === 'progressing') {
        if (item.isPaused()) {
            if (mainWindow) mainWindow.webContents.send('download-paused', { id });
        } else {
            if (mainWindow) {
                mainWindow.webContents.send('download-progress', {
                    id,
                    receivedBytes: item.getReceivedBytes(),
                    totalBytes: item.getTotalBytes()
                });
            }
        }
      }
    });

    item.once('done', (event, state) => {
      if (state === 'completed') {
        if (mainWindow) mainWindow.webContents.send('download-complete', { id, path: item.getSavePath() });
      } else if (state === 'cancelled') {
        if (mainWindow) mainWindow.webContents.send('download-cancelled', { id });
      } else {
        if (mainWindow) mainWindow.webContents.send('download-failed', { id, state });
      }
      // Clean up map eventually, but maybe keep for resume if failed? 
      // For now we just keep it in memory or clean it up if cancelled/completed.
      if (state === 'cancelled' || state === 'completed') {
          downloadItems.delete(id);
      }
    });
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Intercept all new window creation events from webviews
  app.on('web-contents-created', (event, contents) => {
    if (contents.getType() === 'webview') {
      contents.setWindowOpenHandler((details) => {
        // Deny the native window creation
        // Send the requested URL to the main renderer window to open in a new tab
        if (mainWindow) {
          mainWindow.webContents.send('open-new-tab', details.url);
        }
        return { action: 'deny' };
      });
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
