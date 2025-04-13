import { Injectable } from '@angular/core';
import { FileItem } from '../models/file-item.model';
import { ElectronAPI } from '../types/electron-api';

@Injectable({
    providedIn: 'root',
})
export class FileExplorerService 
{
    private electron: ElectronAPI;
    private hiddenFiles = [
        '.DS_Store',
        'Thumbs.db',
        'desktop.ini',
        '$RECYCLE.BIN',
        'System Volume Information',
        '.git',
        '.svn',
        '.idea',
        '.vscode',
        'node_modules',
    ];

    private osSpecificHiddenFolders = {
        darwin: [
            'Library',
            '.Trashes',
            '.Spotlight-V100',
            '.fseventsd',
            '.TemporaryItems',
            '.apdisk',
        ],
        win32: [
            'System Volume Information',
            '$RECYCLE.BIN',
            'Recovery',
            'Config.Msi',
            'WindowsApps',
        ],
        linux: ['.cache', '.config', '.local', '.mozilla', '.pki'],
    };

    private readonly HIDDEN_DIRECTORIES = [
        // System directories
        'Library',
        'System',
        'Volumes',
        'private',
        'etc',
        'var',
        'bin',
        'sbin',
        'usr',
        'dev',
        'opt',
        'tmp',
        'cores',
        'Network',
        'Network Trash Folder',
        'Temporary Items',
        'System Volume Information',
        '$RECYCLE.BIN',
        'Recovery',
        'Config.Msi',
        'WindowsApps',
        // Application support directories
        'Application Support',
        'Caches',
        'Containers',
        'Frameworks',
        'Preferences',
        'Saved Application State',
        'WebKit',
        // Hidden system directories
        '.Trashes',
        '.Spotlight-V100',
        '.fseventsd',
        '.TemporaryItems',
        '.apdisk',
        '.DocumentRevisions-V100',
        '.PKInstallSandboxManager',
        '.PKInstallSandboxManager-SystemSoftware',
        '.file',
        '.hotfiles.btree',
        '.vol',
        // User-specific system directories
        'Library/Application Support',
        'Library/Caches',
        'Library/Containers',
        'Library/Frameworks',
        'Library/Preferences',
        'Library/Saved Application State',
        'Library/WebKit',
        // Network and shared directories
        'Network Trash Folder',
        'Temporary Items',
        'Shared',
        'Public',
        // Backup and system restore directories
        'Backups.backupdb',
        'MobileBackups',
        'Previous Systems',
        'System Restore',
        // Virtual machine and container directories
        'Virtual Machines',
        'Containers',
        'Docker',
        'VMware',
        'Parallels',
        // Development and build directories
        'node_modules',
        'build',
        'dist',
        'target',
        'out',
        'bin',
        'obj',
        '.git',
        '.svn',
        '.hg',
        '.idea',
        '.vscode',
        '.DS_Store'
    ];

    constructor() 
    {
        if (!('electronAPI' in window)) 
        {
            throw new Error('Electron API is not available');
        }
        this.electron = (window as { electronAPI: ElectronAPI }).electronAPI;
    }

    private filterHiddenFiles(items: FileItem[]): FileItem[] 
    {
        return items.filter((item) => 
        {
            // Exclude files starting with a dot
            if (item.name.startsWith('.')) 
            {
                return false;
            }
            // Exclude files in the hidden files list
            if (this.hiddenFiles.includes(item.name)) 
            {
                return false;
            }
            // Exclude OS-specific hidden folders
            const platform = this.electron.getPlatform();
            const hiddenFolders = this.osSpecificHiddenFolders[platform] || [];
            if (hiddenFolders.includes(item.name)) 
            {
                return false;
            }
            return true;
        });
    }

    async readDirectory(path: string): Promise<FileItem[]> 
    {
        const items = await this.electron.readDirectory(path);
        return this.filterHiddenFiles(items);
    }

    async selectDirectory(): Promise<string | null> 
    {
        return this.electron.selectDirectory();
    }

    async openFile(path: string): Promise<void> 
    {
        return this.electron.openFile(path);
    }

    async getCurrentDirectory(): Promise<string> 
    {
        return this.electron.getCurrentDirectory();
    }

    async getHomeDirectory(): Promise<string> 
    {
        try 
        {
            const homeDir = await this.electron.getHomeDirectory();
            return homeDir;
        }
        catch (error) 
        {
            console.error('Error getting home directory:', error);
            throw error;
        }
    }

    async readFileContent(path: string): Promise<string> 
    {
        return this.electron.readFileContent(path);
    }

    async readImageFile(path: string, highQuality: boolean = false): Promise<Uint8Array> 
    {
        try 
        {
            // Get binary data directly from Electron's main process
            return await this.electron.readImageFile(path, highQuality);
        }
        catch (error) 
        {
            console.error('Error reading image file:', error);
            throw error;
        }
    }

    async searchFiles(directory: string, query: string): Promise<FileItem[]> 
    {
        try 
        {
            // Skip directories without access permissions
            if (directory.includes('Library/Application Support') || 
                directory.includes('System Volume Information') ||
                directory.includes('$RECYCLE.BIN')) 
            {
                return [];
            }

            const items = await this.electron.searchFiles(directory, query);
            return this.filterHiddenFiles(items);
        }
        catch (error) 
        {
            console.warn('Error searching files:', error);
            // Return empty array if an error occurs
            return [];
        }
    }

    getFileIcon(filename: string): { name: string; class: string } 
    {
        const extension = filename.split('.').pop()?.toLowerCase();
        if (!extension) 
        {
            return { name: 'insert_drive_file', class: 'default' };
        }

        // Image files
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'].includes(extension)) 
        {
            return { name: 'image', class: 'image' };
        }
        else if (extension === 'pdf') 
        {
            // PDF files
            return { name: 'picture_as_pdf', class: 'pdf' };
        }
        else if (['doc', 'docx', 'txt', 'rtf', 'odt', 'pages'].includes(extension)) 
        {
            // Documents
            return { name: 'description', class: 'document' };
        }
        else if (['xls', 'xlsx', 'csv', 'ods', 'numbers'].includes(extension)) 
        {
            // Spreadsheets
            return { name: 'table_chart', class: 'spreadsheet' };
        }
        else if (['ppt', 'pptx', 'odp', 'key'].includes(extension)) 
        {
            // Presentations
            return { name: 'slideshow', class: 'presentation' };
        }
        else if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension)) 
        {
            // Archives
            return { name: 'folder_zip', class: 'archive' };
        }
        else if (
            // Code files
            [
                'js',
                'ts',
                'jsx',
                'tsx',
                'html',
                'css',
                'scss',
                'py',
                'java',
                'cpp',
                'c',
                'h',
                'cs',
                'php',
                'rb',
                'go',
                'rs',
                'swift',
                'kt',
            ].includes(extension)
        ) 
        {
            return { name: 'code', class: 'code' };
        }
        else if (['sql', 'sqlite', 'db'].includes(extension)) 
        {
            // Databases
            return { name: 'storage', class: 'database' };
        }
        else if (['ttf', 'otf', 'woff', 'woff2', 'eot'].includes(extension)) 
        {
            // Font files
            return { name: 'font_download', class: 'font' };
        }
        else if (['exe', 'app', 'dmg', 'msi', 'sh', 'bat', 'cmd'].includes(extension)) 
        {
            // Executable files
            return { name: 'apps', class: 'executable' };
        }
        else if (['mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'webm'].includes(extension)) 
        {
            // Video files
            return { name: 'videocam', class: 'video' };
        }
        // Audio files
        else if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(extension)) 
        {
            return { name: 'audiotrack', class: 'audio' };
        }

        return { name: 'insert_drive_file', class: 'default' };
    }

    formatFileSize(bytes: number): string 
    {
        if (bytes === 0) 
        {
            return '0 B';
        }
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    canGoBack(): boolean 
    {
        return this.electron.canGoBack();
    }

    async goBack(): Promise<string | null> 
    {
        return this.electron.goBack();
    }

    canGoUp(path: string): boolean 
    {
        return this.electron.canGoUp(path);
    }

    async getParentDirectory(path: string): Promise<string | null> 
    {
        return this.electron.getParentDirectory(path);
    }

    private isHiddenFile(fileName: string): boolean 
    {
        // Files starting with a dot (Unix hidden files)
        if (fileName.startsWith('.')) 
        {
            return true;
        }

        // Specific system files and folders
        return this.hiddenFiles.some(
            (hiddenFile) => fileName.toLowerCase() === hiddenFile.toLowerCase()
        );
    }

    async checkPathExists(path: string): Promise<boolean> 
    {
        try 
        {
            await this.electron.checkPathExists(path);
            return true;
        }
        catch (_error) 
        {
            return false;
        }
    }

    async isDirectory(path: string): Promise<boolean> 
    {
        try 
        {
            return await this.electron.isDirectory(path);
        }
        catch (_error) 
        {
            return false;
        }
    }

    async openFileWithApp(path: string): Promise<void> 
    {
        return this.electron.openFileWithApp(path);
    }

    async copyItem(sourcePath: string): Promise<void> 
    {
        return this.electron.copyItem(sourcePath);
    }

    private getBasename(path: string): string 
    {
        // Normalize path separators (compatible with both Windows and Mac)
        const normalizedPath = path.replace(/\\/g, '/');
        const parts = normalizedPath.split('/');
        return parts[parts.length - 1] || '';
    }

    private getExtension(filename: string): string 
    {
        const lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex > 0 ? filename.slice(lastDotIndex) : '';
    }

    isImageFile(filename: string): boolean 
    {
        const extension = this.getExtension(filename).toLowerCase();
        return [
            '.jpg',
            '.jpeg',
            '.png',
            '.gif',
            '.bmp',
            '.webp',
            '.svg',
            '.ico',
            '.tiff',
            '.tif',
        ].includes(extension);
    }

    isImageTooLarge(size: number): boolean 
    {
        // Consider images larger than 20MB as too large
        return size > 20 * 1024 * 1024;
    }

    private removeExtension(filename: string): string 
    {
        const lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : filename;
    }

    private joinPath(dir: string, filename: string): string 
    {
        // Normalize path separators (compatible with both Windows and Mac)
        const normalizedDir = dir.replace(/\\/g, '/').replace(/\/+/g, '/');
        const cleanDir = normalizedDir.endsWith('/') ? normalizedDir.slice(0, -1) : normalizedDir;
        const cleanFilename = filename.replace(/^\/+/, '').replace(/\\/g, '/');
        const result = `${cleanDir}/${cleanFilename}`;

        // Check for path duplication
        const basename = this.getBasename(cleanFilename);
        if (result.includes(basename + '/' + basename)) 
        {
            throw new Error('Invalid path construction detected');
        }

        return result;
    }

    async pasteItem(sourcePath: string, destinationPath: string): Promise<void> 
    {
        try 
        {
            // 1. Validate input path
            if (!sourcePath || !destinationPath) 
            {
                throw new Error('Source path and destination path are required');
            }

            // 2. Verify source file existence
            const sourceExists = await this.electron.checkPathExists(sourcePath);
            if (!sourceExists) 
            {
                throw new Error('Source file does not exist');
            }

            // 3. Verify destination is a directory
            const isDestDir = await this.electron.isDirectory(destinationPath);
            if (!isDestDir) 
            {
                throw new Error('Destination is not a directory');
            }

            // 4. Get source filename (get last part from path)
            const sourceBaseName = sourcePath.split('/').pop() || '';
            if (!sourceBaseName) 
            {
                throw new Error('Invalid source file name');
            }

            // 5. Normalize destination base path
            let destPath = destinationPath;
            if (destPath.endsWith('/')) 
            {
                destPath = destPath.slice(0, -1);
            }

            // 6. Generate new filename
            let newFileName = sourceBaseName;
            let counter = 1;

            // 7. Generate new name if file exists
            while (await this.electron.checkPathExists(`${destPath}/${newFileName}`)) 
            {
                const ext =
                    sourceBaseName.lastIndexOf('.') > 0
                        ? sourceBaseName.slice(sourceBaseName.lastIndexOf('.'))
                        : '';
                const nameWithoutExt = sourceBaseName.slice(
                    0,
                    sourceBaseName.lastIndexOf('.') > 0
                        ? sourceBaseName.lastIndexOf('.')
                        : sourceBaseName.length
                );

                newFileName = ext
                    ? `${nameWithoutExt} (${counter})${ext}`
                    : `${nameWithoutExt} (${counter})`;

                counter++;

                if (counter > 100) 
                {
                    throw new Error('Too many attempts to create unique filename');
                }
            }

            // 8. Debug information
            console.log('Source path:', sourcePath);
            console.log('Destination directory:', destPath);
            console.log('New file name:', newFileName);

            // 9. Execute copy operation (pass directory path and filename separately)
            await this.electron.pasteItem(sourcePath, destPath, newFileName);
        }
        catch (error) 
        {
            console.error('Error pasting item:', error);
            throw error;
        }
    }

    async renameItem(oldPath: string, newName: string): Promise<void> 
    {
        try 
        {
            const directory = await this.electron.getParentDirectory(oldPath);
            if (!directory) 
            {
                throw new Error('Parent directory not found');
            }
            const newPath = `${directory}/${newName}`;
            await this.electron.renameItem(oldPath, newPath);
        }
        catch (error) 
        {
            console.error('Error renaming item:', error);
            throw error;
        }
    }

    async deleteItem(path: string): Promise<void> 
    {
        return this.electron.deleteItem(path);
    }

    async readRawFile(path: string): Promise<Uint8Array> 
    {
        try 
        {
            // Get binary data directly from Electron's main process
            return await this.electron.readRawFile(path);
        }
        catch (error) 
        {
            console.error('Error reading raw file:', error);
            throw error;
        }
    }

    isAccessibleDirectory(path: string): boolean 
    {
        const pathParts = path.split('/').filter(part => part.trim() !== '');
        return !this.HIDDEN_DIRECTORIES.some(hiddenDir => pathParts.includes(hiddenDir));
    }
}
