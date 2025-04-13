const { BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { WINDOW } = require('../constant/constants');

class WindowService {
  constructor() {
    this.mainWindow = null;
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: WINDOW.WIDTH,
      height: WINDOW.HEIGHT,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload/preload.js'),
        enableWebSQL: false,
        enableRemoteModule: false,
        partition: 'persist:fileexplorer'
      }
    });

    this.setupWindowLoad();
    this.setupErrorHandling();
  }

  setupWindowLoad() {
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Loading from', WINDOW.DEV_SERVER_URL);
      setTimeout(() => {
        this.mainWindow.loadURL(WINDOW.DEV_SERVER_URL).catch(err => {
          console.error('Failed to load URL:', err);
        });
        this.mainWindow.webContents.openDevTools();
      }, WINDOW.DEV_SERVER_TIMEOUT);
    } else {
      console.log('Production mode: Loading from', WINDOW.PROD_INDEX_PATH);

      if (!fs.existsSync(WINDOW.PROD_INDEX_PATH)) {
        console.error('Index file does not exist at:', WINDOW.PROD_INDEX_PATH);
        return;
      }

      this.mainWindow.loadFile(WINDOW.PROD_INDEX_PATH).catch(err => {
        console.error('Failed to load file:', err);
        console.error('Index path:', WINDOW.PROD_INDEX_PATH);
        console.error('Current directory:', __dirname);
        console.error('App path:', app.getAppPath());
      });
    }
  }

  setupErrorHandling() {
    this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Page failed to load:', errorCode, errorDescription);
    });
  }

  getMainWindow() {
    return this.mainWindow;
  }
}

module.exports = new WindowService();
