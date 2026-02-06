const { app, BrowserWindow, ipcMain, shell, session, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const unzipper = require('unzipper');
const { ElectronChromeExtensions } = require('electron-chrome-extensions');
const contextMenuRaw = require('electron-context-menu');
const contextMenu = contextMenuRaw.default || contextMenuRaw;

// Define persistent extensions directory
const USER_EXTENSIONS_PATH = path.join(app.getPath('userData'), 'InstalledExtensions');
const DISABLED_EXTENSIONS_PATH = path.join(app.getPath('userData'), 'disabled-extensions.json');
fs.ensureDirSync(USER_EXTENSIONS_PATH);

function getDisabledPaths() {
    try {
        if (fs.existsSync(DISABLED_EXTENSIONS_PATH)) {
            return fs.readJsonSync(DISABLED_EXTENSIONS_PATH);
        }
    } catch (e) {
        console.error('Error reading disabled extensions:', e);
    }
    return [];
}

function saveDisabledPaths(paths) {
    try {
        fs.writeJsonSync(DISABLED_EXTENSIONS_PATH, paths);
    } catch (e) {
        console.error('Error writing disabled extensions:', e);
    }
}

// Helper to load all installed extensions
async function loadInstalledExtensions(session) {
    try {
        const disabledPaths = getDisabledPaths();
        const dirs = await fs.readdir(USER_EXTENSIONS_PATH);
        for (const dir of dirs) {
            const extPath = path.join(USER_EXTENSIONS_PATH, dir);
            if (disabledPaths.includes(extPath)) {
                console.log(`Skipping disabled extension: ${extPath}`);
                continue;
            }
            if ((await fs.stat(extPath)).isDirectory()) {
                try {
                    await session.loadExtension(extPath);
                    console.log(`Loaded extension from: ${extPath}`);
                } catch (e) {
                    console.error(`Failed to load extension at ${extPath}:`, e);
                }
            }
        }
    } catch (e) {
        console.error('Error loading installed extensions:', e);
    }
}

// Initialize generic context menu
contextMenu({
    showSaveImageAs: true,
    showInspectElement: true,
    showCopyImage: true,
    showSearchWithGoogle: true
});

let extensions = null;
let downloadItems = new Map(); // Store download items by ID
let savedDownloadPath = app.getPath('downloads'); // Default

function createWindow(initialUrl = null) {
  const win = new BrowserWindow({
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

  // Keep track of the main window (last created one is usually the active one for some global logic, 
  // but ideally we should handle multiple)
  mainWindow = win;

  // In development, load from the Vite dev server
  let startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
  
  if (initialUrl) {
      const separator = startUrl.includes('?') ? '&' : '?';
      startUrl = `${startUrl}${separator}initialUrl=${encodeURIComponent(initialUrl)}`;
  }

  // Wait for vite to start in dev mode? Usually handled by concurrent running
  win.loadURL(startUrl);

  // Open DevTools in development
  // win.webContents.openDevTools({ mode: 'detach' }); 

  // Add F12 shortcut for DevTools
  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      win.webContents.toggleDevTools();
      event.preventDefault();
    }
  });
  
  // Clean up on close
  win.on('closed', () => {
      if (mainWindow === win) {
          mainWindow = null;
          // If there are other windows, promote one? 
          const all = BrowserWindow.getAllWindows();
          if (all.length > 0) mainWindow = all[0];
      }
  });

  return win;
}

  // Handle window controls from custom UI
  ipcMain.on('window-min', (event) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) win.minimize();
  });
  ipcMain.on('window-max', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    }
  });
  ipcMain.on('window-close', (event) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) win.close();
  });
  
  ipcMain.on('create-new-window', (event, url) => {
      createWindow(url);
  });
  
  ipcMain.on('open-new-tab', (event, url) => {
      if (mainWindow) {
          mainWindow.webContents.send('open-new-tab', url);
      }
  });
  
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
  ipcMain.handle('select-folder', async (event) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      const result = await dialog.showOpenDialog(win || mainWindow, {
          properties: ['openDirectory']
      });
      return result;
  });

  // Extensions Management Handlers
  ipcMain.handle('get-extensions', async () => {
    const loadedExtensions = session.defaultSession.getAllExtensions();
    const disabledPaths = getDisabledPaths();
    const installedDirs = await fs.readdir(USER_EXTENSIONS_PATH).catch(() => []);
    
    const extensionsList = [];

    // Process loaded extensions
    const loadedPaths = new Set();
    loadedExtensions.forEach(ext => {
        loadedPaths.add(ext.path);
        let optionsPage = null;
        if (ext.manifest.options_page) {
            optionsPage = `chrome-extension://${ext.id}/${ext.manifest.options_page}`;
        } else if (ext.manifest.options_ui && ext.manifest.options_ui.page) {
            optionsPage = `chrome-extension://${ext.id}/${ext.manifest.options_ui.page}`;
        }

        extensionsList.push({
            id: ext.id,
            name: ext.name,
            description: ext.description,
            version: ext.version,
            path: ext.path,
            enabled: true,
            optionsPage: optionsPage,
            homepageUrl: ext.manifest.homepage_url
        });
    });

    // Process disabled extensions (scan directories)
    for (const dir of installedDirs) {
        const extPath = path.join(USER_EXTENSIONS_PATH, dir);
        if (!loadedPaths.has(extPath)) {
             // It's not loaded. Check if it's a valid extension folder.
             try {
                 const manifestPath = path.join(extPath, 'manifest.json');
                 if (await fs.pathExists(manifestPath)) {
                     const manifest = await fs.readJson(manifestPath);
                     extensionsList.push({
                         id: null, // No ID when disabled
                         name: manifest.name,
                         description: manifest.description,
                         version: manifest.version,
                         path: extPath,
                         enabled: false,
                         optionsPage: null, // Can't open options if disabled
                         homepageUrl: manifest.homepage_url
                     });
                 }
             } catch (e) {
                 // Ignore invalid folders
             }
        }
    }

    return extensionsList;
  });

  ipcMain.handle('toggle-extension', async (event, { id, path: extPath, enabled }) => {
      try {
          const disabledPaths = getDisabledPaths();
          
          if (enabled) {
              // Enable: Load it and remove from disabled list
              await session.defaultSession.loadExtension(extPath);
              const newDisabledPaths = disabledPaths.filter(p => p !== extPath);
              saveDisabledPaths(newDisabledPaths);
          } else {
              // Disable: Unload it and add to disabled list
              if (id) {
                  session.defaultSession.removeExtension(id);
              }
              if (!disabledPaths.includes(extPath)) {
                  disabledPaths.push(extPath);
                  saveDisabledPaths(disabledPaths);
              }
          }
          return { success: true };
      } catch (error) {
          console.error('Toggle extension error:', error);
          return { success: false, error: error.message };
      }
  });

  ipcMain.handle('load-extension', async (event, sourcePath) => {
    try {
      // Logic:
      // 1. Check if source is CRX or Directory
      // 2. If CRX, unzip to USER_EXTENSIONS_PATH/<random_id> or <name>
      // 3. If Directory, copy to USER_EXTENSIONS_PATH/<name> (to ensure persistence and independence)
      // 4. Load from the new persistent location
      
      const stats = await fs.stat(sourcePath);
      let installDir;
      let manifest = {};

      if (stats.isDirectory()) {
          // It's an unpacked extension
          // Read manifest to get name/version for folder naming
          try {
              manifest = await fs.readJson(path.join(sourcePath, 'manifest.json'));
          } catch (e) {
              return { success: false, error: 'Invalid extension: manifest.json missing' };
          }
          
          const folderName = `${manifest.name.replace(/[^a-z0-9]/gi, '_')}-${manifest.version}-${Date.now()}`;
          installDir = path.join(USER_EXTENSIONS_PATH, folderName);
          
          await fs.copy(sourcePath, installDir);
      } else if (sourcePath.toLowerCase().endsWith('.crx') || sourcePath.toLowerCase().endsWith('.zip')) {
          // It's a CRX or Zip
          const folderName = `extension-${Date.now()}`;
          installDir = path.join(USER_EXTENSIONS_PATH, folderName);
          
          let buffer = await fs.readFile(sourcePath);
          
          // Check for CRX header and strip it if present (CRX2/3)
          if (sourcePath.toLowerCase().endsWith('.crx')) {
              // CRX files start with "Cr24". Zip starts with "PK\x03\x04".
              // We search for the ZIP local file header signature "PK\x03\x04" (0x50 0x4B 0x03 0x04)
              // and slice everything before it.
              const zipStart = buffer.indexOf(Buffer.from([0x50, 0x4B, 0x03, 0x04]));
              if (zipStart !== -1) {
                  buffer = buffer.slice(zipStart);
                  console.log(`Stripped CRX header, zip starts at offset ${zipStart}`);
              } else {
                  return { success: false, error: 'Invalid CRX file: Zip header not found' };
              }
          }

          // Use unzipper with buffer
          const directory = await unzipper.Open.buffer(buffer);
          await directory.extract({ path: installDir });
            
          // Check manifest
          if (!fs.existsSync(path.join(installDir, 'manifest.json'))) {
              // Maybe it's inside a subfolder?
              const subItems = await fs.readdir(installDir);
              if (subItems.length === 1 && (await fs.stat(path.join(installDir, subItems[0]))).isDirectory()) {
                  // Move content up
                  const subPath = path.join(installDir, subItems[0]);
                  const tempPath = path.join(USER_EXTENSIONS_PATH, folderName + '_temp');
                  await fs.move(subPath, tempPath);
                  await fs.remove(installDir);
                  await fs.move(tempPath, installDir);
              }
          }
      } else {
          return { success: false, error: 'Unsupported file type' };
      }

      // Load from persistent path
      const ext = await session.defaultSession.loadExtension(installDir);
      return { success: true, extension: { id: ext.id, name: ext.name, version: ext.version } };
    } catch (error) {
      console.error('Failed to install extension:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('remove-extension', async (event, id) => {
    try {
      const ext = session.defaultSession.getExtension(id);
      if (!ext) return { success: false, error: 'Extension not found' };
      
      const extPath = ext.path; // This is the path on disk
      
      // Unload
      session.defaultSession.removeExtension(id);
      
      // Delete from disk if it is in our managed folder
      if (extPath.startsWith(USER_EXTENSIONS_PATH)) {
          await fs.remove(extPath);
      }
      
      // Also remove from disabled list if present
      const disabledPaths = getDisabledPaths();
      if (disabledPaths.includes(extPath)) {
          saveDisabledPaths(disabledPaths.filter(p => p !== extPath));
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Open Extension File Dialog
  ipcMain.handle('select-extension-file', async (event) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      const result = await dialog.showOpenDialog(win || mainWindow, {
          properties: ['openFile'],
          filters: [{ name: 'Extensions', extensions: ['crx', 'zip'] }]
      });
      return result;
  });

  // User Agent Handler
  ipcMain.on('set-user-agent', (event, userAgent) => {
      if (session.defaultSession) {
          session.defaultSession.setUserAgent(userAgent);
      }
      app.userAgentFallback = userAgent;
  });

app.whenReady().then(() => {
  createWindow();

  // Initialize Chrome Extensions Support
  extensions = new ElectronChromeExtensions({
    license: 'GPL-3.0', // Required field to acknowledge license
    session: session.defaultSession,
    modulePath: path.join(app.getPath('userData'), 'ExtensionState'), // Directory to store persistent extension state/settings
    createTab: async (details) => {
        if (mainWindow) {
            mainWindow.webContents.send('open-new-tab', details.url || 'browser://newtab');
            // Do NOT return mainWindow.webContents here as it binds the new tab to the UI window
            // which causes issues with extensions expecting a separate webContents.
            // returning undefined lets the library handle it (or wait for addTab to register it).
            return undefined;
        }
    }
  });

  // Load User Installed Extensions
  loadInstalledExtensions(session.defaultSession);

  // Set Firefox User-Agent to pass Google security checks (Firefox is less strictly checked than Chrome/Electron)
  const firefoxUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0';
  session.defaultSession.setUserAgent(firefoxUserAgent);
  app.userAgentFallback = firefoxUserAgent;

  // Strip headers that prevent embedding (fixes infinite redirects and login issues)
  session.defaultSession.webRequest.onHeadersReceived({ urls: ['*://*/*'] }, (details, callback) => {
    const { responseHeaders } = details;
    if (!responseHeaders) return callback({ cancel: false, responseHeaders });
    
    const headerKeys = Object.keys(responseHeaders);
    const filteredHeaders = headerKeys.reduce((acc, key) => {
      const lowerKey = key.toLowerCase();
      // Expanded list of headers to strip for maximum compatibility with Google/MS Workspace
      // But we MUST be careful not to break Cloudflare Turnstile which relies on some security headers
      // Actually, removing CSP is usually good for embedding, but some sites need it to run their own scripts.
      // For general browsing compatibility, removing X-Frame-Options is the most critical one.
      if (
        lowerKey !== 'x-frame-options' &&
        // Only strip CSP if it blocks frame-ancestors or is too restrictive. 
        // Stripping it entirely can sometimes break scripts that rely on specific policies (rare but possible).
        // Safest bet for "unblocking" is to strip it, but if Turnstile fails, we might need to be more selective.
        // Let's try keeping CSP but removing frame-ancestors if present, or just keep stripping it as Comet does.
        // Comet strips it entirely.
        lowerKey !== 'content-security-policy' &&
        lowerKey !== 'content-security-policy-report-only' &&
        lowerKey !== 'cross-origin-resource-policy' &&
        lowerKey !== 'cross-origin-opener-policy' &&
        lowerKey !== 'cross-origin-embedder-policy' &&
        lowerKey !== 'cross-origin-embedder-policy-report-only'
      ) {
        acc[key] = responseHeaders[key];
      }
      return acc;
    }, {});

    callback({ cancel: false, responseHeaders: filteredHeaders });
  });

  // Add Referer spoofing for Cloudflare and other sensitive sites
  session.defaultSession.webRequest.onBeforeSendHeaders({ urls: ['*://*/*'] }, (details, callback) => {
      const { requestHeaders, url } = details;
      const urlObj = new URL(url);
      
      // If we are on a Cloudflare challenge page or Google login, ensure Referer is consistent
      if (urlObj.hostname.includes('cloudflare.com') || urlObj.hostname.includes('google.com')) {
          // Sometimes missing referer triggers checks. 
          // If referer is missing or empty, set it to the origin
          if (!requestHeaders['Referer']) {
              requestHeaders['Referer'] = urlObj.origin + '/';
          }
      }
      callback({ cancel: false, requestHeaders });
  });

  // Debug redirect loops & Prevent Infinite Loops
  const redirectCounts = new Map();
  const navigationHistory = new Map(); // Store last navigation time per URL
  
  session.defaultSession.webRequest.onBeforeRedirect((details) => {
      const url = details.url;
      const count = (redirectCounts.get(url) || 0) + 1;
      redirectCounts.set(url, count);
      
      console.log(`[Redirect] ${details.url} -> ${details.redirectURL} (${details.statusCode}) [Count: ${count}]`);

      // Reset count after 10 seconds
      setTimeout(() => redirectCounts.delete(url), 10000);
  });

  // Prevent infinite navigation loops (especially for Google Account pages)
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
      // Check for Google Account infinite refresh
      if (details.url.includes('myaccount.google.com') || details.url.includes('accounts.google.com')) {
          const now = Date.now();
          const lastTime = navigationHistory.get(details.url) || 0;
          
          // If requesting the same URL within 500ms, it's likely a loop
          if (now - lastTime < 500) {
              console.log(`[Loop Prevention] Blocked rapid navigation to: ${details.url}`);
              // We don't block it completely, but maybe redirect to a stable page or just log it for now.
              // Blocking might cause a crash or white screen if not handled.
              // Let's try to let it pass but maybe delay it? Electron doesn't support delay here easily.
              // For now, let's just update the timestamp.
          }
          navigationHistory.set(details.url, now);
      }
      callback({ cancel: false });
  });

  // Setup Download Listener on Default Session
  session.defaultSession.on('will-download', (event, item, webContents) => {
    // Set save path
    item.setSavePath(path.join(savedDownloadPath, item.getFilename()));

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    downloadItems.set(id, item);

    // Send start event
    // Broadcast to all windows or try to find the relevant one.
    // Since downloads are global in the session, broadcasting is safest for UI updates.
    BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('download-started', {
            id,
            filename: item.getFilename(),
            totalBytes: item.getTotalBytes(),
            path: item.getSavePath(),
            startTime: Date.now()
        });
    });

    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        BrowserWindow.getAllWindows().forEach(win => win.webContents.send('download-interrupted', { id }));
      } else if (state === 'progressing') {
        if (item.isPaused()) {
            BrowserWindow.getAllWindows().forEach(win => win.webContents.send('download-paused', { id }));
        } else {
            BrowserWindow.getAllWindows().forEach(win => {
                win.webContents.send('download-progress', {
                    id,
                    receivedBytes: item.getReceivedBytes(),
                    totalBytes: item.getTotalBytes()
                });
            });
        }
      }
    });

    item.once('done', (event, state) => {
      if (state === 'completed') {
        BrowserWindow.getAllWindows().forEach(win => win.webContents.send('download-complete', { id, path: item.getSavePath() }));
      } else if (state === 'cancelled') {
        BrowserWindow.getAllWindows().forEach(win => win.webContents.send('download-cancelled', { id }));
      } else {
        BrowserWindow.getAllWindows().forEach(win => win.webContents.send('download-failed', { id, state }));
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
    // Ignore non-fatal errors (like ERR_ABORTED -3 and ERR_BLOCKED_BY_RESPONSE -27) to prevent UI disruption
    // We attach this immediately to catch early load failures
    contents.on('did-navigate', (event, url) => {
        // Fix for Google Account page turning blank (about:blank) after login
        if (url === 'about:blank') {
            console.log('[WebView] Navigated to about:blank. Attempting recovery...');
            setTimeout(() => {
                // If we can go back, do it. Otherwise, try to reload.
                if (!contents.isDestroyed() && contents.canGoBack()) {
                    contents.goBack();
                } else {
                   // If we can't go back, maybe we should just reload?
                   // contents.reload(); 
                   // But reloading about:blank does nothing.
                }
            }, 500);
        }
    });

    contents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        // -3: ERR_ABORTED (Harmless cancellation, often happens during redirects)
        // -27: ERR_BLOCKED_BY_RESPONSE (Common with ad blockers or aggressive security headers)
        if (errorCode === -3 || errorCode === -27) {
             console.log(`[WebView] Ignoring harmless error ${errorCode} for ${validatedURL}`);
             event.preventDefault();
             // If the page is blank (about:blank or empty), try to reload or navigate to the URL again after a short delay
             // This fixes the "blank screen after redirect" issue
             if (contents.getURL() === 'about:blank' || contents.getURL() === '') {
                 setTimeout(() => {
                     // For Bilibili specifically, try to remove query params if infinite loop
                     if (validatedURL.includes('bilibili.com')) {
                         contents.loadURL(validatedURL);
                     } else {
                         contents.loadURL(validatedURL);
                     }
                 }, 100);
             }
        } else {
             console.error('[WebView] Load failed:', errorCode, errorDescription);
        }
    });

    // Handle Context Menus for Extensions
    if (contents.getType() === 'webview') {
       // Enable context menu for webviews with extension items
       contextMenu({ 
           window: contents, 
           showSaveImageAs: true, 
           showInspectElement: true, 
           showSearchWithGoogle: true,
           prepend: (defaultActions, params, browserWindow) => {
               if (extensions) {
                   try {
                       return extensions.getContextMenuItems(contents, params);
                   } catch (e) {
                       console.error('Error getting extension context menu items:', e);
                       return [];
                   }
               }
               return [];
           }
       });

       // Inject advanced anti-detection scripts (window.top/parent spoofing)
       contents.executeJavaScript(`
         try {
           const secretSelf = window;
           try {
               Object.defineProperty(window, 'top', { get: () => secretSelf, configurable: true });
               Object.defineProperty(window, 'parent', { get: () => secretSelf, configurable: true });
               Object.defineProperty(window, 'opener', { get: () => null, configurable: true });
           } catch (e) {}
           Object.defineProperty(document, 'referrer', { get: () => '', configurable: false });
           
           if (window.location.hostname.includes('google.com')) {
               const style = document.createElement('style');
               style.textContent = 'body { overflow: auto !important; } #gb { display: flex !important; }';
               document.head.appendChild(style);
           }
         } catch(e) {}
       `).catch(() => {});

       // Register the tab with the extension system so it can be found by ID
       if (extensions && mainWindow) {
           extensions.addTab(contents, mainWindow);
       }
    }

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
