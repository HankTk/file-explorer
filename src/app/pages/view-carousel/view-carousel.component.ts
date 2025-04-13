import { ScrollingModule } from '@angular/cdk/scrolling';
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
    HostListener,
} from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ContextMenuComponent } from '../../components/context-menu/context-menu.component';
import { FileItem } from '../../models/file-item.model';
import { ContextMenuService } from '../../services/context-menu.service';
import { FileExplorerService } from '../../services/file-explorer.service';
import { ViewActionService } from '../../services/view-action.service';

interface ImageData {
    url: SafeUrl | null;
    loaded: boolean;
}

@Component({
    selector: 'app-carousel-view',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatMenuModule,
        MatProgressSpinnerModule,
        MatDialogModule,
        TranslateModule,
        ScrollingModule,
        ContextMenuComponent,
    ],
    templateUrl: './view-carousel.component.html',
    styleUrls: ['./view-carousel.component.scss'],
})
export class ViewCarouselComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges 
{
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
    @ViewChild('viewport') viewport: any;

    private _items: FileItem[] = [];
    private subscriptions: Subscription[] = [];
    selectedItem: FileItem | null = null;
    showImagePreview = false;
    private imageUrls: Map<string, string> = new Map();
    private highQualityImageUrls: Map<string, string> = new Map();
    private loadingImages: Set<string> = new Set();
    private isInitialized = false;

    constructor(
        public fileExplorerService: FileExplorerService,
        private sanitizer: DomSanitizer,
        private cdr: ChangeDetectorRef,
        public contextMenuService: ContextMenuService,
        private viewActionService: ViewActionService
    ) 
    {}

    ngOnInit(): void 
    {
        // Listen to events from ViewActionService and forward them to the parent component
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
        this.subscriptions.forEach((sub) => sub.unsubscribe());
        // Clean up object URLs
        this.imageUrls.forEach((url) => URL.revokeObjectURL(url));
        this.highQualityImageUrls.forEach((url) => URL.revokeObjectURL(url));
        this.imageUrls.clear();
        this.highQualityImageUrls.clear();
        this.loadingImages.clear();
    }

    ngAfterViewInit(): void 
    {
        this.isInitialized = true;
        // Start image loading after view initialization
        this.loadImages();
    }

    ngOnChanges(changes: SimpleChanges): void 
    {
        if (changes['items'] && this.isInitialized) 
        {
            // Process only new items without clearing existing image URLs
            this.loadImages();
            
            // Automatically select the first item if there are items and no item is currently selected
            if (this.items.length > 0 && !this.selectedItem) 
            {
                this.onItemClick(this.items[0]);
            }
        }
    }

    private loadImages(): void 
    {
        const imageItems = this.items.filter(
            (item) =>
                this.fileExplorerService.isImageFile(item.name) &&
                !this.fileExplorerService.isImageTooLarge(item.size || 0) &&
                !this.imageUrls.has(item.path) &&
                !this.loadingImages.has(item.path)
        );

        if (imageItems.length === 0) 
        {
            return;
        }

        // Load images sequentially
        const loadNextImage = (index: number): void => 
        {
            if (index >= imageItems.length) 
            {
                return;
            }

            const item = imageItems[index];
            this.loadingImages.add(item.path);

            this.fileExplorerService
                .readImageFile(item.path)
                .then((imageData) => 
                {
                    if (!imageData || imageData.length === 0) 
                    {
                        throw new Error('Empty image data');
                    }
                    const blob = new Blob([imageData], { type: 'image/jpeg' });
                    const url = URL.createObjectURL(blob);
                    this.imageUrls.set(item.path, url);
                    this.loadingImages.delete(item.path);

                    // Notify that the image has been loaded
                    this.cdr.detectChanges();

                    // Load the next image (set interval to 50ms)
                    setTimeout(() => 
                    {
                        loadNextImage(index + 1);
                    }, 50);
                })
                .catch((error) => 
                {
                    console.error('Error loading image:', error);
                    this.loadingImages.delete(item.path);
                    this.cdr.detectChanges();

                    // Load the next image even if an error occurs
                    setTimeout(() => 
                    {
                        loadNextImage(index + 1);
                    }, 50);
                });
        };

        // Start loading from the first image
        loadNextImage(0);
    }

    getImageData(item: FileItem): ImageData 
    {
        if (!this.fileExplorerService.isImageFile(item.name)) 
        {
            return { url: null, loaded: false };
        }

        // Display large images with an icon
        if (item.size !== null && this.fileExplorerService.isImageTooLarge(item.size)) 
        {
            return { url: null, loaded: false };
        }

        // Return if it exists in cache
        if (this.imageUrls.has(item.path)) 
        {
            return {
                url: this.sanitizer.bypassSecurityTrustUrl(this.imageUrls.get(item.path)!),
                loaded: true,
            };
        }

        // Start loading if not already loading
        if (!this.loadingImages.has(item.path)) 
        {
            this.loadingImages.add(item.path);

            this.fileExplorerService
                .readImageFile(item.path)
                .then((imageData) => 
                {
                    if (!imageData || imageData.length === 0) 
                    {
                        throw new Error('Empty image data');
                    }
                    const blob = new Blob([imageData], { type: 'image/jpeg' });
                    const url = URL.createObjectURL(blob);
                    this.imageUrls.set(item.path, url);
                    this.loadingImages.delete(item.path);
                    // Notify that the image has been loaded
                    this.cdr.detectChanges();
                    // Force view update
                    setTimeout(() => 
                    {
                        this.cdr.detectChanges();
                    }, 0);
                })
                .catch((error) => 
                {
                    console.error('Error loading image:', error);
                    this.loadingImages.delete(item.path);
                    // Notify that an error has occurred
                    this.cdr.detectChanges();
                    // Force view update
                    setTimeout(() => 
                    {
                        this.cdr.detectChanges();
                    }, 0);
                });
        }

        // Return empty string while loading
        return { url: null, loaded: false };
    }

    handleImageError(_path: string): void 
    {
        this.imageUrls.delete(_path);
        this.loadingImages.delete(_path);
        this.cdr.detectChanges();
    }

    onImageLoad(path: string): void 
    {
        this.cdr.detectChanges();
    }

    getSelectedImageData(item: FileItem): ImageData 
    {
        if (!this.fileExplorerService.isImageFile(item.name)) 
        {
            return { url: null, loaded: false };
        }

        // Return if it exists in cache
        if (this.highQualityImageUrls.has(item.path)) 
        {
            return {
                url: this.sanitizer.bypassSecurityTrustUrl(
                    this.highQualityImageUrls.get(item.path)!
                ),
                loaded: true,
            };
        }

        // Start loading if not already loading
        if (!this.loadingImages.has(item.path)) 
        {
            this.loadingImages.add(item.path);

            this.fileExplorerService
                .readRawFile(item.path)
                .then((fileData) => 
                {
                    if (!fileData || fileData.length === 0) 
                    {
                        throw new Error('Empty file data');
                    }
                    const blob = new Blob([fileData], { type: 'image/jpeg' });
                    const url = URL.createObjectURL(blob);
                    this.highQualityImageUrls.set(item.path, url);
                    this.loadingImages.delete(item.path);
                    this.cdr.detectChanges();
                    setTimeout(() => 
                    {
                        this.cdr.detectChanges();
                    }, 0);
                })
                .catch((error) => 
                {
                    console.error('Error loading high quality image:', error);
                    this.loadingImages.delete(item.path);
                    this.cdr.detectChanges();
                    setTimeout(() => 
                    {
                        this.cdr.detectChanges();
                    }, 0);
                });
        }

        // Return empty string while loading
        return { url: null, loaded: false };
    }

    private updateSelection(item: FileItem, scrollToItem: boolean = true): void 
    {
        // First update the selected item
        this.selectedItem = item;

        // Update tabindex for all items
        this.updateTabIndexes();

        // Update the view
        this.cdr.detectChanges();

        // Then handle image preview and item click
        if (this.isImageFile(item)) 
        {
            this.showImagePreview = true;
            // Start loading high-quality image
            this.getSelectedImageData(item);
        }
        else 
        {
            this.showImagePreview = false;
            this.itemClick.emit(item);
        }

        // Scroll to the selected item if requested
        if (scrollToItem && this.viewport) 
        {
            const index = this.items.findIndex(i => i.name === item.name);
            // Ensure the viewport is ready before scrolling
            setTimeout(() => 
            {
                this.viewport.scrollToIndex(index);
                // Force another change detection to ensure view is updated
                this.cdr.detectChanges();
                // Additional check to ensure the viewport is updated
                setTimeout(() => 
                {
                    this.viewport.scrollToIndex(index);
                    this.cdr.detectChanges();
                    // Final check to ensure the viewport is updated
                    setTimeout(() => 
                    {
                        this.viewport.scrollToIndex(index);
                        this.cdr.detectChanges();
                        // Additional check to ensure the viewport is updated
                        setTimeout(() => 
                        {
                            this.viewport.scrollToIndex(index);
                            this.cdr.detectChanges();
                        }, 300);
                    }, 200);
                }, 100);
            }, 0);
        }

        // Focus the selected item after the view is updated
        setTimeout(() => 
        {
            const elements = document.getElementsByClassName('carousel-item');
            const index = this.items.findIndex(i => i.name === item.name);
            if (elements[index]) 
            {
                (elements[index] as HTMLElement).focus();
            }
            // Force another change detection to ensure view is updated
            this.cdr.detectChanges();
        });
    }

    private updateTabIndexes(): void 
    {
        const elements = document.getElementsByClassName('carousel-item');
        Array.from(elements).forEach((element, index) => 
        {
            const item = this.items[index];
            if (item) 
            {
                (element as HTMLElement).tabIndex = this.selectedItem === item ? 0 : -1;
            }
        });
    }

    async onItemClick(item: FileItem): Promise<void> 
    {
        this.updateSelection(item, false);
    }

    isImageFile(item: FileItem): boolean 
    {
        if (item.isDirectory) 
        {
            return false;
        }
        const _extension = item.name.toLowerCase().substring(item.name.lastIndexOf('.'));
        return this.fileExplorerService.isImageFile(item.name);
    }

    getIconClasses(item: FileItem): string 
    {
        if (item.isDirectory) 
        {
            return 'folder-icon';
        }
        return `file-icon ${this.fileExplorerService.getFileIcon(item.name).class}`;
    }

    get items(): FileItem[] 
    {
        return this._items;
    }

    @Input() set items(value: FileItem[]) 
    {
        this._items = value;
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

    onDragStart(event: DragEvent, item: FileItem): void 
    {
        if (event.dataTransfer) 
        {
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

    onPaste(): void 
    {
        if (this.contextMenuService.clipboardItem) 
        {
            this.itemPaste.emit({
                sourcePath: this.contextMenuService.clipboardItem.path,
                destinationPath: this.currentDirectory,
            });
        }
    }

    async onSelectedItemClick(item: FileItem): Promise<void> 
    {
        if (this.fileExplorerService.isImageFile(item.name)) 
        {
            await this.fileExplorerService.openFileWithApp(item.path);
        }
    }

    @HostListener('window:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) 
    {
        if (!this.items.length) 
        {
            return;
        }

        // Use selectedItem as the primary reference
        let currentIndex = this.selectedItem ? this.items.findIndex(i => i.name === this.selectedItem!.name) : 0;

        let newIndex = currentIndex;

        switch (event.key) 
        {
            case 'ArrowLeft':
                newIndex = currentIndex > 0 ? currentIndex - 1 : this.items.length - 1;
                break;
            case 'ArrowRight':
                newIndex = currentIndex < this.items.length - 1 ? currentIndex + 1 : 0;
                break;
            default:
                return;
        }

        if (newIndex !== currentIndex) 
        {
            // Prevent default to avoid any browser default behavior
            event.preventDefault();
            // Update selection with the new item and scroll to it
            this.updateSelection(this.items[newIndex], true);
        }
    }
}
