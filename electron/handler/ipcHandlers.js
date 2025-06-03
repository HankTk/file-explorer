const { ipcMain, dialog } = require('electron');
const fileService = require('../services/fileExplorerService');
const navigationService = require('../services/navigationService');
const { app } = require('electron');

function setupIpcHandlers() {

  ipcMain.handle('read-directory', async (event, dirPath) => {
    try {
      const results = await fileService.readDirectory(dirPath);
      navigationService.addToHistory(dirPath);
      return results;
    } catch (error) {
      console.error('Error reading directory:', error);
      throw error;
    }
  });

  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    return result.filePaths[0];
  });

  ipcMain.handle('read-file-content', async (event, filePath) => {
    return await fileService.readFileContent(filePath);
  });

  ipcMain.handle('get-current-directory', () => {
    return process.cwd();
  });

  ipcMain.handle('get-home-directory', async () => {
    try {
      return app.getPath('home');
    } catch (error) {
      console.error('Error getting home directory:', error);
      throw error;
    }
  });

  ipcMain.handle('search-files', async (event, directory, query) => {
    return await fileService.searchFilesRecursive(directory, query);
  });

  ipcMain.handle('can-go-back', () => {
    return navigationService.canGoBack();
  });

  ipcMain.handle('go-back', () => {
    return navigationService.goBack();
  });

  ipcMain.handle('can-go-up', (event, path) => {
    return navigationService.canGoUp(path);
  });

  ipcMain.handle('get-parent-directory', (event, path) => {
    return navigationService.getParentDirectory(path);
  });

  ipcMain.handle('check-path-exists', async (event, path) => {
    return await fileService.checkPathExists(path);
  });

  ipcMain.handle('is-directory', async (event, path) => {
    return await fileService.isDirectory(path);
  });

  ipcMain.handle('open-file-with-app', async (event, path) => {
    return await fileService.openFileWithApp(path);
  });

  ipcMain.handle('copy-item', async (event, sourcePath) => {
    return await fileService.copyItem(sourcePath);
  });

  ipcMain.handle('paste-item', async (event, sourcePath, destinationPath) => {
    return await fileService.pasteItem(sourcePath, destinationPath);
  });

  ipcMain.handle('rename-item', async (event, oldPath, newPath) => {
    return await fileService.renameItem(oldPath, newPath);
  });

  ipcMain.handle('delete-item', async (event, path) => {
    return await fileService.deleteItem(path);
  });

  ipcMain.handle('read-image-file', async (event, filePath, highQuality) => {
    try {
      console.log('Received request to read image:', filePath); // Debug log
      const result = await fileService.readImageFile(filePath, highQuality);
      console.log('Successfully read image, size:', result.length); // Debug log
      return result;
    } catch (error) {
      console.error('Error in read-image-file handler:', error);
      throw error;
    }
  });

  ipcMain.handle('read-raw-file', async (event, filePath) => {
    return await fileService.readRawFile(filePath);
  });

}

module.exports = { setupIpcHandlers };
