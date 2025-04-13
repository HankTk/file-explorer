const { app, BrowserWindow, dialog, shell } = require('electron');
const windowService = require('../services/windowService');
const { setupIpcHandlers } = require('../handler/ipcHandlers');

// Initialize Application
app.whenReady().then(() => {
  windowService.createWindow();
  setupIpcHandlers();
});

// Activated
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    windowService.createWindow();
  }
});

// Window All Closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
