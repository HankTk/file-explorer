import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { TranslateModule } from '@ngx-translate/core';

interface FavoriteItem {
    name: string;
    path: string;
}

@Component({
    selector: 'app-favorite-list',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatListModule, TranslateModule, MatButtonModule],
    templateUrl: './list-favorite.component.html',
    styleUrls: ['./list-favorite.component.scss'],
})
export class ListFavoriteComponent 
{
    @Input() favorites: FavoriteItem[] = [];
    @Output() favoriteSelect = new EventEmitter<FavoriteItem>();
    @Output() addToFavorites = new EventEmitter<{ name: string; path: string }>();
    @Output() removeFromFavorites = new EventEmitter<string>();

    isDragOver = false;
    selectedItem: FavoriteItem | null = null;
    showContextMenu = false;
    contextMenuX = 0;
    contextMenuY = 0;

    constructor() 
    {}

    // Listen for global click events to close the menu when clicking outside
    @HostListener('document:click', ['$event'])
    onDocumentClick(_event: MouseEvent): void 
    {
        if (this.showContextMenu) 
        {
            this.showContextMenu = false;
        }
    }

    onFavoriteClick(item: FavoriteItem): void 
    {
        this.selectedItem = item;
        this.favoriteSelect.emit(item);
    }

    onContextMenu(event: MouseEvent, item: FavoriteItem): void 
    {
        event.preventDefault();
        this.selectedItem = item;

        // Set the menu position
        this.contextMenuX = event.clientX;
        this.contextMenuY = event.clientY;

        // Show the menu
        this.showContextMenu = true;
    }

    onRemoveFavorite(): void 
    {
        if (this.selectedItem) 
        {
            this.removeFromFavorites.emit(this.selectedItem.path);
        }
        this.showContextMenu = false;
    }

    onDragOver(event: DragEvent): void 
    {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver = true;
    }

    onDragLeave(event: DragEvent): void 
    {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver = false;
    }

    onDrop(event: DragEvent): void 
    {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver = false;

        if (event.dataTransfer) 
        {
            const data = event.dataTransfer.getData('text/plain');
            try 
            {
                const item = JSON.parse(data);
                if (item && item.name && item.path) 
                {
                    this.addToFavorites.emit({ name: item.name, path: item.path });
                }
            }
            catch (e) 
            {
                console.error('Error parsing dropped data:', e);
            }
        }
    }
}
