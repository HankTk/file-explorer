import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ContextMenuComponent } from '../../components/context-menu/context-menu.component';
import { TileItemComponent } from '../../components/tile-item/tile-item.component';
import { FileItem } from '../../models/file-item.model';
import { ContextMenuService } from '../../services/context-menu.service';
import { DragOperationService } from '../../services/drag-operation.service';
import { FavoriteFolderService } from '../../services/favorite-folder.service';
import { FileExplorerService } from '../../services/file-explorer.service';
import { ViewActionService } from '../../services/view-action.service';

@Component({
    selector: 'app-tile-view',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        TranslateModule,
        MatMenuModule,
        MatDialogModule,
        ContextMenuComponent,
        TileItemComponent,
    ],
    templateUrl: './view-tile.component.html',
    styleUrls: ['./view-tile.component.scss'],
})
export class ViewTileComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges 
{
    @Input() items: FileItem[] = [];
    @Input() loading = false;
    @Input() error: string | null = null;
    @Input() isSearching = false;
    @Input() currentDirectory: string = '';
    @Output() itemClick = new EventEmitter<FileItem>();
    @Output() favoriteAdd = new EventEmitter<{ name: string; path: string }>();
    @Output() itemCopy = new EventEmitter<FileItem>();
    @Output() itemPaste = new EventEmitter<{ sourcePath: string; destinationPath: string }>();
    @Output() itemRename = new EventEmitter<{ item: FileItem; newName: string }>();
    @Output() itemDelete = new EventEmitter<FileItem>();

    @ViewChild(ContextMenuComponent) contextMenuComponent!: ContextMenuComponent;

    private subscriptions: Subscription[] = [];
    private imageUrls: Map<string, string> = new Map();
    private loadingImages: Set<string> = new Set();
    private loadedImages: Set<string> = new Set();
    private isInitialized = false;
    private scrollContainer: HTMLElement | null = null;
    private lastScrollTop = 0;
    private scrollThrottleTimeout: number | null = null;
    private imageItems: FileItem[] = [];
    private imageLoadQueue: Set<string> = new Set();
    private isProcessingQueue = false;

    constructor(
        public fileExplorerService: FileExplorerService,
        private favoriteFolderService: FavoriteFolderService,
        private dialog: MatDialog,
        public contextMenuService: ContextMenuService,
        public dragOperationService: DragOperationService,
        private viewActionService: ViewActionService,
        private cdr: ChangeDetectorRef
    ) 
    {}

    trackByFn(index: number, item: FileItem): string 
    {
        return item.path;
    }

    ngOnInit(): void 
    {
        // Listen to events from ViewActionService and forward them to parent component
        this.subscriptions.push(
            this.viewActionService.favoriteAdd.subscribe((data) => this.favoriteAdd.emit(data)),
            this.viewActionService.itemCopy.subscribe((item) => this.itemCopy.emit(item)),
            this.viewActionService.itemPaste.subscribe((data) => this.itemPaste.emit(data)),
            this.viewActionService.itemRename.subscribe((data) => this.itemRename.emit(data)),
            this.viewActionService.itemDelete.subscribe((item) => this.itemDelete.emit(item)),
            this.viewActionService.itemClick.subscribe((item) => this.itemClick.emit(item))
        );
    }

    ngOnDestroy(): void 
    {
        // Unsubscribe from subscriptions
        this.subscriptions.forEach((sub) => sub.unsubscribe());

        // Release image URLs
        this.imageUrls.forEach((url) => URL.revokeObjectURL(url));
        this.imageUrls.clear();

        // Clear loading states
        this.loadingImages.clear();
        this.loadedImages.clear();

        // Clear queue and processing states
        this.imageLoadQueue.clear();
        this.isProcessingQueue = false;

        // Remove scroll event listener
        if (this.scrollContainer) 
        {
            this.scrollContainer.removeEventListener('scroll', this.onScroll.bind(this));
            this.scrollContainer = null;
        }

        // Clear image items
        this.imageItems = [];

        if (this.scrollThrottleTimeout) 
        {
            clearTimeout(this.scrollThrottleTimeout);
        }
    }

    ngAfterViewInit(): void 
    {
        this.isInitialized = true;
        this.scrollContainer = document.querySelector('.tile-view');
        if (this.scrollContainer) 
        {
            this.scrollContainer.addEventListener('scroll', () => this.onScroll(), {
                passive: true,
            });
            // Load images that are visible on initial display
            setTimeout(async () => 
            {
                await this.loadVisibleImages();
                // Force change detection after initial load
                this.cdr.detectChanges();
            }, 100);
        }

        // Select the first item if nothing is selected
        if (this.items.length > 0 && !this.contextMenuService.selectedItem) 
        {
            this.contextMenuService.selectedItem = this.items[0];
            this.cdr.detectChanges();
        }

        // Force change detection to ensure view is updated
        this.cdr.detectChanges();
    }

    ngOnChanges(changes: SimpleChanges): void 
    {
        if (changes['items']) 
        {
            // Pre-generate URLs for image files
            this.items.forEach((item) => 
            {
                if (
                    this.fileExplorerService.isImageFile(item.name) &&
                    !this.fileExplorerService.isImageTooLarge(item.size || 0) &&
                    !this.imageUrls.has(item.path)
                ) 
                {
                    this.loadImage(item);
                }
            });

            // Select the first item if nothing is selected
            if (this.items.length > 0 && !this.contextMenuService.selectedItem) 
            {
                this.contextMenuService.selectedItem = this.items[0];
                this.cdr.detectChanges();
            }

            // Force change detection to ensure view is updated
            this.cdr.detectChanges();

            // Load visible images after items change
            setTimeout(async () => 
            {
                await this.loadVisibleImages();
                this.cdr.detectChanges();
            }, 100);
        }
    }

    private isElementInViewport(element: HTMLElement): boolean 
    {
        if (!this.scrollContainer) 
        {
            return false;
        }

        const containerRect = this.scrollContainer.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        // Add some margin when checking visibility
        return (
            elementRect.bottom >= containerRect.top - 100 &&
            elementRect.top <= containerRect.bottom + 100
        );
    }

    getImageUrl(item: FileItem): string 
    {
        if (!this.fileExplorerService.isImageFile(item.name)) 
        {
            return '';
        }

        if (item.size !== null && this.fileExplorerService.isImageTooLarge(item.size)) 
        {
            return '';
        }

        return this.imageUrls.get(item.path) || '';
    }

    private async processImageLoadQueue(): Promise<void> 
    {
        console.log('Processing image load queue');
        if (this.isProcessingQueue || this.imageLoadQueue.size === 0) 
        {
            return;
        }

        this.isProcessingQueue = true;

        try 
        {
            const paths = Array.from(this.imageLoadQueue);
            this.imageLoadQueue.clear();

            for (const path of paths) 
            {
                const item = this.items.find((i) => i.path === path);
                if (item) 
                {
                    await this.loadImage(item);
                }
            }
        }
        finally 
        {
            this.isProcessingQueue = false;
            // Process again if new items are added to the queue
            if (this.imageLoadQueue.size > 0) 
            {
                setTimeout(() => this.processImageLoadQueue(), 0);
            }
        }
    }

    private async loadImage(item: FileItem): Promise<void> 
    {
        if (this.loadingImages.has(item.path) || this.loadedImages.has(item.path)) 
        {
            return;
        }

        try 
        {
            this.loadingImages.add(item.path);
            this.cdr.detectChanges();

            console.log(`Loading image: ${item.path}`);
            const imageData = await this.fileExplorerService.readImageFile(item.path);

            if (!imageData) 
            {
                throw new Error('No image data returned from readImageFile');
            }

            if (imageData.length === 0) 
            {
                throw new Error('Empty image data received');
            }

            console.log(`Image data size: ${imageData.length} bytes`);
            const blob = new Blob([imageData], { type: 'image/jpeg' });
            const url = URL.createObjectURL(blob);
            this.imageUrls.set(item.path, url);
            this.loadedImages.add(item.path);
            this.loadingImages.delete(item.path);
            this.cdr.detectChanges();
            console.log(`Successfully loaded image: ${item.path}`);
        }
        catch (error) 
        {
            console.error('Error loading image:', {
                path: item.path,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
            });
            this.loadingImages.delete(item.path);
            this.cdr.detectChanges();
        }
    }

    private async loadVisibleImages(): Promise<void> 
    {
        if (!this.scrollContainer) 
        {
            return;
        }

        const imageElements = document.querySelectorAll('.tile-item img[data-path]');
        const visiblePaths = new Set<string>();

        imageElements.forEach((element) => 
        {
            const imgElement = element as HTMLElement;
            const path = imgElement.dataset['path'];

            if (path && this.isElementInViewport(imgElement)) 
            {
                visiblePaths.add(path);
            }
        });

        // Load images in visible range if not already loaded
        this.items.forEach((item) => 
        {
            if (
                visiblePaths.has(item.path) &&
                !this.imageUrls.has(item.path) &&
                !this.loadingImages.has(item.path) &&
                !this.loadedImages.has(item.path)
            ) 
            {
                this.loadImage(item);
            }
        });
    }

    private async onScroll(): Promise<void> 
    {
        if (!this.scrollContainer) 
        {
            return;
        }

        // Determine scroll direction
        const currentScrollTop = this.scrollContainer.scrollTop;
        this.lastScrollTop = currentScrollTop;

        // Throttle scroll events
        if (this.scrollThrottleTimeout) 
        {
            clearTimeout(this.scrollThrottleTimeout);
        }

        this.scrollThrottleTimeout = setTimeout(async () => 
        {
            await this.loadVisibleImages();
        }, 100);
    }

    isImageLoading(path: string): boolean 
    {
        return this.loadingImages.has(path);
    }

    isImageLoaded(path: string): boolean 
    {
        return this.loadedImages.has(path);
    }

    async onItemClick(item: FileItem): Promise<void> 
    {
        if (this.fileExplorerService.isImageFile(item.name)) 
        {
            await this.fileExplorerService.openFileWithApp(item.path);
        }
        else 
        {
            this.itemClick.emit(item);
        }
    }

    onDragStart(event: DragEvent, item: FileItem): void 
    {
        this.viewActionService.onDragStart(event, item, 'move');
    }

    onContextMenu(event: MouseEvent, item: FileItem): void 
    {
        event.preventDefault();
        this.viewActionService.onContextMenu(event, item, this.contextMenuComponent.menuTrigger);
    }

    onEmptyAreaContextMenu(event: MouseEvent): void 
    {
        event.preventDefault();
        this.viewActionService.onEmptyAreaContextMenu(event, this.contextMenuComponent.menuTrigger);
    }

    onImageError(event: Event, item: FileItem): void 
    {
        const imgElement = event.target as HTMLImageElement;
        imgElement.style.display = 'none';

        // Get parent element
        const parentElement = imgElement.parentElement;
        if (parentElement) 
        {
            // Remove existing icon
            const existingIcon = parentElement.querySelector('mat-icon');
            if (existingIcon) 
            {
                existingIcon.remove();
            }

            // Add new icon
            const iconElement = document.createElement('mat-icon');
            iconElement.className = 'file-icon';
            iconElement.textContent = 'image';
            parentElement.appendChild(iconElement);
        }

        // Remove from cache if error occurs
        this.imageUrls.delete(item.path);
        this.loadingImages.delete(item.path);

        // Notify that an error has occurred
        this.cdr.detectChanges();
    }
}
