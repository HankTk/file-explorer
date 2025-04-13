import { EventEmitter, Inject, Injectable, OnDestroy } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { Subscription } from 'rxjs';
import { FileItem } from '../models/file-item.model';
import { ContextMenuService } from './context-menu.service';
import { DragOperationService } from './drag-operation.service';

@Injectable({
    providedIn: 'root',
})
export class ViewActionService implements OnDestroy 
{
    // Output events related to context menu
    favoriteAdd = new EventEmitter<{ name: string; path: string }>();
    itemCopy = new EventEmitter<FileItem>();
    itemPaste = new EventEmitter<{ sourcePath: string; destinationPath: string }>();
    itemRename = new EventEmitter<{ item: FileItem; newName: string }>();
    itemDelete = new EventEmitter<FileItem>();
    itemClick = new EventEmitter<FileItem>();

    protected subscriptions: Subscription[] = [];

    constructor(
        @Inject(ContextMenuService) private contextMenuService: ContextMenuService,
        @Inject(DragOperationService) private dragOperationService: DragOperationService
    ) 
    {
        // Listen to events from context menu service
        this.subscriptions.push(
            this.contextMenuService.favoriteAdd.subscribe((data) => this.favoriteAdd.emit(data)),
            this.contextMenuService.itemCopy.subscribe((item) => this.itemCopy.emit(item)),
            this.contextMenuService.itemPaste.subscribe((data) => this.itemPaste.emit(data)),
            this.contextMenuService.itemRename.subscribe((data) => this.itemRename.emit(data)),
            this.contextMenuService.itemDelete.subscribe((item) => this.itemDelete.emit(item))
        );
    }

    ngOnDestroy(): void 
    {
        // Unsubscribe from all subscriptions
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    // Handle item click
    onItemClick(item: FileItem): void 
    {
        this.itemClick.emit(item);
    }

    // Handle drag start
    onDragStart(event: DragEvent, item: FileItem, effectAllowed: 'copy' | 'move' = 'copy'): void 
    {
        this.dragOperationService.onDragStart(event, item, effectAllowed);
    }

    // Handle drag end
    onDragEnd(event: DragEvent): void 
    {
        this.dragOperationService.onDragEnd(event);
    }

    // Handle context menu
    onContextMenu(event: MouseEvent, item: FileItem, menuTrigger: MatMenuTrigger): void 
    {
        this.contextMenuService.onContextMenu(event, item, menuTrigger);
    }

    // Handle empty area context menu
    onEmptyAreaContextMenu(event: MouseEvent, menuTrigger: MatMenuTrigger): void 
    {
        event.preventDefault();
        event.stopPropagation();

        this.contextMenuService.contextMenuPosition = {
            x: event.clientX,
            y: event.clientY,
        };

        if (menuTrigger) 
        {
            menuTrigger.openMenu();
        }
        else 
        {
            console.error('Menu trigger is not available');
        }
    }
}
