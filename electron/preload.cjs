const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-min'),
  maximize: () => ipcRenderer.send('window-max'),
  close: () => ipcRenderer.send('window-close'),
  openProxySettings: () => ipcRenderer.send('open-proxy-settings'),
  onOpenNewTab: (callback) => {
    const listener = (_event, url) => callback(url);
    ipcRenderer.on('open-new-tab', listener);
    return () => ipcRenderer.removeListener('open-new-tab', listener);
  },
  // Download API
  setDownloadPath: (path) => ipcRenderer.send('set-download-path', path),
  pauseDownload: (id) => ipcRenderer.send('download-pause', id),
  resumeDownload: (id) => ipcRenderer.send('download-resume', id),
  cancelDownload: (id) => ipcRenderer.send('download-cancel', id),
  openPath: (path) => ipcRenderer.send('open-path', path),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  
  onDownloadStarted: (callback) => {
      const listener = (_event, data) => callback(data);
      ipcRenderer.on('download-started', listener);
      return () => ipcRenderer.removeListener('download-started', listener);
  },
  onDownloadProgress: (callback) => {
      const listener = (_event, data) => callback(data);
      ipcRenderer.on('download-progress', listener);
      return () => ipcRenderer.removeListener('download-progress', listener);
  },
  onDownloadInterrupted: (callback) => {
      const listener = (_event, data) => callback(data);
      ipcRenderer.on('download-interrupted', listener);
      return () => ipcRenderer.removeListener('download-interrupted', listener);
  },
  onDownloadPaused: (callback) => {
      const listener = (_event, data) => callback(data);
      ipcRenderer.on('download-paused', listener);
      return () => ipcRenderer.removeListener('download-paused', listener);
  },
  onDownloadComplete: (callback) => {
      const listener = (_event, data) => callback(data);
      ipcRenderer.on('download-complete', listener);
      return () => ipcRenderer.removeListener('download-complete', listener);
  },
  onDownloadCancelled: (callback) => {
      const listener = (_event, data) => callback(data);
      ipcRenderer.on('download-cancelled', listener);
      return () => ipcRenderer.removeListener('download-cancelled', listener);
  },
  onDownloadFailed: (callback) => {
      const listener = (_event, data) => callback(data);
      ipcRenderer.on('download-failed', listener);
      return () => ipcRenderer.removeListener('download-failed', listener);
  },
  
  // Extensions API
  getExtensions: () => ipcRenderer.invoke('get-extensions'),
  loadExtension: (path) => ipcRenderer.invoke('load-extension', path),
  removeExtension: (id) => ipcRenderer.invoke('remove-extension', id),
  toggleExtension: (data) => ipcRenderer.invoke('toggle-extension', data),
  selectExtensionFile: () => ipcRenderer.invoke('select-extension-file'),
  selectExtensionFolder: () => ipcRenderer.invoke('select-folder'), // Reuse select folder for unpacked extensions
  
  // System API
  setUserAgent: (ua) => ipcRenderer.send('set-user-agent', ua),
  createNewWindow: (url) => ipcRenderer.send('create-new-window', url),
  openNewTab: (url) => ipcRenderer.send('open-new-tab', url)
});
