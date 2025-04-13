import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FileItem } from '../../models/file-item.model';
import { FileExplorerService } from '../../services/file-explorer.service';

@Component({
    selector: 'app-tile-item',
    templateUrl: './tile-item.component.html',
    styleUrls: ['./tile-item.component.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
})
export class TileItemComponent implements OnInit 
{
    @Input() item!: FileItem;
    @Input() currentDirectory!: string;
    @Input() isSelected: boolean = false;

    imageUrl: string = '';
    isImageLoading: boolean = false;
    isImageLoaded: boolean = false;

    constructor(public fileExplorerService: FileExplorerService) 
    {}

    ngOnInit(): void 
    {
        if (
            this.fileExplorerService.isImageFile(this.item.name) &&
            (!this.item.size || !this.fileExplorerService.isImageTooLarge(this.item.size))
        ) 
        {
            this.loadImage();
        }
    }

    private async loadImage(): Promise<void> 
    {
        this.isImageLoading = true;
        try 
        {
            const imageData = await this.fileExplorerService.readImageFile(this.item.path);
            const blob = new Blob([imageData], { type: 'image/jpeg' });
            this.imageUrl = URL.createObjectURL(blob);
        }
        catch (error) 
        {
            console.error('Error loading image:', error);
            this.isImageLoading = false;
        }
    }

    onImageLoaded(): void 
    {
        this.isImageLoading = false;
        this.isImageLoaded = true;
    }

    onImageError(_event: Event): void 
    {
        this.isImageLoading = false;
        this.isImageLoaded = false;
    }

    getFileIcon(): { name: string; class: string } 
    {
        return this.fileExplorerService.getFileIcon(this.item.name);
    }

    formatFileSize(size: number | null): string 
    {
        return size !== null ? this.fileExplorerService.formatFileSize(size) : '';
    }
}
