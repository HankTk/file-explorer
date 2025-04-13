import { Injectable } from '@angular/core';
import { FileItem } from '../models/file-item.model';

@Injectable({
    providedIn: 'root',
})
export class DragOperationService 
{
    constructor() 
    {}

    // Drag start
    onDragStart(event: DragEvent, item: FileItem, effectAllowed: 'copy' | 'move' = 'copy'): void 
    {
        if (event.dataTransfer) 
        {
            event.dataTransfer.effectAllowed = effectAllowed;
            event.dataTransfer.setData(
                'text/plain',
                JSON.stringify({
                    name: item.name,
                    path: item.path,
                    isDirectory: item.isDirectory,
                })
            );
        }
    }

    // Drag end
    onDragEnd(event: DragEvent): void 
    {
        // Implementation if needed (currently does nothing)
        console.log('Drag ended', event);
    }
}
