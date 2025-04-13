import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { FileItem } from '../models/file-item.model';

@Injectable({
    providedIn: 'root',
})
export class FileSystemService 
{
    constructor() 
    {}

    getRootDirectory(): Observable<FileItem[]> 
    {
        // If accessing the actual file system, use Electron API here
        // Return dummy data for demo purposes
        return of([
            {
                name: 'Documents',
                path: '/Documents',
                isDirectory: true,
                size: null,
                type: 'folder',
            },
            {
                name: 'Downloads',
                path: '/Downloads',
                isDirectory: true,
                size: null,
                type: 'folder',
            },
            {
                name: 'Pictures',
                path: '/Pictures',
                isDirectory: true,
                size: null,
                type: 'folder',
            },
        ]);
    }

    getDirectoryContents(path: string): Observable<FileItem[]> 
    {
        // If accessing the actual file system, use Electron API here
        // Return dummy data for demo purposes
        return of([
            {
                name: 'Folder 1',
                path: `${path}/Folder 1`,
                isDirectory: true,
                size: null,
                type: 'folder',
            },
            {
                name: 'Folder 2',
                path: `${path}/Folder 2`,
                isDirectory: true,
                size: null,
                type: 'folder',
            },
            {
                name: 'Document.pdf',
                path: `${path}/Document.pdf`,
                isDirectory: false,
                size: 1024,
                type: 'pdf',
            },
        ]);
    }
}
