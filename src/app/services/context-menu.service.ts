import { EventEmitter, Inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';
import { RenameDialogComponent } from '../components/rename-dialog/rename-dialog.component';
import { FileItem } from '../models/file-item.model';

@Injectable({
    providedIn: 'root',
})
export class ContextMenuService 
{
    // Context menu position information
    contextMenuPosition = { x: 0, y: 0 };

    // Selected item and clipboard item
    selectedItem: FileItem | null = null;
    clipboardItem: FileItem | null = null;

    // Event emitters for each action
    favoriteAdd = new EventEmitter<{ name: string; path: string }>();
    itemCopy = new EventEmitter<FileItem>();
    itemPaste = new EventEmitter<{ sourcePath: string; destinationPath: string }>();
    itemRename = new EventEmitter<{ item: FileItem; newName: string }>();
    itemDelete = new EventEmitter<FileItem>();

    constructor(@Inject(MatDialog) private dialog: MatDialog) 
    {}

    // Right-click event handler on items
    onContextMenu(event: MouseEvent, item: FileItem, menuTrigger: MatMenuTrigger): void 
    {
        event.preventDefault();
        event.stopPropagation();

        this.selectedItem = item;

        this.contextMenuPosition = {
            x: event.clientX,
            y: event.clientY,
        };

        menuTrigger.openMenu();
    }

    // Right-click event handler on empty area
    onEmptyAreaContextMenu(event: MouseEvent, menuTrigger: MatMenuTrigger): void 
    {
        event.preventDefault();
        event.stopPropagation();

        this.selectedItem = null;

        this.contextMenuPosition = {
            x: event.clientX,
            y: event.clientY,
        };

        menuTrigger.openMenu();
    }

    // Add to favorites
    addToFavorites(menuTrigger: MatMenuTrigger): void 
    {
        if (this.selectedItem?.isDirectory) 
        {
            this.favoriteAdd.emit({
                name: this.selectedItem.name,
                path: this.selectedItem.path,
            });
            menuTrigger.closeMenu();
        }
    }

    // Copy item
    copyItem(menuTrigger: MatMenuTrigger): void 
    {
        if (this.selectedItem) 
        {
            this.clipboardItem = this.selectedItem;
            this.itemCopy.emit(this.selectedItem);
            menuTrigger.closeMenu();
        }
    }

    // Paste item
    pasteItem(currentDirectory: string, menuTrigger: MatMenuTrigger): void 
    {
        if (this.clipboardItem && currentDirectory) 
        {
            this.itemPaste.emit({
                sourcePath: this.clipboardItem.path,
                destinationPath: currentDirectory,
            });
            menuTrigger.closeMenu();
        }
    }

    // Rename item
    renameItem(menuTrigger: MatMenuTrigger): void 
    {
        if (this.selectedItem) 
        {
            const currentName = this.selectedItem.name;
            const lastDotIndex = currentName.lastIndexOf('.');
            const extension =
                !this.selectedItem.isDirectory && lastDotIndex > 0
                    ? currentName.slice(lastDotIndex)
                    : '';
            const nameWithoutExt = extension
                ? currentName.slice(0, -extension.length)
                : currentName;

            const dialogRef = this.dialog.open(RenameDialogComponent, {
                width: '300px',
                data: {
                    currentName: nameWithoutExt,
                    isDirectory: this.selectedItem.isDirectory,
                },
            });

            dialogRef.afterClosed().subscribe((newName) => 
            {
                if (newName) 
                {
                    const finalName = this.selectedItem!.isDirectory
                        ? newName
                        : newName.includes('.')
                            ? newName
                            : `${newName}${extension}`;

                    this.itemRename.emit({
                        item: this.selectedItem!,
                        newName: finalName,
                    });
                }
                menuTrigger.closeMenu();
            });
        }
    }

    // Delete item
    deleteItem(menuTrigger: MatMenuTrigger): void 
    {
        if (this.selectedItem) 
        {
            const dialogRef = this.dialog.open(ConfirmDialogComponent, {
                width: '300px',
                data: { name: this.selectedItem.name },
            });

            dialogRef.afterClosed().subscribe((result) => 
            {
                if (result && this.selectedItem) 
                {
                    this.itemDelete.emit(this.selectedItem);
                }
                menuTrigger.closeMenu();
            });
        }
    }
}
