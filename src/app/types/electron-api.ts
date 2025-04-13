import { FileItem } from '../models/file-item.model';

export interface ElectronAPI {
    readDirectory: (path: string) => Promise<FileItem[]>;
    selectDirectory: () => Promise<string | null>;
    openFile: (path: string) => Promise<void>;
    readFileContent: (path: string) => Promise<string>;
    readImageFile: (path: string, highQuality?: boolean) => Promise<Uint8Array>;
    getCurrentDirectory: () => Promise<string>;
    getHomeDirectory: () => Promise<string>;
    searchFiles: (directory: string, query: string) => Promise<FileItem[]>;
    canGoBack: () => boolean;
    goBack: () => Promise<string | null>;
    canGoUp: (path: string) => boolean;
    getParentDirectory: (path: string) => Promise<string | null>;
    checkPathExists: (path: string) => Promise<boolean>;
    isDirectory: (path: string) => Promise<boolean>;
    openFileWithApp: (path: string) => Promise<void>;
    getPlatform: () => 'darwin' | 'win32' | 'linux';
    copyItem: (sourcePath: string) => Promise<void>;
    pasteItem: (sourcePath: string, destinationDir: string, newFileName: string) => Promise<void>;
    renameItem: (oldPath: string, newPath: string) => Promise<void>;
    deleteItem: (path: string) => Promise<void>;
    readRawFile: (path: string) => Promise<Uint8Array>;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

export {};
