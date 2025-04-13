const fs = require('fs').promises;
const path = require('path');
const { shell } = require('electron');
const { FILE_SYSTEM } = require('../constant/constants');

class FileExplorerService {

  async readDirectory(dirPath) {
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      const results = [];

      for (const item of items) {
        try {
          const fullPath = path.join(dirPath, item.name);
          const stats = await fs.stat(fullPath);
          const extension = item.isDirectory() ? '' : path.extname(item.name).toLowerCase();
          results.push({
            name: item.name,
            path: fullPath,
            isDirectory: item.isDirectory(),
            size: item.isDirectory() ? 0 : stats.size,
            modified: new Date(stats.mtime),
            type: item.isDirectory() ? 'folder' : extension
          });
        } catch (error) {
          console.warn(`Skipping ${item.name} due to error:`, error);
          continue;
        }
      }

      return results;
    } catch (error) {
      console.error('Error reading directory:', error);
      throw error;
    }
  }

  async searchFilesRecursive(dirPath, query, depth = 0) {
    if (depth > FILE_SYSTEM.MAX_SEARCH_DEPTH) {
      return [];
    }

    const results = [];
    const items = await fs.readdir(dirPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);

      if (FILE_SYSTEM.HIDDEN_FILES.some(hidden => item.name.startsWith(hidden))) {
        continue;
      }

      try {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          const stats = await fs.stat(fullPath);
          const extension = item.isDirectory() ? '' : path.extname(item.name).toLowerCase();
          results.push({
            name: item.name,
            path: fullPath,
            isDirectory: item.isDirectory(),
            size: item.isDirectory() ? 0 : stats.size,
            modified: new Date(stats.mtime),
            type: item.isDirectory() ? 'folder' : extension
          });
        }

        if (item.isDirectory()) {
          const subResults = await this.searchFilesRecursive(fullPath, query, depth + 1);
          results.push(...subResults);
        }
      } catch (error) {
        console.error(`Error processing ${fullPath}:`, error);
        continue;
      }
    }

    return results;
  }

  async readFileContent(filePath) {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      console.error('Error reading file content:', error);
      throw error;
    }
  }

  async openFileWithApp(filePath) {
    try {
      await shell.openPath(filePath);
    } catch (error) {
      console.error('Error opening file with app:', error);
      throw error;
    }
  }

  async checkPathExists(path) {
    try {
      await fs.access(path);
      return true;
    } catch (error) {
      return false;
    }
  }

  async isDirectory(path) {
    try {
      const stats = await fs.stat(path);
      return stats.isDirectory();
    } catch (error) {
      console.error('Error checking if path is directory:', error);
      return false;
    }
  }

  async copyItem(sourcePath) {
    try {
      const stats = await fs.stat(sourcePath);
      if (stats.isDirectory()) {
        return await this.copyDirectory(sourcePath);
      } else {
        return await fs.readFile(sourcePath);
      }
    } catch (error) {
      console.error('Error copying item:', error);
      throw error;
    }
  }

  async getUniqueFileName(basePath, fileName) {
    const ext = path.extname(fileName);
    const nameWithoutExt = path.basename(fileName, ext);
    let newPath = path.join(basePath, fileName);
    let counter = 1;

    while (await this.checkPathExists(newPath)) {
      const newName = `${nameWithoutExt}_Copy${counter}${ext}`;
      newPath = path.join(basePath, newName);
      counter++;
    }

    return path.basename(newPath);
  }

  async pasteItem(sourcePath, destinationPath) {
    try {
      const content = await this.copyItem(sourcePath);
      const fileName = path.basename(sourcePath);
      const uniqueFileName = await this.getUniqueFileName(destinationPath, fileName);
      const targetPath = path.join(destinationPath, uniqueFileName);

      if (await this.isDirectory(sourcePath)) {
        await this.pasteDirectory(content, targetPath);
      } else {
        await fs.writeFile(targetPath, content);
      }
    } catch (error) {
      console.error('Error pasting item:', error);
      throw error;
    }
  }

  async copyDirectory(sourcePath) {
    try {
      const entries = await fs.readdir(sourcePath, { withFileTypes: true });
      const dirContent = [];

      for (const entry of entries) {
        const fullPath = path.join(sourcePath, entry.name);
        if (entry.isDirectory()) {
          const subDirContent = await this.copyDirectory(fullPath);
          dirContent.push({
            name: entry.name,
            isDirectory: true,
            content: subDirContent
          });
        } else {
          const content = await fs.readFile(fullPath);
          dirContent.push({
            name: entry.name,
            isDirectory: false,
            content: content
          });
        }
      }

      return dirContent;
    } catch (error) {
      console.error('Error copying directory:', error);
      throw error;
    }
  }

  async pasteDirectory(dirContent, destinationPath) {
    try {
      await fs.mkdir(destinationPath, { recursive: true });

      for (const item of dirContent) {
        const itemPath = path.join(destinationPath, item.name);
        if (item.isDirectory) {
          await this.pasteDirectory(item.content, itemPath);
        } else {
          await fs.writeFile(itemPath, item.content);
        }
      }
    } catch (error) {
      console.error('Error pasting directory:', error);
      throw error;
    }
  }

  async renameItem(oldPath, newName) {
    try {
      // Get the directory path and extension from the old path
      const dirPath = path.dirname(oldPath);
      const ext = path.extname(oldPath);
      
      // If newName contains a path separator, only use the filename part
      const newNameOnly = path.basename(newName);
      
      // If newName already has the extension, use it as is
      // Otherwise, add the extension only if it exists and newName doesn't end with it
      const newNameWithExt = newNameOnly.endsWith(ext) ? newNameOnly : (ext && !newNameOnly.endsWith(ext) ? newNameOnly + ext : newNameOnly);
      
      // Construct the new path using the directory path and the new name
      let newPath = path.join(dirPath, newNameWithExt);

      // Check if source path exists
      await fs.access(oldPath);

      // If new path exists and it's different from the old path, generate a unique name
      if (await this.checkPathExists(newPath) && newPath !== oldPath) {
        const uniqueFileName = await this.getUniqueFileName(dirPath, newNameWithExt);
        newPath = path.join(dirPath, uniqueFileName);
      }

      // Perform the rename operation
      await fs.rename(oldPath, newPath);
      return newPath;
    } catch (error) {
      console.error('Error renaming item:', error);
      if (error.code === 'ENOENT') {
        throw new Error('Source file not found');
      } else if (error.code === 'EEXIST') {
        throw new Error('A file with that name already exists');
      } else if (error.code === 'EPERM') {
        throw new Error('Permission denied');
      }
      throw error;
    }
  }

  async deleteItem(path) {
    try {
      const stats = await fs.stat(path);
      if (stats.isDirectory()) {
        await fs.rmdir(path, { recursive: true });
      } else {
        await fs.unlink(path);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }

  async readImageFile(filePath, highQuality = false) {
    try {
      // In high quality mode, return the file contents as is
      if (highQuality) {
        return await fs.readFile(filePath);
      }

      const sharp = require('sharp');
      const metadata = await sharp(filePath).metadata();
      
      // Use sharp only for thumbnail generation
      let processor = sharp(filePath)
        .rotate() // Auto-rotate
        .resize(120, 120, {
          fit: 'inside',
          withoutEnlargement: true,
          fastShrinkOnLoad: true
        })
        .jpeg({
          quality: 80,
          mozjpeg: true,
          chromaSubsampling: '4:2:0',
          optimizeCoding: true,
          progressive: true
        });

      const buffer = await processor.toBuffer();

      if (!buffer || buffer.length === 0) {
        throw new Error('Failed to process image');
      }

      return buffer;
    } catch (error) {
      console.error('Error reading image file:', error);
      throw error;
    }
  }

  async readRawFile(filePath) {
    try {
      return await fs.readFile(filePath);
    } catch (error) {
      console.error('Error reading raw file:', error);
      throw error;
    }
  }

}

module.exports = new FileExplorerService();
