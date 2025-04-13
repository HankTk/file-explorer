import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    HostListener,
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
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ContextMenuComponent } from '../../components/context-menu/context-menu.component';
import { FileItem } from '../../models/file-item.model';
import { ContextMenuService } from '../../services/context-menu.service';
import { FavoriteFolderService } from '../../services/favorite-folder.service';
import { FileExplorerService } from '../../services/file-explorer.service';
import { ViewActionService } from '../../services/view-action.service';

@Component({
    selector: 'app-column-view',
    templateUrl: './view-column.component.html',
    styleUrls: ['./view-column.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatMenuModule,
        MatDialogModule,
        TranslateModule,
        ContextMenuComponent,
    ],
})
export class ViewColumnComponent implements OnInit, OnChanges, OnDestroy 
{
    @Input() items: FileItem[] = [];
    @Input() loading: boolean = false;
    @Input() error: string | null = null;
    @Input() isSearching: boolean = false;
    @Input() currentPath: string = '';
    @Output() itemClick = new EventEmitter<FileItem>();
    @Output() favoriteAdd = new EventEmitter<{ name: string; path: string }>();
    @Output() itemCopy = new EventEmitter<FileItem>();
    @Output() itemPaste = new EventEmitter<{ sourcePath: string; destinationPath: string }>();
    @Output() itemRename = new EventEmitter<{ item: FileItem; newName: string }>();
    @Output() itemDelete = new EventEmitter<FileItem>();

    columns: FileItem[][] = [];
    selectedPath: string = '';
    columnWidths: number[] = [];
    columnPaths: string[] = [];
    private isResizing = false;
    private currentResizeIndex = 0;
    private startX = 0;
    private startWidth = 0;

    selectedItem: FileItem | null = null;
    clipboardItem: FileItem | null = null;
    @ViewChild('menuTrigger') contextMenu!: MatMenuTrigger;
    contextMenuPosition = { x: '0px', y: '0px' };

    @ViewChild(ContextMenuComponent) contextMenuComponent!: ContextMenuComponent;

    readonly DEFAULT_COLUMN_WIDTH = 250;

    private subscriptions: Subscription[] = [];

    constructor(
        public fileExplorerService: FileExplorerService,
        private favoriteFolderService: FavoriteFolderService,
        private dialog: MatDialog,
        public contextMenuService: ContextMenuService,
        private viewActionService: ViewActionService
    ) 
    {}

    ngOnInit(): void 
    {
        if (this.currentPath) 
        {
            this.loadDirectoryStructure(this.currentPath);
        }
        else 
        {
            this.loadRootDirectory();
        }
        // Initialize column widths
        this.columnWidths = this.columns.map(() => this.DEFAULT_COLUMN_WIDTH);

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
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    ngOnChanges(changes: SimpleChanges): void 
    {
        if (changes['currentPath'] && !changes['currentPath'].firstChange) 
        {
            this.loadDirectoryStructure(this.currentPath);
        }
        if (changes['items'] && !changes['items'].firstChange) 
        {
            this.refreshCurrentView();
        }
    }

    private async refreshCurrentView(): Promise<void> 
    {
        if (!this.selectedPath) 
        {
            return;
        }

        try 
        {
            // Get the path of the last column
            const lastColumnIndex = this.columns.length - 1;
            if (lastColumnIndex >= 0) 
            {
                const currentColumnPath = this.selectedPath;
                const items = await this.fileExplorerService.readDirectory(currentColumnPath);
                this.columns[lastColumnIndex] = items;
            }
        }
        catch (error) 
        {
            console.error('Error refreshing current view:', error);
        }
    }

    async loadRootDirectory(): Promise<void> 
    {
        try 
        {
            const homeDir = await this.fileExplorerService.getHomeDirectory();
            const items = await this.fileExplorerService.readDirectory(homeDir);
            this.columns = [items];
            this.columnPaths = ['Home'];
            // Initialize column widths after columns are set
            this.columnWidths = this.columns.map(() => this.DEFAULT_COLUMN_WIDTH);
        }
        catch (error) 
        {
            console.error('Error loading root directory:', error);
            this.error = 'Error loading root directory';
        }
    }

    async loadDirectoryStructure(path: string): Promise<void> 
    {
        try 
        {
            const homeDir = await this.fileExplorerService.getHomeDirectory();

            // Use home directory if path is empty
            const targetPath = path || homeDir;

            // Normalize path
            const normalizedPath = targetPath.startsWith(homeDir) ? targetPath : homeDir;

            // Split path and get each directory
            const pathParts = normalizedPath
                .replace(homeDir, '')
                .split('/')
                .filter((part) => part);

            // Load home directory contents
            const homeItems = await this.fileExplorerService.readDirectory(homeDir);
            this.columns = [homeItems];
            this.columnPaths = ['Home'];
            this.selectedPath = homeDir;

            // Load contents of each directory
            let currentPath = homeDir;
            for (const part of pathParts) 
            {
                const nextPath = `${currentPath}${currentPath.endsWith('/') ? '' : '/'}${part}`;
                const items = await this.fileExplorerService.readDirectory(nextPath);

                this.columns.push(items);
                this.columnPaths.push(part);
                this.selectedPath = nextPath;
                currentPath = nextPath;
            }

            // Initialize column widths
            this.columnWidths = this.columns.map(() => this.DEFAULT_COLUMN_WIDTH);
        }
        catch (error) 
        {
            console.error('Error loading directory structure:', error);
            this.error = 'Error loading directory structure';
        }
    }

    async onItemSelected(item: FileItem, columnIndex: number): Promise<void> 
    {
        if (item.isDirectory) 
        {
            this.selectedPath = item.path;
            // Remove columns to the right of the selected column
            this.columns = this.columns.slice(0, columnIndex + 1);
            this.columnPaths = this.columnPaths.slice(0, columnIndex + 1);

            try 
            {
                // Load contents of the new directory
                const items = await this.fileExplorerService.readDirectory(item.path);
                this.columns.push(items);
                this.columnPaths.push(item.name);
                // Update column widths when new column is added
                this.columnWidths = this.columns.map(
                    (_, i) => this.columnWidths[i] || this.DEFAULT_COLUMN_WIDTH
                );
            }
            catch (error) 
            {
                console.error('Error loading directory contents:', error);
                this.error = 'Error loading directory contents';
            }
        }
        this.itemClick.emit(item);
    }

    async getColumnPath(index: number): Promise<string> 
    {
        if (index === 0) 
        {
            return 'Home';
        }

        try 
        {
            // Normalize path and get relative path from home directory
            const homeDir = await this.fileExplorerService.getHomeDirectory();
            const relativePath = this.selectedPath.replace(homeDir, '').replace(/^\/+/, '');
            const pathParts = relativePath.split('/').filter((part) => part);

            // Return the path part corresponding to the current column
            if (index <= pathParts.length) 
            {
                return pathParts[index - 1];
            }

            return 'Unknown';
        }
        catch (error) 
        {
            console.error('Error getting column path:', error);
            return 'Unknown';
        }
    }

    startResize(event: MouseEvent, index: number): void 
    {
        this.isResizing = true;
        this.currentResizeIndex = index;
        this.startX = event.clientX;
        this.startWidth = this.columnWidths[index];
        event.preventDefault();
    }

    @HostListener('document:mousemove', ['$event'])
    onMouseMove(event: MouseEvent): void 
    {
        if (!this.isResizing) 
        {
            return;
        }

        const diff = event.clientX - this.startX;
        this.columnWidths[this.currentResizeIndex] = Math.max(100, this.startWidth + diff);
    }

    @HostListener('document:mouseup')
    onMouseUp(): void 
    {
        this.isResizing = false;
    }

    onDragStart(event: DragEvent, item: FileItem): void 
    {
        event.dataTransfer?.setData('text/plain', JSON.stringify(item));
    }

    onDragEnd(event: DragEvent): void 
    {
        event.preventDefault();
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
}
