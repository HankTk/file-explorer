const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  readDirectory: (path) => ipcRenderer.invoke('read-directory', path),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  openFile: (path) => ipcRenderer.invoke('open-file', path),
  readFileContent: (path) => ipcRenderer.invoke('read-file-content', path),
  getCurrentDirectory: () => ipcRenderer.invoke('get-current-directory'),
  getHomeDirectory: () => ipcRenderer.invoke('get-home-directory'),
  searchFiles: (directory, query) => ipcRenderer.invoke('search-files', directory, query),
  canGoBack: () => ipcRenderer.invoke('can-go-back'),
  goBack: () => ipcRenderer.invoke('go-back'),
  canGoUp: (path) => ipcRenderer.invoke('can-go-up', path),
  getParentDirectory: (path) => ipcRenderer.invoke('get-parent-directory', path),
  checkPathExists: (path) => ipcRenderer.invoke('check-path-exists', path),
  isDirectory: (path) => ipcRenderer.invoke('is-directory', path),
  openFileWithApp: (path) => ipcRenderer.invoke('open-file-with-app', path),
  getPlatform: () => process.platform,
  copyItem: (sourcePath) => ipcRenderer.invoke('copy-item', sourcePath),
  pasteItem: (sourcePath, destinationPath) => ipcRenderer.invoke('paste-item', sourcePath, destinationPath),
  renameItem: (oldPath, newPath) => ipcRenderer.invoke('rename-item', oldPath, newPath),
  deleteItem: (path) => ipcRenderer.invoke('delete-item', path),
  readImageFile: (path, highQuality) => ipcRenderer.invoke('read-image-file', path, highQuality),
  readRawFile: (path) => ipcRenderer.invoke('read-raw-file', path)
}); 