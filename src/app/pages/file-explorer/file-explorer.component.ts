import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { interval, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { FileItem } from '../../models/file-item.model';
import { FavoriteFolderService } from '../../services/favorite-folder.service';
import { FileExplorerService } from '../../services/file-explorer.service';
import { FileThemeService } from '../../services/file-theme.service';
import { FileSettingsComponent } from '../file-settings/file-settings.component';
import { FileToolbarComponent } from '../file-toolbar/file-toolbar.component';
import { ListDeviceComponent } from '../list-device/list-device.component';
import { ListFavoriteComponent } from '../list-favorite/list-favorite.component';
import { ViewCarouselComponent } from '../view-carousel/view-carousel.component';
import { ViewColumnComponent } from '../view-column/view-column.component';
import { ViewListComponent } from '../view-list/view-list.component';
import { ViewTileComponent } from '../view-tile/view-tile.component';

interface Device {
    name: string;
    path: string;
}

@Component({
    selector: 'app-file-explorer',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatInputModule,
        MatFormFieldModule,
        MatTooltipModule,
        MatTableModule,
        MatDialogModule,
        MatSnackBarModule,
        MatSidenavModule,
        TranslateModule,
        MatToolbarModule,
        MatListModule,
        MatMenuModule,
        ListDeviceComponent,
        FileToolbarComponent,
        ViewListComponent,
        ViewTileComponent,
        FileSettingsComponent,
        ListFavoriteComponent,
        ViewColumnComponent,
        ViewCarouselComponent,
    ],
    templateUrl: './file-explorer.component.html',
    styleUrl: './file-explorer.component.scss',
})
export class FileExplorerComponent implements OnInit, OnDestroy 
{
    items: FileItem[] = [];
    currentPath: string = '';
    loading = false;
    error: string | null = null;
    searchQuery: string = '';
    isSearching: boolean = false;
    viewingFile: FileItem | null = null;
    fileContent: string = '';
    isDrawerOpen = false;
    currentLang: string = 'en';
    themeVariant: string = '';
    themeVariantSunset: string = '';
    private refreshSubscription: Subscription | null = null;
    private lastRefreshTime: number = 0;
    private readonly REFRESH_INTERVAL = 3000; // Refresh every 5 seconds
    devices: Device[] = [];
    isListView: boolean = true;
    private readonly destroy$ = new Subject<void>();
    private isResizing = false;
    private startX = 0;
    private startWidth = 0;
    private resizableContainer: HTMLElement | null = null;
    private isFavoriteResizing = false;
    private startY = 0;
    private favoriteListHeight = 0;
    private favoriteListElement: HTMLElement | null = null;
    viewMode: 'list' | 'tile' | 'column' | 'carousel' = 'list';
    favorites: { name: string; path: string }[] = [];
    private favoritesSubscription: Subscription | null = null;

    private fileExplorerService = inject(FileExplorerService);
    private translate = inject(TranslateService);
    private fileThemeService = inject(FileThemeService);
    private favoriteFolderService = inject(FavoriteFolderService);
    private snackBar = inject(MatSnackBar);

    constructor() 
    {
        this.translate.setDefaultLang('en');
        this.translate.use('en');
        this.translate.get('fileExplorer.themeVariant').subscribe((res: string) => 
        {
            this.themeVariant = res;
        });
        this.translate.get('fileExplorer.themeVariantSunset').subscribe((res: string) => 
        {
            this.themeVariantSunset = res;
        });
    }

    async ngOnInit(): Promise<void> 
    {
        try 
        {
            const homeDir = await this.fileExplorerService.getHomeDirectory();
            if (homeDir) 
            {
                this.currentPath = homeDir;
                await this.loadDirectory(homeDir);
                this.setupAutoRefresh();
                this.loadDevices();
                this.setupFavorites();
            }
        }
        catch (error) 
        {
            console.error('Error initializing:', error);
            this.handleError(error);
        }
    }

    ngOnDestroy(): void 
    {
        if (this.refreshSubscription) 
        {
            this.refreshSubscription.unsubscribe();
        }
        if (this.favoritesSubscription) 
        {
            this.favoritesSubscription.unsubscribe();
        }
        this.destroy$.next();
        this.destroy$.complete();
        document.removeEventListener('mousemove', this.handleResize);
        document.removeEventListener('mouseup', this.stopResize);
    }

    private setupAutoRefresh(): void 
    {
        // Execute refresh every 5 seconds
        this.refreshSubscription = interval(this.REFRESH_INTERVAL)
            .pipe(
                debounceTime(1000), // Prevent consecutive refreshes
                distinctUntilChanged(), // Skip if same as previous
                switchMap(() => this.fileExplorerService.readDirectory(this.currentPath))
            )
            .subscribe({
                next: (newItems) => 
                {
                    // Update only if more than 5 seconds have passed since last refresh
                    const now = Date.now();
                    if (now - this.lastRefreshTime >= this.REFRESH_INTERVAL) 
                    {
                        this.items = newItems;
                        this.lastRefreshTime = now;
                    }
                },
                error: (error) => 
                {
                    console.error('Auto refresh error:', error);
                },
            });
    }

    async loadDirectory(path: string): Promise<void> 
    {
        try 
        {
            this.isSearching = false;
            this.items = await this.fileExplorerService.readDirectory(path);
            this.currentPath = path;
            this.error = null;
        }
        catch (error) 
        {
            console.error('Error loading directory:', error);
            this.handleError(error);
        }
    }

    async goBack(): Promise<void> 
    {
        try 
        {
            if (this.canGoBack()) 
            {
                const previousPath = await this.fileExplorerService.goBack();
                if (previousPath) 
                {
                    await this.loadDirectory(previousPath);
                }
            }
        }
        catch (error) 
        {
            console.error('Error going back:', error);
            this.error = 'fileExplorer.error.navigationFailed';
        }
    }

    async goUp(): Promise<void> 
    {
        try 
        {
            const parentPath = await this.fileExplorerService.getParentDirectory(this.currentPath);
            if (parentPath) 
            {
                await this.loadDirectory(parentPath);
            }
        }
        catch (error) 
        {
            console.error('Error going up:', error);
            this.error = 'fileExplorer.error.navigationFailed';
        }
    }

    async goHome(): Promise<void> 
    {
        try 
        {
            const homeDir = await this.fileExplorerService.getHomeDirectory();
            if (homeDir) 
            {
                this.currentPath = homeDir;
                await this.loadDirectory(homeDir);
            }
        }
        catch (error) 
        {
            console.error('Error navigating to home directory:', error);
            this.error = 'fileExplorer.error.navigationFailed';
        }
    }

    async onItemClick(item: FileItem): Promise<void> 
    {
        try 
        {
            if (item.isDirectory) 
            {
                await this.loadDirectory(item.path);
            }
            else 
            {
                await this.fileExplorerService.openFileWithApp(item.path);
            }
        }
        catch (error) 
        {
            console.error('Error handling item click:', error);
            this.error = 'fileExplorer.error.fileOpenFailed';
        }
    }

    async onSearch(): Promise<void> 
    {
        try 
        {
            if (!this.searchQuery.trim()) 
            {
                this.isSearching = false;
                await this.loadDirectory(this.currentPath);
                return;
            }

            this.isSearching = true;
            this.loading = true;
            this.error = null;

            // Skip directories without access permissions
            if (this.currentPath.includes('Library/Application Support') || 
                this.currentPath.includes('System Volume Information') ||
                this.currentPath.includes('$RECYCLE.BIN')) 
            {
                this.error = 'fileExplorer.error.accessDenied';
                this.loading = false;
                this.isSearching = false;
                return;
            }

            const searchResults = await this.fileExplorerService.searchFiles(
                this.currentPath,
                this.searchQuery
            );

            if (searchResults.length === 0) 
            {
                this.error = 'fileExplorer.error.noResults';
            }

            this.items = searchResults;
            this.loading = false;
        }
        catch (error) 
        {
            console.error('Error searching files:', error);
            this.error = 'fileExplorer.error.searchFailed';
            this.loading = false;
            this.isSearching = false;
        }
    }

    closeViewer(): void 
    {
        this.viewingFile = null;
        this.fileContent = '';
    }

    canGoBack(): boolean 
    {
        return this.fileExplorerService.canGoBack();
    }

    canGoUp(): boolean 
    {
        return this.fileExplorerService.canGoUp(this.currentPath);
    }

    onPathInputKeyup(event: KeyboardEvent): void 
    {
        if (event.key === 'Enter') 
        {
            const input = event.target as HTMLInputElement;
            this.navigateToPath(input.value);
        }
    }

    async navigateToPath(path: string): Promise<void> 
    {
        try 
        {
            if (!path) 
            {
                return;
            }

            // Check if path exists
            const exists = await this.fileExplorerService.checkPathExists(path);
            if (!exists) 
            {
                this.error = 'fileExplorer.error.pathNotFound';
                return;
            }

            // Check if path is a directory
            const isDirectory = await this.fileExplorerService.isDirectory(path);
            if (!isDirectory) 
            {
                this.error = 'fileExplorer.error.notADirectory';
                return;
            }

            await this.loadDirectory(path);
            this.error = null;
        }
        catch (error) 
        {
            console.error('Error navigating to path:', error);
            this.error = 'fileExplorer.error.navigationFailed';
        }
    }

    updatePathInput(event: Event): void 
    {
        const input = event.target as HTMLInputElement;
        this.currentPath = input.value;
    }

    async onSelectDirectory(): Promise<void> 
    {
        try 
        {
            const path = await this.fileExplorerService.selectDirectory();
            if (path) 
            {
                await this.loadDirectory(path);
            }
        }
        catch (error) 
        {
            console.error('Error selecting directory:', error);
            this.error = 'fileExplorer.error.selectDirectory';
        }
    }

    toggleDrawer(): void 
    {
        this.isDrawerOpen = !this.isDrawerOpen;
    }

    switchLanguage(lang: string): void 
    {
        this.translate.use(lang);
        this.currentLang = lang;
    }

    loadCurrentDirectory(): Promise<void> 
    {
        return this.loadDirectory(this.currentPath);
    }

    private async loadDevices(): Promise<void> 
    {
        try 
        {
            const homeDir = await this.fileExplorerService.getHomeDirectory();
            if (homeDir) 
            {
                this.devices = [
                    { name: 'fileExplorer.device.home', path: homeDir },
                    { name: 'fileExplorer.device.documents', path: `${homeDir}/Documents` },
                    { name: 'fileExplorer.device.downloads', path: `${homeDir}/Downloads` },
                    { name: 'fileExplorer.device.desktop', path: `${homeDir}/Desktop` },
                    { name: 'fileExplorer.device.network', path: '/Volumes' },
                    { name: 'fileExplorer.device.shared', path: '/Shared' },
                ];
            }
        }
        catch (error) 
        {
            console.error('Error loading devices:', error);
            this.error = 'fileExplorer.error.loadDevicesFailed';
        }
    }

    selectDevice(device: Device): void 
    {
        this.currentPath = device.path;
        this.loadDirectory(device.path);
    }

    private showMessage(messageKey: string, isError: boolean = false): void 
    {
        const message = this.translate.instant(messageKey);
        this.snackBar.open(message, this.translate.instant('common.close'), {
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: isError ? 'snackbar-error' : 'snackbar-success',
        });
    }

    private handleError(error: unknown): void 
    {
        console.error('Error:', error);
        if (error instanceof Error) 
        {
            this.error = error.message;
        }
        else 
        {
            this.error = 'Unknown error occurred';
        }
    }

    startResize(event: MouseEvent): void 
    {
        this.isResizing = true;
        this.startX = event.clientX;
        this.resizableContainer = document.querySelector('.resizable-container') as HTMLElement;
        if (this.resizableContainer) 
        {
            this.startWidth = this.resizableContainer.offsetWidth;
        }
        document.addEventListener('mousemove', this.handleResize);
        document.addEventListener('mouseup', this.stopResize);
    }

    startFavoriteResize(event: MouseEvent): void 
    {
        this.isFavoriteResizing = true;
        this.startY = event.clientY;
        this.favoriteListElement = document.querySelector('app-favorite-list') as HTMLElement;
        if (this.favoriteListElement) 
        {
            this.favoriteListHeight = this.favoriteListElement.offsetHeight;
        }
        document.addEventListener('mousemove', this.handleFavoriteResize);
        document.addEventListener('mouseup', this.stopFavoriteResize);
        event.preventDefault(); // Stop event propagation
    }

    private handleResize = (event: MouseEvent): void => 
    {
        if (!this.isResizing || !this.resizableContainer) 
        {
            return;
        }

        const width = this.startWidth + (event.clientX - this.startX);
        const minWidth = 200;
        const maxWidth = window.innerWidth * 0.5;

        if (width >= minWidth && width <= maxWidth) 
        {
            this.resizableContainer.style.width = `${width}px`;
        }
    };

    private handleFavoriteResize = (event: MouseEvent): void => 
    {
        if (!this.isFavoriteResizing || !this.favoriteListElement) 
        {
            return;
        }

        const height = this.favoriteListHeight + (event.clientY - this.startY);
        const minHeight = 100;
        const maxHeight = window.innerHeight * 0.8;
        const containerHeight = this.favoriteListElement.parentElement?.clientHeight || 0;

        if (height >= minHeight && height <= maxHeight && height <= containerHeight) 
        {
            this.favoriteListElement.style.height = `${height}px`;
            this.favoriteListElement.style.flex = 'none'; // Override flex: 1

            // Adjust device list height
            const deviceListElement = document.querySelector('app-device-list') as HTMLElement;
            if (deviceListElement) 
            {
                deviceListElement.style.height = `${containerHeight - height - 16}px`; // 16px is total margin and padding
                deviceListElement.style.flex = 'none'; // Override flex: 1
            }
        }
    };

    private stopResize = (): void => 
    {
        this.isResizing = false;
        this.resizableContainer = null;
        document.removeEventListener('mousemove', this.handleResize);
        document.removeEventListener('mouseup', this.stopResize);
    };

    private stopFavoriteResize = (): void => 
    {
        this.isFavoriteResizing = false;
        this.favoriteListElement = null;
        document.removeEventListener('mousemove', this.handleFavoriteResize);
        document.removeEventListener('mouseup', this.stopFavoriteResize);
    };

    toggleViewMode(): void 
    {
        this.viewMode =
            this.viewMode === 'list'
                ? 'tile'
                : this.viewMode === 'tile'
                    ? 'column'
                    : this.viewMode === 'carousel'
                        ? 'list'
                        : 'carousel';
        console.log('View mode changed to:', this.viewMode);
    }

    private setupFavorites(): void 
    {
        this.favoritesSubscription = this.favoriteFolderService.favorites$.subscribe(
            (favoritePaths) => 
            {
                this.favorites = favoritePaths.map((path) => 
                {
                    const name = path.split('/').pop() || path;
                    return { name, path };
                });
            }
        );
    }

    addToFavorites(item: { name: string; path: string }): void 
    {
        this.favoriteFolderService.addFavorite(item.path);
    }

    removeFromFavorites(path: string): void 
    {
        this.favoriteFolderService.removeFavorite(path);
    }

    onFavoriteSelect(favorite: { name: string; path: string }): void 
    {
        this.currentPath = favorite.path;
        this.loadDirectory(favorite.path);
    }

    async onCopyItem(item: FileItem): Promise<void> 
    {
        try 
        {
            await this.fileExplorerService.copyItem(item.path);
            await this.loadCurrentDirectory();
            this.showMessage('fileExplorer.itemCopied');
        }
        catch (error) 
        {
            this.handleError(error);
        }
    }

    async onPasteItem(data: { sourcePath: string; destinationPath: string }): Promise<void> 
    {
        try 
        {
            await this.fileExplorerService.pasteItem(data.sourcePath, data.destinationPath);
            await this.loadCurrentDirectory();
            this.showMessage('fileExplorer.itemPasted');
        }
        catch (error) 
        {
            this.handleError(error);
        }
    }

    async onRenameItem(data: { item: FileItem; newName: string }): Promise<void> 
    {
        try 
        {
            const newPath = await this.fileExplorerService.renameItem(data.item.path, data.newName);
            console.log('Rename successful. New path:', newPath);
            await this.loadCurrentDirectory();
            this.showMessage('fileExplorer.itemRenamed');
        }
        catch (error) 
        {
            console.error('Rename error:', error);
            this.handleError(error);
        }
    }

    async onDeleteItem(item: FileItem): Promise<void> 
    {
        try 
        {
            await this.fileExplorerService.deleteItem(item.path);
            await this.loadCurrentDirectory();
            this.showMessage('fileExplorer.itemDeleted');
        }
        catch (error) 
        {
            this.handleError(error);
        }
    }
}
