import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild,
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ContextMenuComponent } from '../../components/context-menu/context-menu.component';
import { FileItem } from '../../models/file-item.model';
import { ContextMenuService } from '../../services/context-menu.service';
import { FileExplorerService } from '../../services/file-explorer.service';
import { ViewActionService } from '../../services/view-action.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-list-view',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatMenuModule,
        MatProgressSpinnerModule,
        MatDialogModule,
        TranslateModule,
        ContextMenuComponent,
        MatTooltipModule,
    ],
    templateUrl: './view-list.component.html',
    styleUrls: ['./view-list.component.scss'],
})
export class ViewListComponent implements OnInit, OnDestroy 
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

    sortField: 'name' | 'type' | 'modified' | 'size' = 'name';
    sortOrder: 'asc' | 'desc' = 'asc';

    private _items: FileItem[] = [];
    private subscriptions: Subscription[] = [];

    constructor(
        public fileExplorerService: FileExplorerService,
        private dialog: MatDialog,
        public contextMenuService: ContextMenuService,
        private viewActionService: ViewActionService
    ) 
    {}

    ngOnInit(): void 
    {
        this.sortItems();

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
    }

    @Input() set items(value: FileItem[]) 
    {
        this._items = value;
        this.sortItems();
    }
    get items(): FileItem[] 
    {
        return this._items;
    }

    onSort(field: 'name' | 'type' | 'modified' | 'size'): void 
    {
        if (this.sortField === field) 
        {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        }
        else 
        {
            this.sortField = field;
            this.sortOrder = 'asc';
        }
        this.sortItems();
    }

    private sortItems(): void 
    {
        this.items.sort((a, b) => 
        {
            let comparison = 0;

            // Always place directories at the beginning
            if (a.isDirectory !== b.isDirectory) 
            {
                return a.isDirectory ? -1 : 1;
            }

            switch (this.sortField) 
            {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'type':
                    comparison = (a.type || '').localeCompare(b.type || '');
                    break;
                case 'modified':
                    const aTime = a.modified ? new Date(a.modified).getTime() : 0;
                    const bTime = b.modified ? new Date(b.modified).getTime() : 0;
                    comparison = aTime - bTime;
                    break;
                case 'size':
                    if (a.isDirectory && b.isDirectory) 
                    {
                        comparison = 0;
                    }
                    else if (a.isDirectory) 
                    {
                        comparison = -1;
                    }
                    else if (b.isDirectory) 
                    {
                        comparison = 1;
                    }
                    else 
                    {
                        comparison = (a.size || 0) - (b.size || 0);
                    }
                    break;
            }

            return this.sortOrder === 'asc' ? comparison : -comparison;
        });
    }

    onItemClick(item: FileItem): void 
    {
        this.viewActionService.onItemClick(item);
    }

    onDragStart(event: DragEvent, item: FileItem): void 
    {
        this.viewActionService.onDragStart(event, item, 'copy');
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
